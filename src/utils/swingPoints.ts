/**
 * src/utils/swingPoints.ts — K均交易法 v2
 *
 * Identifies confirmed swing HIGH and swing LOW pivot points from a
 * candle array. This is the foundation of the book's "拐點" system.
 *
 * The book classifies all market moves into 14 high/low combinations:
 *   Swing HIGHs:  HH (Higher High), LH (Lower High), EH (Equal High)
 *   Swing LOWs:   HL (Higher Low),  LL (Lower Low),  EL (Equal Low)
 *
 * A trade is only triggered when:
 *   LONG:  a HH (Higher High) breakout occurs near MA30 in a BULL stack
 *   SHORT: a LL (Lower Low)  breakdown occurs near MA30 in a BEAR stack
 *
 * HOW CONFIRMATION WORKS (lookback = 2, the default):
 *   A swing HIGH at candles[i] is confirmed when:
 *     candles[i].high >= candles[i-1].high  AND
 *     candles[i].high >= candles[i-2].high  AND
 *     candles[i].high >= candles[i+1].high  AND
 *     candles[i].high >= candles[i+2].high
 *   AND at least ONE of the neighbouring bars is strictly lower
 *   (prevents flagging a flat top as a swing high).
 *
 *   A swing LOW at candles[i] is the mirror image using .low.
 *
 * WHY lookback=2 for 1h ETF:
 *   Each bar is 1 hour. Requiring 2 bars on each side means a pivot
 *   is only confirmed 2 hours after it forms — fast enough for ETF
 *   swing trading while filtering out single-bar spikes.
 *   Use lookback=3 for daily charts.
 *
 * IMPORTANT: Always pass candles.slice(0, -lookback) before calling
 *   findSwingPoints(), so that the last `lookback` unconfirmed bars
 *   are excluded. The current (latest) candle cannot be a confirmed
 *   pivot because it has no right-side bars yet.
 */

import { Candle } from '../types/binance';

// ── Types ──────────────────────────────────────────────────────────────────

export type SwingLabel = 'HH' | 'LH' | 'EH' | 'HL' | 'LL' | 'EL';

export interface SwingPoint {
  index:  number;      // position in the candle array
  time:   number;      // Unix timestamp (seconds) — same as candles[index].time
  price:  number;      // candles[index].high  for swing HIGH
                       // candles[index].low   for swing LOW
  type:   'HIGH' | 'LOW';
  label:  SwingLabel;  // classification vs previous swing of same type
}

// ── Core function ──────────────────────────────────────────────────────────

/**
 * Scans the candle array and returns all confirmed swing highs and lows,
 * labelled by their relationship to the previous pivot of the same type.
 *
 * @param candles  - Candle array to scan. Pass candles.slice(0, -lookback)
 *                   from the caller to exclude unconfirmed recent bars.
 * @param lookback - Number of bars required on each side for confirmation.
 *                   Default 2 suits 1h ETF. Use 3 for 1d.
 * @returns        - Array of SwingPoint, sorted oldest → newest.
 */
export function findSwingPoints(candles: Candle[], lookback = 2): SwingPoint[] {
  const points: SwingPoint[] = [];
  const len = candles.length;

  for (let i = lookback; i < len - lookback; i++) {
    const c = candles[i];

    // ── Check: is candles[i] a confirmed swing HIGH? ─────────────────────
    // All bars within lookback must be <= candles[i].high
    const isSwingHigh =
      Array.from({ length: lookback }, (_, k) => k + 1).every(
        k => c.high >= candles[i - k].high && c.high >= candles[i + k].high
      ) &&
      // At least one immediate neighbour must be strictly lower
      // (prevents labelling a 3-bar flat top as a swing high)
      (candles[i - 1].high < c.high || candles[i + 1].high < c.high);

    // ── Check: is candles[i] a confirmed swing LOW? ──────────────────────
    const isSwingLow =
      Array.from({ length: lookback }, (_, k) => k + 1).every(
        k => c.low <= candles[i - k].low && c.low <= candles[i + k].low
      ) &&
      (candles[i - 1].low > c.low || candles[i + 1].low > c.low);

    // ── Label swing HIGH vs previous swing HIGH ───────────────────────────
    if (isSwingHigh) {
      // Find the most recent confirmed HIGH in our list (reverse search)
      const prevHigh = [...points].reverse().find(p => p.type === 'HIGH');

      let label: SwingLabel;
      if (!prevHigh) {
        // First swing high seen — no previous to compare, default to HH
        label = 'HH';
      } else if (c.high > prevHigh.price) {
        label = 'HH'; // Higher High  ← LONG trigger when in BULL stack
      } else if (c.high < prevHigh.price) {
        label = 'LH'; // Lower High   — bearish divergence, no LONG signal
      } else {
        label = 'EH'; // Equal High   — neutral, no signal
      }

      points.push({
        index: i,
        time:  c.time,
        price: c.high,
        type:  'HIGH',
        label,
      });
    }

    // ── Label swing LOW vs previous swing LOW ────────────────────────────
    if (isSwingLow) {
      const prevLow = [...points].reverse().find(p => p.type === 'LOW');

      let label: SwingLabel;
      if (!prevLow) {
        label = 'HL'; // First swing low — default to HL
      } else if (c.low > prevLow.price) {
        label = 'HL'; // Higher Low  — bullish structure
      } else if (c.low < prevLow.price) {
        label = 'LL'; // Lower Low   ← SHORT trigger when in BEAR stack
      } else {
        label = 'EL'; // Equal Low   — neutral
      }

      points.push({
        index: i,
        time:  c.time,
        price: c.low,
        type:  'LOW',
        label,
      });
    }
  }

  return points;
}

// ── Helper ─────────────────────────────────────────────────────────────────

/**
 * Returns the most recent N swing points of a given type, sorted oldest → newest.
 * Used by signal.ts and backtest.ts to get the last 2 HIGHs (for HH check)
 * or the last 1 LOW (for dynamic SL).
 *
 * Example:
 *   getLatestSwings(swings, 'HIGH', 2) → [prevHigh, lastHigh]
 *   getLatestSwings(swings, 'LOW',  1) → [lastLow]  (for SL)
 */
export function getLatestSwings(
  points: SwingPoint[],
  type:   'HIGH' | 'LOW',
  n      = 2,
): SwingPoint[] {
  return points.filter(p => p.type === type).slice(-n);
}