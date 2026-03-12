/**
 * useFutuKlines — HK Futures / HKEX market data hook
 *
 * Data source priority:
 *   1. Futu proxy  /api/klines/:symbol/:interval  (real-time, 10s poll)
 *   2. Yahoo Finance fallback                      (delayed,  60s poll)
 *
 * FIX #6: replaced recursive setTimeout with setInterval + isCancelled flag
 * to prevent double-chain when symbol/interval changes quickly.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Candle } from '../types/binance';
import { FutuSymbol, FUTU_TO_YAHOO } from '../types/futu';

export type HKInterval = '5m' | '15m' | '1h' | '4h' | '1d';

// ── Futu proxy ────────────────────────────────────────────────────────────
async function fetchFromFutuProxy(symbol: string, interval: HKInterval, limit: number): Promise<Candle[]> {
  const res = await fetch(
    `/api/klines/${encodeURIComponent(symbol)}/${interval}?limit=${limit}`,
    { signal: AbortSignal.timeout(5000) }
  );
  if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
  const data: Candle[] = await res.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error('Empty proxy response');
  return data;
}

// ── Yahoo Finance fallback ─────────────────────────────────────────────────
const YAHOO_INTERVAL_MAP: Record<HKInterval, string> = {
  '5m': '5m', '15m': '15m', '1h': '60m', '4h': '1d', '1d': '1d',
};
const YAHOO_RANGE_MAP: Record<HKInterval, string> = {
  '5m': '5d', '15m': '10d', '1h': '60d', '4h': '1y', '1d': '2y',
};

function yahooUrl(ticker: string, interval: HKInterval): string {
  const raw = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${YAHOO_INTERVAL_MAP[interval]}&range=${YAHOO_RANGE_MAP[interval]}`;
  return `https://api.allorigins.win/get?url=${encodeURIComponent(raw)}`;
}

function parseYahooChart(json: unknown): Candle[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (json as any)?.chart?.result?.[0];
  if (!result) return [];
  const ts: number[]  = result.timestamp ?? [];
  const q             = result.indicators?.quote?.[0] ?? {};
  return ts
    .map((t, i) => ({
      time:   t,
      open:   q.open?.[i]   ?? q.close?.[i] ?? 0,
      high:   q.high?.[i]   ?? q.close?.[i] ?? 0,
      low:    q.low?.[i]    ?? q.close?.[i] ?? 0,
      close:  q.close?.[i]  ?? 0,
      volume: q.volume?.[i] ?? 0,
    }))
    .filter((c) => c.close > 0);
}

async function fetchFromYahoo(symbol: FutuSymbol, interval: HKInterval): Promise<Candle[]> {
  const ticker = FUTU_TO_YAHOO[symbol];
  if (!ticker) throw new Error(`No Yahoo ticker for ${symbol}`);
  const res    = await fetch(yahooUrl(ticker, interval));
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
  const wrapper = await res.json();
  const inner   = JSON.parse(wrapper.contents ?? '{}');
  const data    = parseYahooChart(inner);
  if (data.length === 0) throw new Error('Empty Yahoo data');
  return data;
}

// ── Poll intervals ──────────────────────────────────────────────────────────
const FUTU_POLL_MS  = 10_000;
const YAHOO_POLL_MS = 60_000;

// ── Hook ───────────────────────────────────────────────────────────────────
export function useFutuKlines(
  interval: HKInterval = '15m',
  limit = 200,
  symbol: FutuSymbol = 'HK.MHImain'
) {
  const [candles,    setCandles]    = useState<Candle[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [lastPrice,  setLastPrice]  = useState<number | null>(null);
  const [dataSource, setDataSource] = useState<'futu' | 'yahoo' | null>(null);

  // FIX #6: use a single ref that stores the current interval ID and a cancel flag
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelRef   = useRef(false);

  const fetchKlines = useCallback(async () => {
    try {
      const data = await fetchFromFutuProxy(symbol, interval, limit);
      if (cancelRef.current) return;           // symbol changed while fetching
      setCandles(data);
      setLastPrice(data[data.length - 1]?.close ?? null);
      setError(null);
      setDataSource('futu');

      // Switch to fast poll if we're on slow Yahoo schedule
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(fetchKlines, FUTU_POLL_MS);
      }
    } catch {
      // Futu proxy down — fall back to Yahoo silently
      try {
        const data = await fetchFromYahoo(symbol as FutuSymbol, interval);
        if (cancelRef.current) return;
        setCandles(data);
        setLastPrice(data[data.length - 1]?.close ?? null);
        setError(null);
        setDataSource('yahoo');
      } catch (yahooErr) {
        if (cancelRef.current) return;
        setError(
          `無法載入 ${symbol} 數據: ${yahooErr instanceof Error ? yahooErr.message : yahooErr}`
        );
      }
    } finally {
      if (!cancelRef.current) setLoading(false);
    }
  }, [symbol, interval, limit]);

  useEffect(() => {
    // FIX #6: cancel any in-flight fetch from previous symbol/interval
    cancelRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    // Reset for new symbol
    cancelRef.current = false;
    setLoading(true);
    setCandles([]);
    setLastPrice(null);
    setDataSource(null);

    // Initial fetch then poll on Yahoo cadence (will speed up if Futu connects)
    fetchKlines();
    timerRef.current = setInterval(fetchKlines, YAHOO_POLL_MS);

    return () => {
      cancelRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchKlines]);

  return { candles, loading, error, lastPrice, dataSource, refetch: fetchKlines };
}
