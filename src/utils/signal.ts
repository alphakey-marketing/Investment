/**
 * src/utils/signal.ts — K均交易法 v2
 *
 * Replaces the old single-MA proximity + new-high/low detector with a
 * book-aligned 5-gate entry system:
 *
 *   Gate 1 — Session:      HKEX trading hours only (no evening for ETF)
 *   Gate 2 — MA Stack:     Triple MA must be cleanly BULL or BEAR (not RANGE)
 *   Gate 3 — Pivot label:  Latest confirmed swing HIGH must be HH (LONG)
 *                          Latest confirmed swing LOW  must be LL (SHORT)
 *   Gate 4 — Breakout:     Current close must have broken beyond the pivot
 *                          (price > lastSwingHigh for LONG,
 *                           price < lastSwingLow  for SHORT)
 *   Gate 5 — MA30 proximity: Price must be within 0.8% of MA30, which acts
 *                             as dynamic support (LONG) or resistance (SHORT)
 *
 * SL: structure-based — previous swing LOW for LONG,
 *                        previous swing HIGH for SHORT.
 *     Fallback 1.5% if no swing point exists (warm-up only).
 *
 * TP: entry ± (SL_distance × 2.5)  →  RR ratio = 2.5 : 1
 *
 * Returns KMASignalEvent (extends SignalEvent — fully backward compatible).
 * All consumers that receive SignalEvent continue to work unchanged.
 *
 * DATA REQUIREMENTS:
 *   Minimum candles = slowPeriod (150) + swingLookback×4 + 5 = ~169 bars.
 *   Yahoo 1h (60d range) returns ~375 bars → safe margin of ~206 bars.
 *   DEFAULT_CANDLE_LIMIT must be ≥ 400 (set in constants.ts).
 */

import { Candle, KMASignalEvent }          from '../types/binance';
import { findSwingPoints, getLatestSwings } from './swingPoints';
import { getMATrend, ma30Role }             from './maTrend';
import { isHKTradingHours, isHKWeekend, formatHKT } from './hkSession';

/**
 * detectSignal — main entry point for live signal detection.
 *
 * Call this once per new candle close with the full candle history.
 * Returns a KMASignalEvent if all 5 gates pass, otherwise null.
 *
 * @param candles      - Full candle array (latest bar is candles[last])
 * @param fastPeriod   - MA5  period (default 5)
 * @param midPeriod    - MA30 period (default 30)
 * @param slowPeriod   - MA150 period (default 150)
 * @param proximityPct - Max distance from MA30 to qualify entry (default 0.8%)
 * @param tpRatio      - TP = SL_distance × tpRatio (default 2.5 → RR = 2.5:1)
 * @param swingLookback - Bars required on each side to confirm a pivot (default 2)
 */
