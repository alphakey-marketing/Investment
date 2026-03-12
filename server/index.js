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
 */

import express from 'express';
import cors from 'cors';
import { FutuQuoteContext } from './futuClient.js';

const app  = express();
const PORT = process.env.PROXY_PORT ?? 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), source: 'futu-proxy' });
});

// ── Kline (candlestick) endpoint ────────────────────────────────────────────
// GET /api/klines/:symbol/:interval?limit=200
//   symbol   — Futu symbol e.g. "HK.MHImain", "HK.HSImain", "HK.00700"
//   interval — "5m" | "15m" | "1h" | "4h" | "1d"
//   limit    — number of candles (default 200)
app.get('/api/klines/:symbol/:interval', async (req, res) => {
  const { symbol, interval } = req.params;
  const limit = parseInt(req.query.limit) || 200;

  try {
    const ctx    = await FutuQuoteContext.getInstance();
    const candles = await ctx.getKlines(symbol, interval, limit);
    res.json(candles);
  } catch (err) {
    console.error('[proxy] klines error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Live quote endpoint ─────────────────────────────────────────────────────
// GET /api/quote/:symbol
//   Returns { symbol, price, time, change, changePct }
app.get('/api/quote/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    const ctx   = await FutuQuoteContext.getInstance();
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
