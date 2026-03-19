/**
 * backtest.ts — SMA + Price-level strategy backtester
 *
 * Fix 4 — HKEX session filter:
 *   Entry signals are now gated by isHKTradingHours() — identical to live
 *   detectSignal() behaviour. Candles in the dead zone (03:00–09:15 HKT),
 *   on weekends (isHKWeekend), or in the lunch break (12:00–13:00 HKT) are
 *   skipped for entries. Exits are NOT filtered — a position can be stopped
 *   out at any hour once open.
 *
 * Fix 5 — Commission deduction:
 *   Each round-trip deducts commissionPerRound (default HK$60) from net PnL.
 *   END trades (position still open at last candle) deduct half (entry-side only).
 *   All stats — winRate, profitFactor, maxDrawdown — are calculated on NET PnL.
 *
 * Fix 6 — ETF formula:
 *   Replaced futures multiplier×contracts with shares (default 100).
 *   grossPnl = ptDiff × shares  (no leverage multiplier for ETF).
 *   commissionPerRound reduced to 60 HKD (realistic Futu ETF round-trip).
 *   includeFuturesEvening defaults to false (ETF has no evening session).
 *
 * Fix 7 — Cooldown period:
 *   After any exit (TP, SL, or END), a 3-candle cooldown prevents
 *   immediate re-entry and reduces fee-stacking in choppy markets.
 *
 * Fix 8 — Symmetric MA:
 *   Both LONG and SHORT now anchor to ma1 (MA20) for symmetric logic.
 *   Previously SHORT used ma2 (MA60), causing asymmetric signal frequency.
 */
import { Candle } from '../types/binance';
import { BacktestResult, BacktestTrade } from '../types/mode';
import { getLatestSMA } from './ma';
import { isHKTradingHours, isHKWeekend } from './hkSession';

