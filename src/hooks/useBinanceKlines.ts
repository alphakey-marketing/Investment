import { useState, useEffect, useCallback } from 'react';
import { Candle, Interval } from '../types/binance';

const BASE_URL = 'https://fapi.binance.com';
const SYMBOL = 'XAUUSDT';

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

  const fetchKlines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `${BASE_URL}/fapi/v1/klines?symbol=${SYMBOL}&interval=${interval}&limit=${limit}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data: (string | number)[][] = await res.json();
      const parsed = data.map(parseRawKline);
      setCandles(parsed);
      setLastPrice(parsed[parsed.length - 1]?.close ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch klines');
    } finally {
      setLoading(false);
    }
  }, [interval, limit]);

  useEffect(() => {
    fetchKlines();
    const wsUrl = `wss://fstream.binance.com/ws/${SYMBOL.toLowerCase()}@kline_${interval}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const k = msg.k;
      if (!k) return;
      const updatedCandle: Candle = {
        time: Math.floor(k.t / 1000),
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v),
      };
      setLastPrice(updatedCandle.close);
      setCandles((prev) => {
        if (prev.length === 0) return [updatedCandle];
        const last = prev[prev.length - 1];
        if (last.time === updatedCandle.time) {
          return [...prev.slice(0, -1), updatedCandle];
        } else {
          return [...prev.slice(-(limit - 1)), updatedCandle];
        }
      });
    };

    ws.onerror = () => setError('WebSocket error - retrying...');
    return () => ws.close();
  }, [interval, limit, fetchKlines]);

  return { candles, loading, error, lastPrice, refetch: fetchKlines };
}
