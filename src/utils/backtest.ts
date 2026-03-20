/**
 * src/utils/backtest.ts — K均交易法 v2 Backtester
 *
 * What changed from v1:
 *   • Triple MA stack (MA5/MA30/MA150) replaces single MA20 anchor
 *   • RANGE candles are counted as rangeFiltered and skipped — no entry
 *   • Entry requires: BULL/BEAR stack + HH/LL pivot breakout + MA30 proximity
 *   • SL is structure-based: previous confirmed swing LOW (LONG) or HIGH (SHORT)
 *   • TP is dynamic: entry ± SL_distance × tpRatio (default 2.5:1 RR)
 *   • Trailing exit: if price crosses back through MA30 after profit > 1× SL_dist
 *   • slPct / tpPct params are REMOVED — SL/TP are now fully dynamic
 *   • commissionPerRound HK$60 round-trip (unchanged)
 *   • Cooldown 3 candles after any exit (unchanged)
 *   • END trades pay half commission (entry-side only, unchanged)
 *
 * New output fields on BacktestResult:
 *   rangeFiltered — how many entry-eligible candles were blocked by RANGE filter
 *   avgSlDist     — average structure SL distance in price points
 *   avgTpDist     — average structure TP distance in price points
 *
 * New fields on BacktestTrade:
 *   sl, tp        — the actual SL/TP prices used for that trade
 *   exitReason    — now includes 'TRAIL' in addition to 'TP'/'SL'/'END'
 */
import { Candle }                              from '../types/binance';
import { BacktestResult, BacktestTrade }       from '../types/mode';
import { getLatestSMA }                        from './ma';
import { isHKTradingHours, isHKWeekend }       from './hkSession';
import { findSwingPoints, getLatestSwings }    from './swingPoints';
import { getMATrend, ma30Role }                from './maTrend';

