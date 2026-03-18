/**
 * server/index.js — Futu OpenAPI proxy for K均交易法
 *
 * This Express server sits between the React app and Futu OpenD.
 * It translates REST requests from the frontend into Futu OpenAPI
 * calls via futu-api (the official Node.js SDK).
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
 * FutuOpenD default connection: localhost:11111
 *
 * Sprint 1 security hardening (D2–D5):
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

// ── D2: CORS — explicit origin allowlist ───────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  // Add your deployed frontend URL here, e.g.:
  // 'https://your-app.netlify.app',
];

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin "${origin}" not allowed`));
  },
}));

app.use(express.json());

// ── D3: Rate limiting — 120 req / IP / min on all /api/* routes ────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 120,              // max requests per window per IP
  standardHeaders: true, // return RateLimit-* headers
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/api/', apiLimiter);

// ── D4: Allowlists for symbol + interval ───────────────────────────────────
const ALLOWED_SYMBOLS = new Set([
  'HK.MHImain',
  'HK.HSImain',
  'HK.HHImain',
  'HK.CBAImain',
]);

const ALLOWED_INTERVALS = new Set(['5m', '15m', '1h', '4h', '1d']);

// ── D5: Proxy shared-secret middleware ─────────────────────────────────────
const PROXY_SECRET = process.env.PROXY_SECRET || 'dev-secret-change-me';

function requireProxySecret(req, res, next) {
  // Skip secret check in development when using the default placeholder
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

// ── Kline (candlestick) endpoint ────────────────────────────────────────────
// GET /api/klines/:symbol/:interval?limit=200
// symbol   — Futu symbol e.g. "HK.MHImain", "HK.HSImain"
// interval — "5m" | "15m" | "1h" | "4h" | "1d"
// limit    — number of candles (default 200)
app.get('/api/klines/:symbol/:interval', async (req, res) => {
  const { symbol, interval } = req.params;
  const limit = parseInt(req.query.limit) || 200;

  // D4: validate symbol and interval
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

// ── Live quote endpoint ─────────────────────────────────────────────────────
// GET /api/quote/:symbol
// Returns { symbol, price, time, change, changePct }
app.get('/api/quote/:symbol', async (req, res) => {
  const { symbol } = req.params;

  // D4: validate symbol
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
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
