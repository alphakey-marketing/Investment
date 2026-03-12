/**
 * useFutuKlines — HK Futures / HKEX market data hook
 *
 * Sprint 3 implementation: fetches candles via Yahoo Finance (free, no auth).
 * TODO Sprint 2: replace fetchFromYahoo() with fetchFromFutuProxy() once
 *   FutuOpenD + Express proxy server is running on localhost:3001.
 *
 * Return shape is identical to useBinanceKlines so App.tsx is a 1-line swap.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Candle } from '../types/binance';
import { FutuSymbol, FUTU_TO_YAHOO } from '../types/futu';

export type HKInterval = '5m' | '15m' | '1h' | '4h' | '1d';

const YAHOO_INTERVAL_MAP: Record<HKInterval, string> = {
  '5m':  '5m',
  '15m': '15m',
  '1h':  '60m',
  '4h':  '1d',   // Yahoo doesn't support 4h; fall back to daily
  '1d':  '1d',
};

const YAHOO_RANGE_MAP: Record<HKInterval, string> = {
  '5m':  '5d',
  '15m': '10d',
  '1h':  '60d',
  '4h':  '1y',
  '1d':  '2y',
};

// CORS-friendly Yahoo Finance proxy via allorigins
function yahooUrl(ticker: string, interval: HKInterval): string {
  const yInterval = YAHOO_INTERVAL_MAP[interval];
  const yRange    = YAHOO_RANGE_MAP[interval];
  const raw = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${yInterval}&range=${yRange}`;
  return `https://api.allorigins.win/get?url=${encodeURIComponent(raw)}`;
}

function parseYahooChart(json: unknown): Candle[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (json as any)?.chart?.result?.[0];
  if (!result) return [];
  const timestamps: number[]  = result.timestamp ?? [];
  const q = result.indicators?.quote?.[0] ?? {};
  const opens:  number[] = q.open   ?? [];
  const highs:  number[] = q.high   ?? [];
  const lows:   number[] = q.low    ?? [];
  const closes: number[] = q.close  ?? [];
  const vols:   number[] = q.volume ?? [];

  return timestamps
    .map((t, i) => ({
      time:   t,
      open:   opens[i]  ?? closes[i] ?? 0,
      high:   highs[i]  ?? closes[i] ?? 0,
      low:    lows[i]   ?? closes[i] ?? 0,
      close:  closes[i] ?? 0,
      volume: vols[i]   ?? 0,
    }))
    .filter((c) => c.close > 0);
}

const POLL_MS = 60_000; // Yahoo rate-limits; poll every 60s (vs Binance 10s)

export function useFutuKlines(
  interval: HKInterval = '1h',
  _limit = 100,           // kept for API compatibility with useBinanceKlines
  symbol: FutuSymbol = 'HK.MHImain'
) {
  const [candles,   setCandles]   = useState<Candle[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchKlines = useCallback(async () => {
    const ticker = FUTU_TO_YAHOO[symbol];
    if (!ticker) {
      setError(`Unknown symbol: ${symbol}`);
      setLoading(false);
      return;
    }

    // ── TODO Sprint 2: replace this block with Futu proxy call ──────────────
    // const res = await fetch(`http://localhost:3001/api/klines/${symbol}/${interval}`);
    // const data: Candle[] = await res.json();
    // ────────────────────────────────────────────────────────────────────────
    try {
      const res = await fetch(yahooUrl(ticker, interval));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const wrapper = await res.json();
      // allorigins wraps the response in { contents: "..." }
      const inner = JSON.parse(wrapper.contents ?? '{}');
      const data  = parseYahooChart(inner);
      if (data.length === 0) throw new Error('Empty chart data');
      setCandles(data);
      setLastPrice(data[data.length - 1]?.close ?? null);
      setError(null);
    } catch (err) {
      setError(`無法載入 ${symbol} 數據: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [symbol, interval]);

  useEffect(() => {
    setLoading(true);
    setCandles([]);
    setLastPrice(null);
    fetchKlines();
    timerRef.current = setInterval(fetchKlines, POLL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchKlines]);

  return { candles, loading, error, lastPrice, refetch: fetchKlines };
}
