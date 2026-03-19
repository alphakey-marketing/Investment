/**
 * server/index.js — Futu OpenAPI proxy for K均交易法
 *
 * Updated for HK.03081 Value Gold ETF (futures symbols removed).
 *
 * Architecture:
 *   React app (port 5173)
 *     → GET /api/klines/:symbol/:interval
 *     → GET /api/quote/:symbol
 *   Express proxy (port 3001)
 *     → FutuOpenD (port 11111, running on your Mac/PC)
 *
 * SETUP (run once after cloning):
 *   1. npm install --prefix server
 *   2. Download FutuOpenD from https://www.futunn.com/download/OpenAPI
 *   3. Launch FutuOpenD, log in with your Futu/Moomoo account
 *   4. npm run server          ← in one terminal
 *      npm run dev             ← in another terminal
 *
 * Security hardening (D2–D5):
 *   D2 — CORS locked to explicit origin allowlist
 *   D3 — Rate limiting: 120 req / IP / min on all /api/* routes
 *   D4 — Symbol + interval allowlist validation
 *   D5 — Shared proxy secret via x-proxy-secret header
 */
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { FutuQuoteContext } from './futuClient.js';

const app = express();
const PORT = process.env.PROXY_PORT ?? 3001;

// ── D2: CORS — explicit origin allowlist ───────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin "${origin}" not allowed`));
  },
}));

app.use(express.json());

// ── D3: Rate limiting ───────────────────────────────────────────────────────
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
  'HK.03081',   // Value Gold ETF
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

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), source: 'futu-proxy' });
});

// ── Kline (candlestick) endpoint ────────────────────────────────────────────────
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

// ── Live quote endpoint ───────────────────────────────────────────────────────────
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
  console.log(`   Connecting to FutuOpenD at localhost:11111`);
  console.log(`   Symbols: HK.03081 (Value Gold ETF)`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
