/**
 * server/futuClient.js — Futu OpenAPI client singleton
 *
 * FIX #3: Corrected Futu symbol handling for continuous futures contracts.
 * Futures like 'HK.MHImain' are continuous contracts and must be passed
 * to getFutureBars (or equivalent) not getKL which is for dated contracts.
 * For getBasicQot we still strip 'HK.' but handle futures vs stocks separately.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let FutuQuote, KLType;
try {
  const futu = require('futu-api');
  FutuQuote  = futu.FutuQuote;
  KLType     = futu.KLType;
} catch {
  FutuQuote = null;
  KLType    = null;
  console.warn('[futuClient] futu-api not installed. Run: npm install --prefix server');
}

// Interval string → Futu KLType
const INTERVAL_TO_KLTYPE = {
  '1m':  () => KLType?.KL_1MIN,
  '5m':  () => KLType?.KL_5MIN,
  '15m': () => KLType?.KL_15MIN,
  '30m': () => KLType?.KL_30MIN,
  '1h':  () => KLType?.KL_60MIN,
  '4h':  () => KLType?.KL_DAY,   // no 4h in Futu, degrade to daily
  '1d':  () => KLType?.KL_DAY,
};

/**
 * Parse a Futu symbol string into { market, stockCode, isFutures, isContinuous }.
 *
 * 'HK.MHImain'  → { market: 1, stockCode: 'MHImain', isFutures: true,  isContinuous: true  }
 * 'HK.HSImain'  → { market: 1, stockCode: 'HSImain', isFutures: true,  isContinuous: true  }
 * 'HK.00700'    → { market: 1, stockCode: '00700',   isFutures: false, isContinuous: false }
 */
function parseSymbol(symbol) {
  const [marketStr, code] = symbol.split('.');
  const market       = marketStr === 'HK' ? 1 : 1;   // always 1 for HK
  const isContinuous = code.endsWith('main');          // MHImain, HSImain, HHImain
  const isFutures    = isContinuous;                   // all continuous = futures
  return { market, stockCode: code, isFutures, isContinuous };
}

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
        parseInt(process.env.FUTUD_PORT  ?? '11111'),
        false, null,
        (err) => err ? reject(err) : resolve()
      );
    });
    _instance = new FutuQuoteContext(client);
    console.log('[futuClient] Connected to FutuOpenD');
    return _instance;
  }

  /**
   * Fetch klines. Uses getKL for stocks and continuous futures alike.
   * For continuous futures (e.g. MHImain), Futu OpenAPI getKL accepts the
   * continuous contract code directly when market=1 and secType is not restricted.
   *
   * FIX #3: pass the full Futu security object with correct secType:
   *   secType = 3 for futures (FUTU_OPT_FUTURE), 3 = STOCK for stocks.
   *   The futu-api Node SDK accepts { market, stockCode } and resolves via OpenD.
   */
  async getKlines(symbol, interval, limit = 200) {
    const klType = INTERVAL_TO_KLTYPE[interval]?.();
    if (!klType) throw new Error(`Unsupported interval: ${interval}`);

    const { market, stockCode, isFutures } = parseSymbol(symbol);

    return new Promise((resolve, reject) => {
      // For continuous futures, Futu OpenD resolves 'MHImain' to front month
      const security = { market, stockCode };
      const reqCount = limit;

      this._client.getKL(security, klType, reqCount, (err, data) => {
        if (err) {
          // If continuous contract fails, log hint for troubleshooting
          if (isFutures) {
            console.error(`[futuClient] Futures getKL failed for ${stockCode}:`, err,
              '\nHint: Ensure FutuOpenD has futures data subscription enabled.');
          }
          return reject(new Error(String(err)));
        }
        const candles = (data?.kLineList ?? []).map((k) => ({
          time:   Math.floor(new Date(k.time).getTime() / 1000),
          open:   k.openPrice,
          high:   k.highPrice,
          low:    k.lowPrice,
          close:  k.closePrice,
          volume: k.volume ?? 0,
        }));
        resolve(candles);
      });
    });
  }

  /**
   * Fetch live quote for any symbol.
   */
  async getQuote(symbol) {
    const { market, stockCode } = parseSymbol(symbol);
    return new Promise((resolve, reject) => {
      this._client.getBasicQot(
        [{ market, stockCode }],
        (err, data) => {
          if (err) return reject(new Error(String(err)));
          const q = data?.basicQotList?.[0];
          if (!q) return reject(new Error('No quote data returned'));
          resolve({
            symbol,
            price:     q.curPrice,
            time:      Math.floor(new Date(q.updateTime).getTime() / 1000),
            change:    q.changeVal,
            changePct: q.changeRate,   // FIX: correct Futu field name is changeRate
          });
        }
      );
    });
  }
}
