import { Candle, SignalEvent } from '../types/binance';
import { getLatestSMA } from './ma';

// K均交易法 Signal Detection
// Rule: Price near MA + new high (LONG) or new low (SHORT)
// "到位就動，不到位就不動"
export function detectSignal(
  candles: Candle[],
  ma20Period = 20,
  ma60Period = 60,
  proximityPct = 0.005 // within 0.5% of MA
): SignalEvent | null {
  if (candles.length < ma60Period + 2) return null;

  const latest = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  const ma20 = getLatestSMA(candles, ma20Period);
  const ma60 = getLatestSMA(candles, ma60Period);

  if (!ma20 || !ma60) return null;

  const price = latest.close;
  const nearMA20 = Math.abs(price - ma20) / ma20 < proximityPct;
  const nearMA60 = Math.abs(price - ma60) / ma60 < proximityPct;

  // LONG signal: price above MA20, new high near MA20
  if (
    price > ma20 &&
    latest.high > prev.high &&
    nearMA20
  ) {
    return {
      type: 'LONG',
      price,
      ma: ma20,
      time: latest.time,
      message: `🟢 LONG訊號！價格 $${price} 在MA20($${ma20})上方創新高`,
    };
  }

  // SHORT signal: price below MA60, new low near MA60
  if (
    price < ma60 &&
    latest.low < prev.low &&
    nearMA60
  ) {
    return {
      type: 'SHORT',
      price,
      ma: ma60,
      time: latest.time,
      message: `🔴 SHORT訊號！價格 $${price} 在MA60($${ma60})下方創新低`,
    };
  }

  return null;
}
