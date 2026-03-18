export type TradeResult = 'WIN' | 'LOSS' | 'OPEN' | 'BREAK_EVEN';

export interface TradeRecord {
  id: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
    tradeType?: 'live' | 'paper' | 'backtest';  // C1: discriminates source without fragile .notes parsing
  entryPrice: number;
  exitPrice: number | null;     // null = still open
  stopLoss: number;
  takeProfit: number;
  capitalUsed: number;          // HKD margin committed
  quantity: number;             // contracts (futures) or shares (stocks)
  multiplier: number;           // HKD per point per contract (e.g. 10 for MHI, 50 for HSI). 1 for stocks.
  result: TradeResult;
  pnl: number | null;           // HKD profit/loss, null if open
  pnlPct: number | null;        // % return on capitalUsed
  openTime: number;             // unix seconds
  closeTime: number | null;
  notes: string;
}

export interface PerformanceSummary {
  totalTrades: number;
  openTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  totalCapital: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;         // total win / total loss
  bestTrade: number;
  worstTrade: number;
}
