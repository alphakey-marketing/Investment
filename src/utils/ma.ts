import { Candle, MAPoint } from '../types/binance';

// Calculate Simple Moving Average (SMA) for an array of candles
export function calculateSMA(candles: Candle[], period: number): MAPoint[] {
  const result: MAPoint[] = [];
  if (candles.length < period) return result;

  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const avg = slice.reduce((sum, c) => sum + c.close, 0) / period;
    result.push({
      time: candles[i].time,
      value: parseFloat(avg.toFixed(2)),
    });
  }
  return result;
}

// Get latest SMA value from candles
export function getLatestSMA(candles: Candle[], period: number): number | null {
  if (candles.length < period) return null;
  const slice = candles.slice(-period);
  const avg = slice.reduce((sum, c) => sum + c.close, 0) / period;
  return parseFloat(avg.toFixed(2));
}
