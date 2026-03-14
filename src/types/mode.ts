export type AppMode = 'LIVE' | 'PAPER' | 'BACKTEST';

export interface PaperAccount {
  balance:        number;  // HKD available (cash not in position)
  initialBalance: number;  // HKD starting balance
  openPosition:   OpenPosition | null;
}

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
  totalSignals:    number;
  wins:            number;
  losses:          number;
  winRate:         number;
  totalPnl:        number;  // net of commission
  totalPnlPct:     number;
  maxDrawdown:     number;  // net of commission
  profitFactor:    number;  // net of commission
  trades:          BacktestTrade[];
  totalCommission: number;  // Fix 5: total commission paid across all trades
}

export interface BacktestTrade {
  type:       'LONG' | 'SHORT';
  entryTime:  number;
  exitTime:   number;
  entryPrice: number;
  exitPrice:  number;
  pnl:        number;        // net of commission
  pnlPct:     number;
  exitReason: 'TP' | 'SL' | 'END';
}
