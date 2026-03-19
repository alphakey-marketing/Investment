/**
 * useYahooKlines — Value Gold ETF (3081.HK) market data hook
 *
 * Replit / online mode: Yahoo Finance only via server-side proxy.
 *
 * Flow:
 *   Browser → GET /api/yahoo-klines/3081.HK/:interval
 *          → Express server → Yahoo Finance API (server-to-server)
 *          → Candle[] back to browser
 *
 * Polls every 300s (5 min) — Yahoo rate-limit friendly.
 * STALE_THRESHOLD_MS in constants.ts is set to 6 min to match.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Candle } from '../types/binance';
import { HKTicker } from '../types/hkmarket';

export type HKInterval = '5m' | '15m' | '1h' | '4h' | '1d';

const YAHOO_POLL_MS = 300_000; // 5 min — reduced from 60s to be Yahoo rate-limit friendly

// ── Fetch candles from server-side Yahoo proxy ───────────────────────────────────────
async function fetchFromYahooProxy(
  ticker: string,
  interval: HKInterval
): Promise<Candle[]> {
  const res = await fetch(
    `/api/yahoo-klines/${encodeURIComponent(ticker)}/${interval}`,
    { signal: AbortSignal.timeout(15000) }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body?.error ?? `Yahoo proxy HTTP ${res.status}`);
  }
  const data: Candle[] = await res.json();
  if (!Array.isArray(data) || data.length === 0)
    throw new Error('Yahoo proxy returned empty data');
  return data;
}

// ── Hook ────────────────────────────────────────────────────────────────────
export function useYahooKlines(
  interval: HKInterval = '1h',
  limit    = 200,
  ticker: HKTicker = '3081.HK'
) {
  const [candles,     setCandles]     = useState<Candle[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [lastPrice,   setLastPrice]   = useState<number | null>(null);
  const [dataSource,  setDataSource]  = useState<'yahoo' | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelRef = useRef(false);

  const fetchKlines = useCallback(async () => {
    try {
      const data = await fetchFromYahooProxy(ticker, interval);
      if (cancelRef.current) return;
      setCandles(data);
      setLastPrice(data[data.length - 1]?.close ?? null);
      setError(null);
      setDataSource('yahoo');
      setLastUpdated(new Date());
    } catch (err) {
      if (cancelRef.current) return;
      setError(
        err instanceof Error ? err.message : String(err)
      );
      // Keep stale candles visible if we already have data
    } finally {
      if (!cancelRef.current) setLoading(false);
    }
  }, [ticker, interval]);

  useEffect(() => {
    cancelRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    cancelRef.current = false;
    setLoading(true);
    setCandles([]);
    setLastPrice(null);
    setDataSource(null);
    setLastUpdated(null);
    setError(null);

    fetchKlines();
    timerRef.current = setInterval(fetchKlines, YAHOO_POLL_MS);

    return () => {
      cancelRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchKlines]);

  return { candles, loading, error, lastPrice, dataSource, lastUpdated, refetch: fetchKlines };
}
