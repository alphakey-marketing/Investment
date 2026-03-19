import { Candle } from '../types/binance';
import { BacktestResult, BacktestTrade } from '../types/mode';
import { calculateSMA, getLatestSMA } from './ma';

export function runBacktest(
  candles: Candle[],
  ma1Period = 20,
  ma2Period = 60,
  capitalPerTrade = 1000,
  riskPct = 2,
  slPct = 0.01,
  tpPct = 0.03,
  proximityPct = 0.005
): BacktestResult {
  const trades: BacktestTrade[] = [];
  let inTrade = false;
  let currentTrade: Partial<BacktestTrade> | null = null;
  let slPrice = 0;
  let tpPrice = 0;

  const totalPnls: number[] = [];
  let peak = 0;
  let maxDrawdown = 0;
  let runningPnl = 0;

  for (let i = Math.max(ma1Period, ma2Period) + 1; i < candles.length; i++) {
    const slice = candles.slice(0, i + 1);
    const c = candles[i];
    const prev = candles[i - 1];
    const ma1 = getLatestSMA(slice, ma1Period);
    const ma2 = getLatestSMA(slice, ma2Period);
    if (!ma1 || !ma2) continue;

    // Check exit first
    if (inTrade && currentTrade) {
      let exitPrice: number | null = null;
      let exitReason: 'TP' | 'SL' | null = null;

      if (currentTrade.type === 'LONG') {
        if (c.low <= slPrice) { exitPrice = slPrice; exitReason = 'SL'; }
        else if (c.high >= tpPrice) { exitPrice = tpPrice; exitReason = 'TP'; }
      } else {
        if (c.high >= slPrice) { exitPrice = slPrice; exitReason = 'SL'; }
        else if (c.low <= tpPrice) { exitPrice = tpPrice; exitReason = 'TP'; }
      }

      if (exitPrice && exitReason) {
        const pnl = currentTrade.type === 'LONG'
          ? (exitPrice - currentTrade.entryPrice!) / currentTrade.entryPrice! * capitalPerTrade
          : (currentTrade.entryPrice! - exitPrice) / currentTrade.entryPrice! * capitalPerTrade;
        const finished: BacktestTrade = {
          ...currentTrade as BacktestTrade,
          exitTime: c.time,
          exitPrice,
          pnl: parseFloat(pnl.toFixed(2)),
          pnlPct: parseFloat(((pnl / capitalPerTrade) * 100).toFixed(2)),
          exitReason,
        };
        trades.push(finished);
        runningPnl += pnl;
        totalPnls.push(runningPnl);
        if (runningPnl > peak) peak = runningPnl;
        const dd = peak - runningPnl;
        if (dd > maxDrawdown) maxDrawdown = dd;
        inTrade = false;
        currentTrade = null;
      }
    }

    // Entry signal (only if not in trade)
    if (!inTrade) {
      const price = c.close;
      const nearMA1 = Math.abs(price - ma1) / ma1 < proximityPct;
      const nearMA2 = Math.abs(price - ma2) / ma2 < proximityPct;

      if (price > ma1 && c.high > prev.high && nearMA1) {
        inTrade = true;
        slPrice = price * (1 - slPct);
        tpPrice = price * (1 + tpPct);
        currentTrade = {
          type: 'LONG', entryTime: c.time, entryPrice: price,
          exitTime: 0, exitPrice: 0, pnl: 0, pnlPct: 0, exitReason: 'END',
        };
      } else if (price < ma2 && c.low < prev.low && nearMA2) {
        inTrade = true;
        slPrice = price * (1 + slPct);
        tpPrice = price * (1 - tpPct);
        currentTrade = {
          type: 'SHORT', entryTime: c.time, entryPrice: price,
          exitTime: 0, exitPrice: 0, pnl: 0, pnlPct: 0, exitReason: 'END',
        };
      }
    }
  }

  // Close any open trade at last candle
  if (inTrade && currentTrade) {
    const last = candles[candles.length - 1];
    const pnl = currentTrade.type === 'LONG'
      ? (last.close - currentTrade.entryPrice!) / currentTrade.entryPrice! * capitalPerTrade
      : (currentTrade.entryPrice! - last.close) / currentTrade.entryPrice! * capitalPerTrade;
    trades.push({
      ...currentTrade as BacktestTrade,
      exitTime: last.time,
      exitPrice: last.close,
      pnl: parseFloat(pnl.toFixed(2)),
      pnlPct: parseFloat(((pnl / capitalPerTrade) * 100).toFixed(2)),
      exitReason: 'END',
    });
  }

  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const totalWin = wins.reduce((s, t) => s + t.pnl, 0);
  const totalLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));

  return {
    totalSignals: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: trades.length > 0 ? parseFloat(((wins.length / trades.length) * 100).toFixed(1)) : 0,
    totalPnl: parseFloat(totalPnl.toFixed(2)),
    totalPnlPct: parseFloat(((totalPnl / capitalPerTrade) * 100).toFixed(1)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    profitFactor: totalLoss > 0 ? parseFloat((totalWin / totalLoss).toFixed(2)) : totalWin > 0 ? 99 : 0,
    trades,
  };
}
