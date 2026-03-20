/**
 * src/utils/maTrend.ts — K均交易法 v2
 *
 * Classifies the current market trend using the triple MA stack
 * (MA5 / MA30 / MA150). This is the book's ONLY trend filter —
 * no other indicators are used.
 *
 * TREND CLASSIFICATION:
 *   BULL  — MA5 > MA30 > MA150  (all three aligned upward)
 *            → Only LONG trades allowed
 *   BEAR  — MA5 < MA30 < MA150  (all three aligned downward)
 *            → Only SHORT trades allowed
 *   RANGE — any other arrangement (mixed / transitioning)
 *            → NO TRADES. Stand aside completely.
 *
 * WHY MA5 / MA30 / MA150:
 *   - MA5   reacts to price within 5 candles — confirms short-term momentum
 *   - MA30  is the dynamic support/resistance anchor — entry must be near it
 *   - MA150 defines the macro trend — prevents trading counter-trend
 *   Yahoo Finance 1h data returns ~375 candles (60d), so MA150 needs
 *   150 candles for warmup → safe with DEFAULT_CANDLE_LIMIT = 400.
 *
 * MA30 PROXIMITY RULE ("靠近均線入場"):
 *   The book says entries should be made NEAR the trend MA, not after
 *   price has already run far from it. ma30Role() enforces this:
 *   - For LONG: price must be within 0.8% ABOVE MA30 (support role)
 *   - For SHORT: price must be within 0.8% BELOW MA30 (resistance role)
 *   - If price is too far from MA30 (e.g. already moved 2%): skip, wait.
 *   0.8% is wider than the old 0.5% (MA20) because MA30 moves more slowly
 *   and price naturally deviates more from it.
 */

import { Candle } from '../types/binance';
import { getLatestSMA } from './ma';

// ── Types ──────────────────────────────────────────────────────────────────

export type MATrend = 'BULL' | 'BEAR' | 'RANGE';

export interface MAStack {
  trend: MATrend;
  ma5:   number;
  ma30:  number;
  ma150: number;
}

// ── Core function ──────────────────────────────────────────────────────────

/**
 * Computes the triple MA stack and classifies the trend.
 *
 * @param candles    - Full candle history (needs ≥ slowPeriod bars)
 * @param fastPeriod - Default 5  (MA5)
 * @param midPeriod  - Default 30 (MA30)
 * @param slowPeriod - Default 150 (MA150)
 * @returns MAStack with trend + three MA values, or null if not enough data
 */
export function getMATrend(
  candles:     Candle[],
  fastPeriod   = 5,
  midPeriod    = 30,
  slowPeriod   = 150,
): MAStack | null {
  // getLatestSMA returns null if candles.length < period
  const ma5   = getLatestSMA(candles, fastPeriod);
  const ma30  = getLatestSMA(candles, midPeriod);
  const ma150 = getLatestSMA(candles, slowPeriod);

  // If any MA cannot be computed, we have insufficient data
  if (ma5 === null || ma30 === null || ma150 === null) return null;

  let trend: MATrend;
  if      (ma5 > ma30 && ma30 > ma150) trend = 'BULL';
  else if (ma5 < ma30 && ma30 < ma150) trend = 'BEAR';
  else                                  trend = 'RANGE';

  return { trend, ma5, ma30, ma150 };
}

// ── Proximity helper ───────────────────────────────────────────────────────

/**
 * Checks whether MA30 is acting as dynamic support or resistance
 * for the current price, and whether price is close enough to trade.
 *
 * @param price        - Current candle close price
 * @param ma30         - Current MA30 value
 * @param proximityPct - Max allowed distance from MA30 as a fraction.
 *                       Default 0.008 = 0.8%.
 *
 * @returns
 *   'support'    — price is ABOVE MA30 and within proximityPct of it
 *                  ✅ Valid LONG entry zone
 *   'resistance' — price is BELOW MA30 and within proximityPct of it
 *                  ✅ Valid SHORT entry zone
 *   null         — price is too far from MA30 (don't chase — wait for pullback)
 *
 * EXAMPLE (LONG):
 *   price = 23.80, MA30 = 23.65
 *   distance = |23.80 - 23.65| / 23.65 = 0.63%  → within 0.8% → 'support' ✅
 *
 * EXAMPLE (TOO FAR):
 *   price = 24.20, MA30 = 23.65
 *   distance = |24.20 - 23.65| / 23.65 = 2.33%  → exceeds 0.8% → null ❌
 */
export function ma30Role(
  price:        number,
  ma30:         number,
  proximityPct  = 0.008,
): 'support' | 'resistance' | null {
  const distance = Math.abs(price - ma30) / ma30;
  if (distance > proximityPct) return null;
  // price >= ma30 means price is on or above MA30 — support role
  return price >= ma30 ? 'support' : 'resistance';
}