import { Candle, SignalEvent } from '../types/binance';
import { getLatestSMA } from './ma';
import { isHKTradingHours, formatHKT } from './hkSession';

export function detectSignal(
  candles: Candle[],
  ma20Period = 20,
  ma60Period = 60,
  proximityPct = 0.005
): SignalEvent | null {
  if (candles.length < ma60Period + 2) return null;

  const latest = candles[candles.length - 1];
  const prev   = candles[candles.length - 2];
  const ma20   = getLatestSMA(candles, ma20Period);
  const ma60   = getLatestSMA(candles, ma60Period);

  if (!ma20 || !ma60) return null;

  // ── HK Session Filter ────────────────────────────────────────────────────
  // Suppress signals when HKEX is closed. Futures evening session included.
  if (!isHKTradingHours(latest.time, true)) return null;

  const price    = latest.close;
  const nearMA20 = Math.abs(price - ma20) / ma20 < proximityPct;
  const nearMA60 = Math.abs(price - ma60) / ma60 < proximityPct;
  const hkt      = formatHKT(latest.time);

  if (price > ma20 && latest.high > prev.high && nearMA20) {
    return {
      type: 'LONG',
      price,
      ma: ma20,
      time: latest.time,
      message: `🟢 LONG訊號! 指數 ${price.toFixed(0)} pts 在MA${ma20Period}(${ma20.toFixed(0)})上方創新高 · ${hkt}`,
    };
  }

  if (price < ma60 && latest.low < prev.low && nearMA60) {
    return {
      type: 'SHORT',
      price,
      ma: ma60,
      time: latest.time,
      message: `🔴 SHORT訊號! 指數 ${price.toFixed(0)} pts 在MA${ma60Period}(${ma60.toFixed(0)})下方創新低 · ${hkt}`,
    };
  }

  return null;
}
