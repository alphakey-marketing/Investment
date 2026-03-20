/**
 * server/index.js — Yahoo Finance proxy for K均交易法
 *
 * Replit-hosted mode: Yahoo Finance only.
 *
 * Routes:
 *   GET /api/health
 *   GET /api/yahoo-klines/:ticker/:interval
 *   GET * (serves built React app for SPA routing)
 *
 * Security: D2 CORS · D3 rate-limit · D4 allowlists · D5 proxy secret
 */
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
// In Replit production, PORT is set to 5000 automatically
// In development, use 3001 if PROXY_PORT is not set
const PORT = process.env.PORT ?? (process.env.NODE_ENV === 'production' ? 5000 : (process.env.PROXY_PORT ?? 3001));

// ── D2: CORS ─────────────────────────────────────────────────────────────────────────────
// Allow all origins in Replit (origin is dynamic per repl URL).
// For production, replace '*' with your specific Replit URL.
app.use(cors({ origin: '*' }));
app.use(express.json());

// Trust proxy to correctly identify client IP when behind a proxy
app.set('trust proxy', 1);

// ── D3: Rate limiting — 60 req / IP / min ────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please wait a minute.' },
  skip: (req) => !req.ip, // Skip rate limit if IP cannot be determined
});
app.use('/api/', apiLimiter);

// ── D4: Allowlists ───────────────────────────────────────────────────────────────────────
const ALLOWED_YAHOO_TICKERS = new Set([
  '3081.HK',  // Value Gold ETF
]);

const ALLOWED_INTERVALS = new Set(['5m', '15m', '1h', '4h', '1d']);

// ── D5: Proxy secret (optional, skip in dev) ──────────────────────────────────────────
const PROXY_SECRET = process.env.PROXY_SECRET || '';
function requireProxySecret(req, res, next) {
  if (!PROXY_SECRET) return next(); // skip if not configured
  const header = req.header('x-proxy-secret');
  if (!header || header !== PROXY_SECRET)
    return res.status(401).json({ error: 'Unauthorized' });
  next();
}
app.use('/api/', requireProxySecret);

// ── Yahoo Finance helpers ────────────────────────────────────────────────────────────────────

// Map app intervals → Yahoo v8 API params
const YAHOO_PARAMS = {
  '5m':  { interval: '5m',  range: '5d'   },
  '15m': { interval: '15m', range: '10d'  },
  '1h':  { interval: '60m', range: '60d'  },
  '4h':  { interval: '60m', range: '30d'  }, // Yahoo has no 4h; serve 1h bars
  '1d':  { interval: '1d',  range: '2y'   },
};

// Yahoo v8 chart API — server-to-server, no CORS issue
async function fetchYahooCandles(ticker, appInterval) {
  const { interval, range } = YAHOO_PARAMS[appInterval];

  // Try query1 first, fall back to query2 if blocked
  const hosts = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];
  let lastErr;

  for (const host of hosts) {
    const url = `https://${host}/v8/finance/chart/${encodeURIComponent(ticker)}` +
      `?interval=${interval}&range=${range}&includePrePost=false&events=div%2Csplit`;

    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(12000),
        headers: {
          'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept':          'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer':         'https://finance.yahoo.com/',
          'Origin':          'https://finance.yahoo.com',
        },
      });

      if (!res.ok) {
        lastErr = new Error(`Yahoo HTTP ${res.status} from ${host}`);
        continue; // try next host
      }

      const json = await res.json();
      const result = json?.chart?.result?.[0];

      if (!result) {
        const errMsg = json?.chart?.error?.description ?? 'No chart result';
        lastErr = new Error(`Yahoo: ${errMsg}`);
        continue;
      }

      const timestamps = result.timestamp ?? [];
      const q = result.indicators?.quote?.[0] ?? {};

      const candles = timestamps
        .map((t, i) => ({
          time:   t,
          open:   q.open?.[i]   ?? q.close?.[i] ?? null,
          high:   q.high?.[i]   ?? q.close?.[i] ?? null,
          low:    q.low?.[i]    ?? q.close?.[i] ?? null,
          close:  q.close?.[i]  ?? null,
          volume: q.volume?.[i] ?? 0,
        }))
        .filter((c) => c.close !== null && c.open !== null && c.close > 0);

      if (candles.length === 0) {
        lastErr = new Error(`Yahoo returned 0 valid candles for ${ticker}`);
        continue;
      }

      console.log(`[yahoo] ✔ ${host} → ${ticker} ${appInterval} → ${candles.length} candles`);
      return candles;

    } catch (e) {
      lastErr = e;
      console.warn(`[yahoo] ✖ ${host} failed: ${e.message}`);
    }
  }

  throw lastErr ?? new Error('All Yahoo hosts failed');
}

// ── Health check ──────────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    mode: 'yahoo-only',
    symbols: ['3081.HK'],
  });
});

// ── Yahoo Kline endpoint ───────────────────────────────────────────────────────────────────
app.get('/api/yahoo-klines/:ticker/:interval', async (req, res) => {
  const { ticker, interval } = req.params;

  if (!ALLOWED_YAHOO_TICKERS.has(ticker) || !ALLOWED_INTERVALS.has(interval)) {
    return res.status(400).json({ error: `Invalid ticker "${ticker}" or interval "${interval}"` });
  }

  try {
    const candles = await fetchYahooCandles(ticker, interval);
    res.json(candles);
  } catch (err) {
    console.error('[yahoo] route error:', err.message);
    res.status(502).json({ error: `Yahoo fetch failed: ${err.message}` });
  }
});

// ── Serve built React app (SPA fallback) ────────────────────────────────────────────────────
const distPath = join(__dirname, '../dist');

// Serve static assets with long-term caching for versioned files
app.use(express.static(distPath, {
  maxAge: '1d',      // Cache versioned assets (JS, CSS with hash in filename)
  immutable: true,   // Mark as immutable since hashes change on build
  etag: false,
}));

// SPA routing fallback — serve index.html for all non-API routes
// Don't cache index.html so users get fresh content
app.get('*', (_req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🟢 Server ready on http://localhost:${PORT}`);
  console.log(`   React App: http://localhost:${PORT}`);
  console.log(`   API Endpoint : GET /api/yahoo-klines/3081.HK/:interval`);
  console.log(`   Intervals: 5m | 15m | 1h | 4h | 1d`);
  console.log(`   Health   : http://localhost:${PORT}/api/health\n`);
});