export function runBacktest(
  candles:               Candle[],
  fastPeriod             = 5,     // MA5
  midPeriod              = 30,    // MA30
  slowPeriod             = 150,   // MA150
  shares                 = 100,   // ETF shares per trade
  tpRatio                = 2.5,   // TP = SL_distance × tpRatio  →  RR = 2.5:1
  proximityPct           = 0.008, // max distance from MA30 to allow entry (0.8%)
  commissionPerRound     = 60,    // HKD round-trip (entry + exit)
  swingLookback          = 2,     // bars on each side to confirm a pivot
  includeFuturesEvening  = false, // ETF 3081.HK has no evening session
): BacktestResult {

  const trades: BacktestTrade[]   = [];
  let inTrade                     = false;
  let currentTrade: Partial<BacktestTrade> | null = null;
  let slPrice                     = 0;
  let tpPrice                     = 0;

  let peak                        = 0;
  let maxDrawdown                 = 0;
  let runningPnl                  = 0;
  let firstEntryPrice             = 0;
  let totalCommission             = 0;
  let rangeFiltered               = 0;   // counts RANGE-blocked entry candles
  let cooldown                    = 0;
  const COOLDOWN                  = 3;

  // Need slowPeriod bars for MA150 warmup + swing detection on each side
  const startIdx = slowPeriod + swingLookback * 4 + 5;

  for (let i = startIdx; i < candles.length; i++) {
    const slice = candles.slice(0, i + 1);
    const c     = candles[i];

    // ── Get MA30 for trailing exit check ──────────────────────────────────
    const ma30now = getLatestSMA(slice, midPeriod);
    if (!ma30now) continue;

    // ════════════════════════════════════════════════════════════════════
    // EXIT CHECK — happens every candle regardless of session
    // ════════════════════════════════════════════════════════════════════
    if (inTrade && currentTrade) {
      let exitPrice:  number | null = null;
      let exitReason: 'TP' | 'SL' | 'TRAIL' | null = null;

      if (currentTrade.type === 'LONG') {
        // Priority order: SL first (worst case), then TP, then trailing
        if (c.low <= slPrice) {
          exitPrice  = slPrice;
          exitReason = 'SL';
        } else if (c.high >= tpPrice) {
          exitPrice  = tpPrice;
          exitReason = 'TP';
        } else {
          // Trailing exit: price has crossed back below MA30 AND
          // profit is already > 1× the original SL distance (locked-in profit)
          const origSlDist   = currentTrade.entryPrice! - slPrice;
          const profitSoFar  = c.close - currentTrade.entryPrice!;
          if (c.close < ma30now && profitSoFar > origSlDist) {
            exitPrice  = c.close;
            exitReason = 'TRAIL';
          }
        }
      } else {
        // SHORT
        if (c.high >= slPrice) {
          exitPrice  = slPrice;
          exitReason = 'SL';
        } else if (c.low <= tpPrice) {
          exitPrice  = tpPrice;
          exitReason = 'TP';
        } else {
          const origSlDist  = slPrice - currentTrade.entryPrice!;
          const profitSoFar = currentTrade.entryPrice! - c.close;
          if (c.close > ma30now && profitSoFar > origSlDist) {
            exitPrice  = c.close;
            exitReason = 'TRAIL';
          }
        }
      }

      if (exitPrice != null && exitReason != null) {
        const ptDiff    = currentTrade.type === 'LONG'
          ? exitPrice - currentTrade.entryPrice!
          : currentTrade.entryPrice! - exitPrice;
        const grossPnl  = ptDiff * shares;
        const netPnl    = grossPnl - commissionPerRound;
        totalCommission += commissionPerRound;

        const notional  = currentTrade.entryPrice! * shares;
        const pnlPct    = notional > 0
          ? parseFloat(((netPnl / notional) * 100).toFixed(2))
          : 0;

        trades.push({
          ...(currentTrade as BacktestTrade),
          exitTime:   c.time,
          exitPrice,
          pnl:        parseFloat(netPnl.toFixed(2)),
          pnlPct,
          exitReason,
        });

        runningPnl += netPnl;
        if (runningPnl > peak) peak = runningPnl;
        const dd = peak - runningPnl;
        if (dd > maxDrawdown) maxDrawdown = dd;

        inTrade      = false;
        currentTrade = null;
        cooldown     = COOLDOWN;
      }
    }

    // ════════════════════════════════════════════════════════════════════
    // ENTRY CHECK
    // ════════════════════════════════════════════════════════════════════
    if (!inTrade) {
      // Honour cooldown
      if (cooldown > 0) { cooldown--; continue; }

      // Session + weekend filter
      if (!isHKTradingHours(c.time, includeFuturesEvening)) continue;
      if (isHKWeekend(c.time)) continue;

      // ── Gate 2: Triple MA stack ──────────────────────────────────────
      const stack = getMATrend(slice, fastPeriod, midPeriod, slowPeriod);
      if (!stack) continue;
      if (stack.trend === 'RANGE') {
        rangeFiltered++; // count every entry-eligible candle blocked by RANGE
        continue;
      }

      // ── Swing points (exclude last swingLookback unconfirmed bars) ───
      const confirmedSlice = slice.slice(0, slice.length - swingLookback);
      const swings         = findSwingPoints(confirmedSlice, swingLookback);

      const price = c.close;

      // ── LONG ──────────────────────────────────────────────────────────
      if (stack.trend === 'BULL') {
        const recentHighs = getLatestSwings(swings, 'HIGH', 2);
        const recentLows  = getLatestSwings(swings, 'LOW',  1);

        if (recentHighs.length < 2) continue;

        const [prevHigh, lastHigh] = recentHighs;

        // Gate 3: must be a Higher High
        if (lastHigh.price <= prevHigh.price) continue;

        // Gate 4: price must have broken above the confirmed swing high
        if (price <= lastHigh.price) continue;

        // Gate 5: price must be near MA30 (support role)
        if (ma30Role(price, stack.ma30, proximityPct) !== 'support') continue;

        // Dynamic SL at previous swing LOW
        slPrice = recentLows.length > 0
          ? recentLows[0].price
          : price * (1 - 0.015);
        tpPrice = price + (price - slPrice) * tpRatio;

        if (firstEntryPrice === 0) firstEntryPrice = price;
        inTrade = true;
        currentTrade = {
          type:       'LONG',
          entryTime:  c.time,
          entryPrice: price,
          exitTime:   0,
          exitPrice:  0,
          pnl:        0,
          pnlPct:     0,
          exitReason: 'END',
          sl:         slPrice,
          tp:         tpPrice,
        };

      // ── SHORT ─────────────────────────────────────────────────────────
      } else if (stack.trend === 'BEAR') {
        const recentLows  = getLatestSwings(swings, 'LOW',  2);
        const recentHighs = getLatestSwings(swings, 'HIGH', 1);

        if (recentLows.length < 2) continue;

        const [prevLow, lastLow] = recentLows;

        // Gate 3: must be a Lower Low
        if (lastLow.price >= prevLow.price) continue;

        // Gate 4: price must have broken below the confirmed swing low
        if (price >= lastLow.price) continue;

        // Gate 5: price must be near MA30 (resistance role)
        if (ma30Role(price, stack.ma30, proximityPct) !== 'resistance') continue;

        // Dynamic SL at previous swing HIGH
        slPrice = recentHighs.length > 0
          ? recentHighs[0].price
          : price * (1 + 0.015);
        tpPrice = price - (slPrice - price) * tpRatio;

        if (firstEntryPrice === 0) firstEntryPrice = price;
        inTrade = true;
        currentTrade = {
          type:       'SHORT',
          entryTime:  c.time,
          entryPrice: price,
          exitTime:   0,
          exitPrice:  0,
          pnl:        0,
          pnlPct:     0,
          exitReason: 'END',
          sl:         slPrice,
          tp:         tpPrice,
        };
      }
    }
  }

  // ── Close any open trade at the last candle (END) ──────────────────────
  if (inTrade && currentTrade) {
    const last      = candles[candles.length - 1];
    const ptDiff    = currentTrade.type === 'LONG'
      ? last.close - currentTrade.entryPrice!
      : currentTrade.entryPrice! - last.close;
    const grossPnl  = ptDiff * shares;
    const halfComm  = commissionPerRound / 2;   // entry-side only for open trades
    const netPnl    = grossPnl - halfComm;
    totalCommission += halfComm;
    const notional  = currentTrade.entryPrice! * shares;
    const pnlPct    = notional > 0
      ? parseFloat(((netPnl / notional) * 100).toFixed(2))
      : 0;

    trades.push({
      ...(currentTrade as BacktestTrade),
      exitTime:   last.time,
      exitPrice:  last.close,
      pnl:        parseFloat(netPnl.toFixed(2)),
      pnlPct,
      exitReason: 'END',
    });
    runningPnl += netPnl;
    if (runningPnl > peak) peak = runningPnl;
    const dd = peak - runningPnl;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // ── Aggregate stats ────────────────────────────────────────────────────
  const wins      = trades.filter(t => t.pnl > 0);
  const losses    = trades.filter(t => t.pnl < 0);
  const totalPnl  = trades.reduce((s, t) => s + t.pnl, 0);
  const totalWin  = wins.reduce((s, t) => s + t.pnl, 0);
  const totalLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));

  const refNotional  = firstEntryPrice > 0 ? firstEntryPrice * shares : 1;
  const totalPnlPct  = parseFloat(((totalPnl / refNotional) * 100).toFixed(1));

  // Average structure-based SL and TP distances
  const slDists  = trades.map(t =>
    t.type === 'LONG' ? t.entryPrice - t.sl : t.sl - t.entryPrice
  ).filter(d => d > 0);
  const tpDists  = trades.map(t =>
    t.type === 'LONG' ? t.tp - t.entryPrice : t.entryPrice - t.tp
  ).filter(d => d > 0);

  const avgSlDist = slDists.length > 0
    ? parseFloat((slDists.reduce((a, b) => a + b, 0) / slDists.length).toFixed(3))
    : 0;
  const avgTpDist = tpDists.length > 0
    ? parseFloat((tpDists.reduce((a, b) => a + b, 0) / tpDists.length).toFixed(3))
    : 0;

  return {
    totalSignals:    trades.length,
    wins:            wins.length,
    losses:          losses.length,
    winRate:         trades.length > 0
      ? parseFloat(((wins.length / trades.length) * 100).toFixed(1))
      : 0,
    totalPnl:        parseFloat(totalPnl.toFixed(2)),
    totalPnlPct,
    maxDrawdown:     parseFloat(maxDrawdown.toFixed(2)),
    profitFactor:    totalLoss > 0
      ? parseFloat((totalWin / totalLoss).toFixed(2))
      : totalWin > 0 ? 99 : 0,
    trades,
    totalCommission: parseFloat(totalCommission.toFixed(2)),
    rangeFiltered,
    avgSlDist,
    avgTpDist,
  };
}
