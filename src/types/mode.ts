export type AppMode = 'LIVE' | 'PAPER' | 'BACKTEST';

export interface PaperAccount {
  balance:        number;  // HKD available (cash not in position)
  initialBalance: number;  // HKD starting balance
  openPosition:   OpenPosition | null;
}

// FIX #1: renamed PaperPosition → OpenPosition to match usePaperTrading import
// FIX #3: removed stale 'id' field (never set) and 'USDT' comment — currency is HKD
export interface OpenPosition {
  symbol:      string;
  type:        'LONG' | 'SHORT';
  entryPrice:  number;
  quantity:    number;     // shares for stocks; contracts for futures
  capitalUsed: number;     // HKD margin / capital committed
  stopLoss:    number;
  takeProfit:  number;
  openTime:    number;     // unix seconds
}

export interface BacktestResult {
  totalSignals: number;
  wins:         number;
  losses:       number;
  winRate:      number;
  totalPnl:     number;
  totalPnlPct:  number;
  maxDrawdown:  number;
  profitFactor: number;
  trades:       BacktestTrade[];
}

export interface BacktestTrade {
  type:       'LONG' | 'SHORT';
  entryTime:  number;
  exitTime:   number;
  entryPrice: number;
  exitPrice:  number;
  pnl:        number;
  pnlPct:     number;
  exitReason: 'TP' | 'SL' | 'END';
}
