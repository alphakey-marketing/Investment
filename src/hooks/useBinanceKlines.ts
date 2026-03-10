import { useState, useEffect, useCallback, useRef } from 'react';
import { Candle, Interval } from '../types/binance';

const POLL_INTERVAL_MS = 10000;

const ENDPOINTS = [
  (symbol: string, interval: string, limit: number) =>
    `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
  (symbol: string, interval: string, limit: number) =>
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
];

function parseRawKline(raw: (string | number)[]): Candle {
  return {
    time: Math.floor((raw[0] as number) / 1000),
    open: parseFloat(raw[1] as string),
    high: parseFloat(raw[2] as string),
    low: parseFloat(raw[3] as string),
    close: parseFloat(raw[4] as string),
    volume: parseFloat(raw[5] as string),
  };
}

export function useBinanceKlines(interval: Interval = '1h', limit = 100, symbol = 'XAUUSDT') {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const endpointIndexRef = useRef(0);

  const fetchKlines = useCallback(async () => {
    let lastErr: Error | null = null;
    for (let i = 0; i < ENDPOINTS.length; i++) {
      const idx = (endpointIndexRef.current + i) % ENDPOINTS.length;
      try {
        const url = ENDPOINTS[idx](symbol, interval, limit);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: (string | number)[][] = await res.json();
        const parsed = data.map(parseRawKline);
        setCandles(parsed);
        setLastPrice(parsed[parsed.length - 1]?.close ?? null);
        setError(null);
        setLoading(false);
        endpointIndexRef.current = idx;
        return;
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error('Fetch failed');
      }
    }
    setError(`無法連接Binance API: ${lastErr?.message}`);
    setLoading(false);
  }, [symbol, interval, limit]);

  useEffect(() => {
    setLoading(true);
    setCandles([]);
    fetchKlines();
    const timer = setInterval(fetchKlines, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchKlines]);

  return { candles, loading, error, lastPrice, refetch: fetchKlines };
}
