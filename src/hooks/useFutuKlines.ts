/**
 * useFutuKlines — HK ETF market data hook
 *
 * Replit / online mode: Yahoo Finance only via server-side proxy.
 * FutuOpenD path is commented out but preserved for local dev re-enable.
 *
 * Flow:
 *   Browser → GET /api/yahoo-klines/3081.HK/:interval
 *          → Express server → Yahoo Finance API (server-to-server)
 *          → Candle[] back to browser
 *
 * Polls every 60s (Yahoo rate-limit friendly).
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Candle } from '../types/binance';
import { FutuSymbol, FUTU_TO_YAHOO } from '../types/futu';

export type HKInterval = '5m' | '15m' | '1h' | '4h' | '1d';

const YAHOO_POLL_MS = 60_000; // 60s — Yahoo rate-limit friendly

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

// ── Commented out: Futu OpenD fetch (re-enable for local dev) ───────────────────────────
// async function fetchFromFutuProxy(symbol, interval, limit) { ... }

// ── Hook ────────────────────────────────────────────────────────────────────────
export function useFutuKlines(
  interval: HKInterval = '1h',
  limit    = 200,
  symbol: FutuSymbol = 'HK.03081'
) {
  const [candles,     setCandles]     = useState<Candle[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [lastPrice,   setLastPrice]   = useState<number | null>(null);
  const [dataSource,  setDataSource]  = useState<'futu' | 'yahoo' | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelRef = useRef(false);

  const fetchKlines = useCallback(async () => {
    const yahooTicker = FUTU_TO_YAHOO[symbol];

    if (!yahooTicker) {
      setError(`No Yahoo ticker configured for ${symbol}`);
      setLoading(false);
      return;
    }

    try {
      const data = await fetchFromYahooProxy(yahooTicker, interval);
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

    // ── Futu OpenD priority path (commented out for Replit) ────────────────────────────
    // To restore local priority:
    //   1. Uncomment fetchFromFutuProxy above
    //   2. Try Futu first, fall back to Yahoo on failure
    //   3. Use FUTU_POLL_MS (10s) when Futu succeeds
  }, [symbol, interval]);

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
