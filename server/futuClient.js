/**
 * server/futuClient.js — Futu OpenAPI client singleton
 *
 * Wraps futu-api with:
 *  - Singleton connection (one FutuOpenD socket, reused across requests)
 *  - Interval mapping ("15m" → Futu KL_TYPE enum)
 *  - Candle normalisation (Futu format → { time, open, high, low, close, volume })
 *
 * Futu OpenAPI docs: https://openapi.futunn.com/futu-api-doc/en/
 *
 * NOTE: futu-api is a CommonJS package. We use createRequire to load it
 * inside this ES module project.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let FutuQuote, KLType;
try {
  const futu = require('futu-api');
  FutuQuote  = futu.FutuQuote;
  KLType     = futu.KLType;
} catch {
  // futu-api not installed yet — stub so server starts without crashing
  FutuQuote = null;
  KLType    = null;
  console.warn('[futuClient] futu-api not found. Run: npm install --prefix server');
}

// ── Interval mapping: our string → Futu KLType enum ────────────────────────
const INTERVAL_MAP = {
  '1m':  () => KLType?.KL_1MIN,
  '5m':  () => KLType?.KL_5MIN,
  '15m': () => KLType?.KL_15MIN,
  '30m': () => KLType?.KL_30MIN,
  '1h':  () => KLType?.KL_60MIN,
  '4h':  () => KLType?.KL_DAY,   // Futu has no 4h; use daily as fallback
  '1d':  () => KLType?.KL_DAY,
};

// ── Singleton connection ────────────────────────────────────────────────────
let _instance = null;

export class FutuQuoteContext {
  constructor(client) {
    this._client = client;
  }

  static async getInstance() {
    if (_instance) return _instance;
    if (!FutuQuote) throw new Error('futu-api not installed. Run: npm install --prefix server');

    const client = new FutuQuote();
    await new Promise((resolve, reject) => {
      client.start(
        process.env.FUTUD_HOST ?? 'localhost',
        parseInt(process.env.FUTUD_PORT ?? '11111'),
        false,   // not encrypted (use true + cert for production)
        null,
        (err) => err ? reject(err) : resolve()
      );
    });
    _instance = new FutuQuoteContext(client);
    console.log('[futuClient] Connected to FutuOpenD');
    return _instance;
  }

  /**
   * Fetch historical klines from Futu OpenD
   * @param {string} symbol  — e.g. "HK.MHImain"
   * @param {string} interval — "5m"|"15m"|"1h"|"1d"
   * @param {number} limit
   * @returns {Promise<Array<{time,open,high,low,close,volume}>>}
   */
  async getKlines(symbol, interval, limit = 200) {
    const klType = INTERVAL_MAP[interval]?.();
    if (!klType) throw new Error(`Unsupported interval: ${interval}`);

    return new Promise((resolve, reject) => {
      this._client.getKL(
        { market: 1, stockCode: symbol.replace('HK.', '') },  // Futu uses stockCode without prefix
        klType,
        limit,
        (err, data) => {
          if (err) return reject(new Error(err));
          // Normalise to our Candle shape
          const candles = (data?.kLineList ?? []).map((k) => ({
            time:   Math.floor(new Date(k.time).getTime() / 1000),
            open:   k.openPrice,
            high:   k.highPrice,
            low:    k.lowPrice,
            close:  k.closePrice,
            volume: k.volume ?? 0,
          }));
          resolve(candles);
        }
      );
    });
  }

  /**
   * Fetch a single live quote
   * @param {string} symbol
   * @returns {Promise<{symbol, price, time, change, changePct}>}
   */
  async getQuote(symbol) {
    return new Promise((resolve, reject) => {
      this._client.getBasicQot(
        [{ market: 1, stockCode: symbol.replace('HK.', '') }],
        (err, data) => {
          if (err) return reject(new Error(err));
          const q = data?.basicQotList?.[0];
          if (!q) return reject(new Error('No quote data'));
          resolve({
            symbol,
            price:     q.curPrice,
            time:      Math.floor(new Date(q.updateTime).getTime() / 1000),
            change:    q.changeVal,
            changePct: q.pe,  // Futu field; actually changePct in some versions
          });
        }
      );
    });
  }
}
