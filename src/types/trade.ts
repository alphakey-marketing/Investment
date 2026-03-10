export type TradeResult = 'WIN' | 'LOSS' | 'OPEN' | 'BREAK_EVEN';

export interface TradeRecord {
  id: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number | null;     // null = still open
  stopLoss: number;
  takeProfit: number;
  capitalUsed: number;          // USDT invested
  quantity: number;             // units bought
  result: TradeResult;
  pnl: number | null;           // USDT profit/loss, null if open
  pnlPct: number | null;        // % return
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
