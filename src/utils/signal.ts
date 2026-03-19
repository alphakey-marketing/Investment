import { Candle, SignalEvent } from '../types/binance';
import { getLatestSMA } from './ma';
import { isHKTradingHours, formatHKT } from './hkSession';

/**
 * detectSignal — K均 signal detection for HK ETF (03081)
 *
 * Fix 8 — Symmetric MA:
 *   Both LONG and SHORT now use ma20Period (MA20) as the anchor.
 *   Previously SHORT used MA60, causing asymmetric signal frequency.
 *   A SHORT signal fires when price is BELOW MA20 and makes a new low
 *   near MA20 — mirror image of the LONG condition.
 */
export function detectSignal(
  candles: Candle[],
  ma20Period = 20,
  ma60Period = 60,   // kept as param for SMA calculation but no longer used as SHORT anchor
  proximityPct = 0.005
): SignalEvent | null {
  if (candles.length < ma60Period + 2) return null;

  const latest = candles[candles.length - 1];
  const prev   = candles[candles.length - 2];
  const ma20   = getLatestSMA(candles, ma20Period);
  const ma60   = getLatestSMA(candles, ma60Period); // still calculated for display in SignalPanel

  if (!ma20 || !ma60) return null;

  // ── HK Session Filter ────────────────────────────────────────────────────
  // ETF (03081) has no evening session — pass false for includeFuturesEvening
  if (!isHKTradingHours(latest.time, false)) return null;

  const price    = latest.close;
  // Fix 8: both directions anchor to MA20
  const nearMA20 = Math.abs(price - ma20) / ma20 < proximityPct;
  const hkt      = formatHKT(latest.time);

  if (price > ma20 && latest.high > prev.high && nearMA20) {
    return {
      type: 'LONG',
      price,
      ma: ma20,
      time: latest.time,
      message: `🟢 LONG訊號! ${price.toFixed(2)} 在MA${ma20Period}(${ma20.toFixed(2)})上方創新高 · ${hkt}`,
    };
  }

  // Fix 8: SHORT now mirrors LONG — anchors to MA20, not MA60
  if (price < ma20 && latest.low < prev.low && nearMA20) {
    return {
      type: 'SHORT',
      price,
      ma: ma20,
      time: latest.time,
      message: `🔴 SHORT訊號! ${price.toFixed(2)} 在MA${ma20Period}(${ma20.toFixed(2)})下方創新低 · ${hkt}`,
    };
  }

  return null;
}
