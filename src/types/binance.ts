export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MAPoint {
  time: number;
  value: number;
}

export type Interval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface SignalEvent {
  type: 'LONG' | 'SHORT';
  price: number;
  ma: number;
  time: number;
  message: string;
}

/**
 * KMASignalEvent — extends SignalEvent with K均交易法 v2 fields.
 * Carries the dynamic SL/TP (structure-based from swing points),
 * all three MA values, the current trend, and the pivot level that
 * was breached to trigger the entry signal.
 *
 * signal.ts v2 returns KMASignalEvent.
 * All consumers that previously received SignalEvent still work
 * because KMASignalEvent is a strict superset (only adds fields).
 */
export interface KMASignalEvent extends SignalEvent {
  sl:            number;   // dynamic stop-loss  (prev swing LOW for LONG,  prev swing HIGH for SHORT)
  tp:            number;   // dynamic take-profit (entry ± SL_distance × 2.5)
  ma5:           number;   // MA5  value at signal time
  ma30:          number;   // MA30 value at signal time
  ma150:         number;   // MA150 value at signal time
  trend:         'BULL' | 'BEAR';  // MA stack direction
  swingBreached: number;   // the pivot price that was broken to confirm the 拐點
}