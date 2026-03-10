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
