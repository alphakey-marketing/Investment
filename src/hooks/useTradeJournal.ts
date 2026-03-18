import { useState, useCallback } from 'react';
import { TradeRecord, TradeResult, PerformanceSummary } from '../types/trade';

const STORAGE_KEY = 'kma_trade_journal';

function loadTrades(): TradeRecord[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s).map((t: TradeRecord) => ({
            ...t,
      multiplier: t.multiplier ?? 1,  // C2: migrate old records missing multiplier
    })) : [];
    } catch { return []; }
}

function saveTrades(trades: TradeRecord[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trades)); } catch {}
}

/**
 * Futures-correct P&L:
 *   pnl = (exitPrice - entryPrice) × multiplier × quantity
 * For stocks, multiplier = 1, so this degrades gracefully.
 * Old records without a multiplier field default to 1.
 */
function calcPnl(trade: TradeRecord): { pnl: number; pnlPct: number } | null {
  if (trade.exitPrice === null) return null;
  const mult   = trade.multiplier ?? 1;
  const rawPnl = trade.type === 'LONG'
    ? (trade.exitPrice - trade.entryPrice) * mult * trade.quantity
    : (trade.entryPrice - trade.exitPrice) * mult * trade.quantity;
  return {
    pnl:    parseFloat(rawPnl.toFixed(2)),
    pnlPct: trade.capitalUsed > 0
      ? parseFloat(((rawPnl / trade.capitalUsed) * 100).toFixed(2))
      : 0,
  };
}

export function calcPerformance(trades: TradeRecord[]): PerformanceSummary {
  const closed      = trades.filter((t) => t.result !== 'OPEN');
  const wins        = closed.filter((t) => t.result === 'WIN');
  const losses      = closed.filter((t) => t.result === 'LOSS');
  const totalPnl    = closed.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const totalCapital = trades.reduce((sum, t) => sum + t.capitalUsed, 0);
  const totalWinAmt  = wins.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const totalLossAmt = Math.abs(losses.reduce((sum, t) => sum + (t.pnl ?? 0), 0));
  const pnls         = closed.map((t) => t.pnl ?? 0);
  return {
    totalTrades:  trades.length,
    openTrades:   trades.filter((t) => t.result === 'OPEN').length,
    wins:         wins.length,
    losses:       losses.length,
    winRate:      closed.length > 0 ? parseFloat(((wins.length / closed.length) * 100).toFixed(1)) : 0,
    totalPnl:     parseFloat(totalPnl.toFixed(2)),
    totalCapital: parseFloat(totalCapital.toFixed(2)),
    avgWin:       wins.length   > 0 ? parseFloat((totalWinAmt  / wins.length).toFixed(2))   : 0,
    avgLoss:      losses.length > 0 ? parseFloat((totalLossAmt / losses.length).toFixed(2)) : 0,
    profitFactor: totalLossAmt > 0 ? parseFloat((totalWinAmt / totalLossAmt).toFixed(2)) : totalWinAmt > 0 ? 99 : 0,
    bestTrade:    pnls.length > 0 ? Math.max(...pnls) : 0,
    worstTrade:   pnls.length > 0 ? Math.min(...pnls) : 0,
  };
}

export function useTradeJournal() {
  const [trades, setTrades] = useState<TradeRecord[]>(loadTrades);

  const addTrade = useCallback((trade: Omit<TradeRecord, 'id'>) => {
    const newTrade = { ...trade, id: Date.now().toString() };
    setTrades((prev) => {
      const updated = [newTrade, ...prev];
      saveTrades(updated);
      return updated;
    });
    return newTrade;
  }, []);

  const closeTrade = useCallback((id: string, exitPrice: number) => {
    setTrades((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== id) return t;
        const calc = calcPnl({ ...t, exitPrice });
        let result: TradeResult = 'BREAK_EVEN';
        if (calc && calc.pnl > 0.01)  result = 'WIN';
        else if (calc && calc.pnl < -0.01) result = 'LOSS';
        return {
          ...t,
          exitPrice,
          result,
          pnl:       calc?.pnl    ?? 0,
          pnlPct:    calc?.pnlPct ?? 0,
          closeTime: Math.floor(Date.now() / 1000),
        };
      });
      saveTrades(updated);
      return updated;
    });
  }, []);

  const deleteTrade = useCallback((id: string) => {
    setTrades((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveTrades(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setTrades([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { trades, addTrade, closeTrade, deleteTrade, clearAll };
}
