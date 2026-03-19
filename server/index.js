/**
 * server/index.js — Futu OpenAPI proxy + Yahoo server-side fallback
 *
 * Data source priority:
 *   1. GET /api/klines/:symbol/:interval     — Futu OpenD (local only)
 *   2. GET /api/yahoo-klines/:ticker/:interval — Yahoo Finance server-side
 *                                               (works on Replit, no CORS proxy)
 *
 * Architecture:
 *   React app
 *     → /api/klines        → FutuOpenD (localhost:11111)
 *     → /api/yahoo-klines  → Yahoo Finance API (server-to-server, no CORS issue)
 *
 * Security: D2 CORS · D3 rate-limit · D4 allowlists · D5 proxy secret
 */
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { FutuQuoteContext } from './futuClient.js';

const app = express();
const PORT = process.env.PROXY_PORT ?? 3001;

// ── D2: CORS allowlist ────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  // Add your Replit/deployed frontend URL here, e.g.:
  // 'https://your-repl.replit.app',
];

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin "${origin}" not allowed`));
  },
}));

app.use(express.json());

// ── D3: Rate limiting — 120 req / IP / min ───────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// ── D4: Allowlists ────────────────────────────────────────────────────────────
const ALLOWED_SYMBOLS = new Set([
  'HK.03081',  // Value Gold ETF (Futu symbol)
]);

// Yahoo ticker allowlist — validated server-side before fetching
const ALLOWED_YAHOO_TICKERS = new Set([
  '3081.HK',   // Value Gold ETF on Yahoo Finance
]);

const ALLOWED_INTERVALS = new Set(['5m', '15m', '1h', '4h', '1d']);

// ── D5: Proxy shared-secret middleware ───────────────────────────────────────
const PROXY_SECRET = process.env.PROXY_SECRET || 'dev-secret-change-me';

function requireProxySecret(req, res, next) {
  if (PROXY_SECRET === 'dev-secret-change-me') return next();
  const header = req.header('x-proxy-secret');
  if (!header || header !== PROXY_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: missing or invalid proxy secret' });
  }
  next();
}
app.use('/api/', requireProxySecret);

// ── Yahoo Finance helpers ─────────────────────────────────────────────────────

// Map app intervals → Yahoo v8 API params
const YAHOO_PARAMS = {
  '5m':  { interval: '5m',  range: '5d'  },
  '15m': { interval: '15m', range: '10d' },
  '1h':  { interval: '60m', range: '60d' },
  '4h':  { interval: '60m', range: '30d' }, // Yahoo has no native 4h; use 1h bars
  '1d':  { interval: '1d',  range: '2y'  },
};

/**
 * Fetch OHLCV candles from Yahoo Finance v8 chart API.
 * Server-to-server — no CORS proxy needed.
 * Returns Candle[] in the same format as the Futu route.
 */
async function fetchYahooCandles(ticker, appInterval) {
  const { interval, range } = YAHOO_PARAMS[appInterval];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}&includePrePost=false`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    headers: {
      // Mimic a browser request to avoid Yahoo bot detection
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://finance.yahoo.com',
      'Referer': 'https://finance.yahoo.com/',
    },
  });

  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error('Yahoo returned no chart result');

  const timestamps = result.timestamp ?? [];
  const q = result.indicators?.quote?.[0] ?? {};

  const candles = timestamps
    .map((t, i) => ({
      time:   t,
      open:   q.open?.[i]   ?? q.close?.[i] ?? 0,
      high:   q.high?.[i]   ?? q.close?.[i] ?? 0,
      low:    q.low?.[i]    ?? q.close?.[i] ?? 0,
      close:  q.close?.[i]  ?? 0,
      volume: q.volume?.[i] ?? 0,
    }))
    .filter((c) => c.close > 0 && c.open > 0);

  if (candles.length === 0) throw new Error('Yahoo returned empty OHLCV data');
  return candles;
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), source: 'futu-proxy' });
});

// ── Futu Kline endpoint ───────────────────────────────────────────────────────
// GET /api/klines/:symbol/:interval?limit=200
// Requires FutuOpenD running locally.
app.get('/api/klines/:symbol/:interval', async (req, res) => {
  const { symbol, interval } = req.params;
  const limit = parseInt(req.query.limit) || 200;

  if (!ALLOWED_SYMBOLS.has(symbol) || !ALLOWED_INTERVALS.has(interval)) {
    return res.status(400).json({ error: 'Invalid symbol or interval' });
  }

  try {
    const ctx = await FutuQuoteContext.getInstance();
    const candles = await ctx.getKlines(symbol, interval, limit);
    res.json(candles);
  } catch (err) {
    console.error('[proxy] klines error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Yahoo Kline endpoint ──────────────────────────────────────────────────────
// GET /api/yahoo-klines/:ticker/:interval
// Server-side Yahoo fetch — works from Replit without FutuOpenD.
// ticker   — Yahoo Finance ticker e.g. "3081.HK"
// interval — "5m" | "15m" | "1h" | "4h" | "1d"
app.get('/api/yahoo-klines/:ticker/:interval', async (req, res) => {
  const { ticker, interval } = req.params;

  if (!ALLOWED_YAHOO_TICKERS.has(ticker) || !ALLOWED_INTERVALS.has(interval)) {
    return res.status(400).json({ error: 'Invalid ticker or interval' });
  }

  try {
    const candles = await fetchYahooCandles(ticker, interval);
    console.log(`[yahoo] ${ticker} ${interval} → ${candles.length} candles`);
    res.json(candles);
  } catch (err) {
    console.error('[yahoo] fetch error:', err.message);
    res.status(502).json({ error: `Yahoo fetch failed: ${err.message}` });
  }
});

// ── Live quote endpoint ───────────────────────────────────────────────────────
// GET /api/quote/:symbol
app.get('/api/quote/:symbol', async (req, res) => {
  const { symbol } = req.params;

  if (!ALLOWED_SYMBOLS.has(symbol)) {
    return res.status(400).json({ error: 'Invalid symbol' });
  }

  try {
    const ctx = await FutuQuoteContext.getInstance();
    const quote = await ctx.getQuote(symbol);
    res.json(quote);
  } catch (err) {
    console.error('[proxy] quote error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🟢 Futu proxy running on http://localhost:${PORT}`);
  console.log(`   FutuOpenD klines : /api/klines/HK.03081/:interval`);
  console.log(`   Yahoo fallback   : /api/yahoo-klines/3081.HK/:interval`);
  console.log(`   Health           : http://localhost:${PORT}/api/health\n`);
});