export function detectSignal(
  candles:       Candle[],
  fastPeriod     = 5,
  midPeriod      = 30,
  slowPeriod     = 150,
  proximityPct   = 0.008,
  tpRatio        = 2.5,
  swingLookback  = 2,
): KMASignalEvent | null {

  // ── Pre-check: enough data for MA150 + swing warmup ─────────────────────
  const minBars = slowPeriod + swingLookback * 4 + 5;
  if (candles.length < minBars) return null;

  const latest = candles[candles.length - 1];

  // ── Gate 1: HKEX session filter ─────────────────────────────────────────
  // Pass false → no evening session (ETF 3081.HK has no evening trading)
  if (!isHKTradingHours(latest.time, false)) return null;
  if (isHKWeekend(latest.time))              return null;

  // ── Gate 2: Triple MA stack must be BULL or BEAR (not RANGE) ────────────
  const stack = getMATrend(candles, fastPeriod, midPeriod, slowPeriod);
  if (!stack || stack.trend === 'RANGE') return null;

  // ── Swing point detection ────────────────────────────────────────────────
  // Exclude the last `swingLookback` bars because they have no confirmed
  // right-side bars yet — using them would give false pivot labels.
  const confirmedCandles = candles.slice(0, candles.length - swingLookback);
  const swings = findSwingPoints(confirmedCandles, swingLookback);

  const price = latest.close;
  const hkt   = formatHKT(latest.time);

  // ════════════════════════════════════════════════════════════════════════
  // LONG SETUP
  // ════════════════════════════════════════════════════════════════════════
  if (stack.trend === 'BULL') {

    // Need at least 2 confirmed swing HIGHs to determine if latest is a HH
    const recentHighs = getLatestSwings(swings, 'HIGH', 2);
    // Need at least 1 confirmed swing LOW for the SL anchor
    const recentLows  = getLatestSwings(swings, 'LOW', 1);

    if (recentHighs.length < 2) return null;

    const [prevHigh, lastHigh] = recentHighs; // [older, newer]

    // Gate 3: The most recent swing HIGH must be a Higher High (HH)
    // This confirms bullish pivot structure — a lower high (LH) means
    // the trend may be weakening; we do NOT trade LH in a bull stack.
    if (lastHigh.price <= prevHigh.price) return null;

    // Gate 4: Current price must have actually broken above the swing HIGH
    // The signal fires on the BREAKOUT candle, not before.
    if (price <= lastHigh.price) return null;

    // Gate 5: MA30 must be within 0.8% below current price (support role)
    // Ensures we're entering NEAR the MA, not after a big runaway move.
    if (ma30Role(price, stack.ma30, proximityPct) !== 'support') return null;

    // ── Dynamic SL: place at prev confirmed swing LOW ──────────────────────
    // If no swing low yet (very start of data), fall back to 1.5% below entry.
    const sl     = recentLows.length > 0
      ? recentLows[0].price
      : price * (1 - 0.015);
    const slDist = price - sl;
    const tp     = price + slDist * tpRatio;

    return {
      // Base SignalEvent fields (backward compatible)
      type:    'LONG',
      price,
      ma:      stack.ma30,   // 'ma' field expected by legacy consumers
      time:    latest.time,
      message:
        `🟢 K均LONG拐點 | 突破前高 ${lastHigh.price.toFixed(3)} → 入場 ${price.toFixed(3)} ` +
        `| MA5=${stack.ma5.toFixed(2)} MA30=${stack.ma30.toFixed(2)} MA150=${stack.ma150.toFixed(2)} ` +
        `| SL=${sl.toFixed(3)} TP=${tp.toFixed(3)} (RR=2.5) | ${hkt}`,

      // KMASignalEvent extra fields
      sl,
      tp,
      ma5:           stack.ma5,
      ma30:          stack.ma30,
      ma150:         stack.ma150,
      trend:         'BULL',
      swingBreached: lastHigh.price,
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  // SHORT SETUP  (mirror image of LONG)
  // ════════════════════════════════════════════════════════════════════════
  if (stack.trend === 'BEAR') {

    const recentLows  = getLatestSwings(swings, 'LOW',  2);
    const recentHighs = getLatestSwings(swings, 'HIGH', 1);

    if (recentLows.length < 2) return null;

    const [prevLow, lastLow] = recentLows; // [older, newer]

    // Gate 3: Latest swing LOW must be a Lower Low (LL)
    if (lastLow.price >= prevLow.price) return null;

    // Gate 4: Current price must have broken below the swing LOW
    if (price >= lastLow.price) return null;

    // Gate 5: MA30 must be within 0.8% above current price (resistance role)
    if (ma30Role(price, stack.ma30, proximityPct) !== 'resistance') return null;

    // ── Dynamic SL: place at prev confirmed swing HIGH ─────────────────────
    const sl     = recentHighs.length > 0
      ? recentHighs[0].price
      : price * (1 + 0.015);
    const slDist = sl - price;
    const tp     = price - slDist * tpRatio;

    return {
      type:    'SHORT',
      price,
      ma:      stack.ma30,
      time:    latest.time,
      message:
        `🔴 K均SHORT拐點 | 跌破前低 ${lastLow.price.toFixed(3)} → 入場 ${price.toFixed(3)} ` +
        `| MA5=${stack.ma5.toFixed(2)} MA30=${stack.ma30.toFixed(2)} MA150=${stack.ma150.toFixed(2)} ` +
        `| SL=${sl.toFixed(3)} TP=${tp.toFixed(3)} (RR=2.5) | ${hkt}`,

      sl,
      tp,
      ma5:           stack.ma5,
      ma30:          stack.ma30,
      ma150:         stack.ma150,
      trend:         'BEAR',
      swingBreached: lastLow.price,
    };
  }

  return null;
}