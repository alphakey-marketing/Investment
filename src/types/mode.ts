export type AppMode = 'LIVE' | 'PAPER' | 'BACKTEST';

export interface PaperAccount {
  balance: number;           // USDT available
  initialBalance: number;
  openPosition: PaperPosition | null;
}

export interface PaperPosition {
  id: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  quantity: number;
  capitalUsed: number;
  stopLoss: number;
  takeProfit: number;
  openTime: number;
}

export interface BacktestResult {
  totalSignals: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  totalPnlPct: number;
  maxDrawdown: number;
  profitFactor: number;
  trades: BacktestTrade[];
}

export interface BacktestTrade {
  type: 'LONG' | 'SHORT';
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPct: number;
  exitReason: 'TP' | 'SL' | 'END';
}