export function runBacktest(
  candles:                Candle[],
  ma1Period               = 20,
  ma2Period               = 60,
  shares                  = 100,   // number of ETF shares per trade (e.g. 100 shares × ~23 HKD = ~2300 HKD)
  slPct                   = 0.01,  // widened from 0.5% to 1% — less prone to noise stop-outs
  tpPct                   = 0.025, // 2.5% target ≈ 2.5× risk (good RR for ETF swing)
  proximityPct            = 0.005,
  commissionPerRound      = 60,    // HKD per round-trip — realistic for Futu HK ETF
  includeFuturesEvening   = false  // ETF (03081) has no evening session
): BacktestResult {
  const trades: BacktestTrade[] = [];
  let inTrade      = false;
  let currentTrade: Partial<BacktestTrade> | null = null;
  let slPrice      = 0;
  let tpPrice      = 0;

  let peak         = 0;
  let maxDrawdown  = 0;
  let runningPnl   = 0;
  let firstEntryPrice = 0;
  let totalCommission = 0;

  // Fix 7: cooldown counter — skip re-entry for N candles after any exit
  let cooldownCandles = 0;
  const COOLDOWN = 3;

  for (let i = Math.max(ma1Period, ma2Period) + 1; i < candles.length; i++) {
    const slice = candles.slice(0, i + 1);
    const c     = candles[i];
    const prev  = candles[i - 1];
    const ma1   = getLatestSMA(slice, ma1Period);
    const ma2   = getLatestSMA(slice, ma2Period);
    if (!ma1 || !ma2) continue;

    // ── Exit check (no session filter — exits can happen any time) ─────────
    if (inTrade && currentTrade) {
      let exitPrice:  number | null = null;
      let exitReason: 'TP' | 'SL' | null = null;

      if (currentTrade.type === 'LONG') {
        if (c.low  <= slPrice) { exitPrice = slPrice;  exitReason = 'SL'; }
        else if (c.high >= tpPrice) { exitPrice = tpPrice; exitReason = 'TP'; }
      } else {
        if (c.high >= slPrice) { exitPrice = slPrice;  exitReason = 'SL'; }
        else if (c.low  <= tpPrice) { exitPrice = tpPrice; exitReason = 'TP'; }
      }

      if (exitPrice != null && exitReason) {
        const ptDiff  = currentTrade.type === 'LONG'
          ? exitPrice - currentTrade.entryPrice!
          : currentTrade.entryPrice! - exitPrice;
        // Fix 6: ETF formula — grossPnl = price diff × shares (no futures multiplier)
        const grossPnl  = ptDiff * shares;
        const netPnl    = grossPnl - commissionPerRound;
        totalCommission += commissionPerRound;

        const notional = currentTrade.entryPrice! * shares;
        const pnlPct   = notional > 0
          ? parseFloat(((netPnl / notional) * 100).toFixed(2))
          : 0;

        const finished: BacktestTrade = {
          ...currentTrade as BacktestTrade,
          exitTime:   c.time,
          exitPrice,
          pnl:        parseFloat(netPnl.toFixed(2)),
          pnlPct,
          exitReason,
        };
        trades.push(finished);
        runningPnl += netPnl;
        if (runningPnl > peak) peak = runningPnl;
        const dd = peak - runningPnl;
        if (dd > maxDrawdown) maxDrawdown = dd;
        inTrade         = false;
        currentTrade    = null;
        cooldownCandles = COOLDOWN; // Fix 7: start cooldown after exit
      }
    }

    // ── Entry signal (Fix 4: session + weekend filter) ──────────────────
    if (!inTrade) {
      // Fix 7: honour cooldown — decrement and skip entry this candle
      if (cooldownCandles > 0) { cooldownCandles--; continue; }

      // Skip entries outside HKEX trading hours or on weekends
      if (!isHKTradingHours(c.time, includeFuturesEvening)) continue;
      if (isHKWeekend(c.time)) continue;

      const price   = c.close;
      // Fix 8: both LONG and SHORT anchor to ma1 (MA20) for symmetric logic
      const nearMA1 = Math.abs(price - ma1) / ma1 < proximityPct;

      if (price > ma1 && c.high > prev.high && nearMA1) {
        inTrade  = true;
        slPrice  = price * (1 - slPct);
        tpPrice  = price * (1 + tpPct);
        if (firstEntryPrice === 0) firstEntryPrice = price;
        currentTrade = {
          type: 'LONG', entryTime: c.time, entryPrice: price,
          exitTime: 0, exitPrice: 0, pnl: 0, pnlPct: 0, exitReason: 'END',
        };
      } else if (price < ma1 && c.low < prev.low && nearMA1) {
        // Fix 8: SHORT now uses ma1 (MA20) — symmetric with LONG
        inTrade  = true;
        slPrice  = price * (1 + slPct);
        tpPrice  = price * (1 - tpPct);
        if (firstEntryPrice === 0) firstEntryPrice = price;
        currentTrade = {
          type: 'SHORT', entryTime: c.time, entryPrice: price,
          exitTime: 0, exitPrice: 0, pnl: 0, pnlPct: 0, exitReason: 'END',
        };
      }
    }
  }

  // ── Close open trade at last candle ────────────────────────────────
  if (inTrade && currentTrade) {
    const last    = candles[candles.length - 1];
    const ptDiff  = currentTrade.type === 'LONG'
      ? last.close - currentTrade.entryPrice!
      : currentTrade.entryPrice! - last.close;
    // Fix 6: ETF formula
    const grossPnl  = ptDiff * shares;
    const halfComm  = commissionPerRound / 2;
    const netPnl    = grossPnl - halfComm;
    totalCommission += halfComm;
    // Fix 6: notional uses shares
    const notional  = currentTrade.entryPrice! * shares;
    const pnlPct    = notional > 0 ? parseFloat(((netPnl / notional) * 100).toFixed(2)) : 0;
    trades.push({
      ...currentTrade as BacktestTrade,
      exitTime:   last.time,
      exitPrice:  last.close,
      pnl:        parseFloat(netPnl.toFixed(2)),
      pnlPct,
      exitReason: 'END',
    });
  }

  const wins      = trades.filter((t) => t.pnl > 0);
  const losses    = trades.filter((t) => t.pnl < 0);
  const totalPnl  = trades.reduce((s, t) => s + t.pnl, 0);
  const totalWin  = wins.reduce((s, t) => s + t.pnl, 0);
  const totalLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));

  // Fix 6: refNotional uses shares
  const refNotional = firstEntryPrice > 0 ? firstEntryPrice * shares : 1;
  const totalPnlPct = parseFloat(((totalPnl / refNotional) * 100).toFixed(1));

  return {
    totalSignals:    trades.length,
    wins:            wins.length,
    losses:          losses.length,
    winRate:         trades.length > 0 ? parseFloat(((wins.length / trades.length) * 100).toFixed(1)) : 0,
    totalPnl:        parseFloat(totalPnl.toFixed(2)),
    totalPnlPct,
    maxDrawdown:     parseFloat(maxDrawdown.toFixed(2)),
    profitFactor:    totalLoss > 0 ? parseFloat((totalWin / totalLoss).toFixed(2)) : totalWin > 0 ? 99 : 0,
    trades,
    totalCommission: parseFloat(totalCommission.toFixed(2)),
  };
}
