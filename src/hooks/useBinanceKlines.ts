import { useState, useEffect, useCallback, useRef } from 'react';
import { Candle, Interval } from '../types/binance';

// Use REST API polling instead of WebSocket for Replit compatibility
// Binance Futures REST is CORS-friendly; WSS is often blocked in sandboxed envs
const SYMBOL = 'XAUUSDT';
const POLL_INTERVAL_MS = 10000; // refresh every 10 seconds

// Try Futures API first, fallback to Spot API (XAUUSDT available on both)
const ENDPOINTS = [
  (interval: string, limit: number) =>
    `https://fapi.binance.com/fapi/v1/klines?symbol=${SYMBOL}&interval=${interval}&limit=${limit}`,
  (interval: string, limit: number) =>
    `https://api.binance.com/api/v3/klines?symbol=${SYMBOL}&interval=${interval}&limit=${limit}`,
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

export function useBinanceKlines(interval: Interval = '1h', limit = 100) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [connectionMode, setConnectionMode] = useState<'polling' | 'ws'>('polling');
  const endpointIndexRef = useRef(0);

  const fetchKlines = useCallback(async () => {
    let lastErr: Error | null = null;

    // Try each endpoint in order
    for (let i = 0; i < ENDPOINTS.length; i++) {
      const idx = (endpointIndexRef.current + i) % ENDPOINTS.length;
      try {
        const url = ENDPOINTS[idx](interval, limit);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: (string | number)[][] = await res.json();
        const parsed = data.map(parseRawKline);
        setCandles(parsed);
        setLastPrice(parsed[parsed.length - 1]?.close ?? null);
        setError(null);
        setLoading(false);
        endpointIndexRef.current = idx; // remember working endpoint
        return;
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error('Fetch failed');
      }
    }

    // All endpoints failed
    setError(`無法連接Binance API: ${lastErr?.message ?? 'Unknown error'}`);
    setLoading(false);
  }, [interval, limit]);

  // Initial fetch + polling every 10s
  useEffect(() => {
    setLoading(true);
    fetchKlines();

    const timer = setInterval(() => {
      fetchKlines();
    }, POLL_INTERVAL_MS);

    setConnectionMode('polling');

    return () => clearInterval(timer);
  }, [fetchKlines]);

  return { candles, loading, error, lastPrice, connectionMode, refetch: fetchKlines };
}
