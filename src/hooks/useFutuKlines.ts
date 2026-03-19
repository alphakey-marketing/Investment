/**
 * useFutuKlines — HK ETF / HKEX market data hook
 *
 * Data source priority:
 *   1. Futu proxy  /api/klines/:symbol/:interval      (real-time, 10s poll)
 *      → Requires FutuOpenD running locally
 *   2. Yahoo proxy /api/yahoo-klines/:ticker/:interval (server-side, 60s poll)
 *      → Works on Replit without FutuOpenD — no public CORS proxy needed
 *
 * On source switch: poll interval adjusts automatically
 *   Futu  → 10s polling
 *   Yahoo → 60s polling (Yahoo rate limit friendly)
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Candle } from '../types/binance';
import { FutuSymbol, FUTU_TO_YAHOO } from '../types/futu';

export type HKInterval = '5m' | '15m' | '1h' | '4h' | '1d';

// ── D5: proxy shared secret ─────────────────────────────────────────────────────────
const PROXY_SECRET = import.meta.env.VITE_PROXY_SECRET ?? '';

const proxyHeaders = (): HeadersInit =>
  PROXY_SECRET ? { 'x-proxy-secret': PROXY_SECRET } : {};

// ── Source 1: Futu OpenD proxy ────────────────────────────────────────────────
async function fetchFromFutuProxy(
  symbol: string,
  interval: HKInterval,
  limit: number
): Promise<Candle[]> {
  const res = await fetch(
    `/api/klines/${encodeURIComponent(symbol)}/${interval}?limit=${limit}`,
    { signal: AbortSignal.timeout(5000), headers: proxyHeaders() }
  );
  if (!res.ok) throw new Error(`Futu proxy HTTP ${res.status}`);
  const data: Candle[] = await res.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error('Empty Futu response');
  return data;
}

// ── Source 2: Yahoo Finance via YOUR Express server (server-side, no CORS issue) ──
async function fetchFromYahooProxy(
  ticker: string,
  interval: HKInterval
): Promise<Candle[]> {
  const res = await fetch(
    `/api/yahoo-klines/${encodeURIComponent(ticker)}/${interval}`,
    { signal: AbortSignal.timeout(12000), headers: proxyHeaders() }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Yahoo proxy HTTP ${res.status}`);
  }
  const data: Candle[] = await res.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error('Empty Yahoo response');
  return data;
}

// ── Poll intervals ──────────────────────────────────────────────────────────────
const FUTU_POLL_MS  = 10_000;  // 10s — Futu real-time
const YAHOO_POLL_MS = 60_000;  // 60s — Yahoo rate-limit friendly

// ── Hook ────────────────────────────────────────────────────────────────────────
export function useFutuKlines(
  interval: HKInterval = '1h',
  limit = 200,
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

  const scheduleNext = useCallback((source: 'futu' | 'yahoo', fn: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(fn, source === 'futu' ? FUTU_POLL_MS : YAHOO_POLL_MS);
  }, []);

  const fetchKlines = useCallback(async () => {
    const yahooTicker = FUTU_TO_YAHOO[symbol];

    // ── Try Futu proxy first ───────────────────────────────────────────────
    try {
      const data = await fetchFromFutuProxy(symbol, interval, limit);
      if (cancelRef.current) return;
      setCandles(data);
      setLastPrice(data[data.length - 1]?.close ?? null);
      setError(null);
      setDataSource('futu');
      setLastUpdated(new Date());
      scheduleNext('futu', fetchKlines);
      return;
    } catch {
      // Futu proxy unavailable — fall through to Yahoo
    }

    // ── Fallback: Yahoo Finance via server-side proxy ───────────────────────
    if (!yahooTicker) {
      if (!cancelRef.current) {
        setError(`无 Futu 代理且沒有 Yahoo 訊磟者: ${symbol}`);
        setLoading(false);
      }
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
      scheduleNext('yahoo', fetchKlines);
    } catch (yahooErr) {
      if (cancelRef.current) return;
      setError(
        `無法載入 ${symbol} 數據: ${
          yahooErr instanceof Error ? yahooErr.message : String(yahooErr)
        }`
      );
      // Do NOT update lastUpdated on failure — keeps showing stale timestamp
    } finally {
      if (!cancelRef.current) setLoading(false);
    }
  }, [symbol, interval, limit, scheduleNext]);

  useEffect(() => {
    cancelRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    cancelRef.current = false;
    setLoading(true);
    setCandles([]);
    setLastPrice(null);
    setDataSource(null);
    setLastUpdated(null);
    fetchKlines();
    // Start with Yahoo poll interval; fetchKlines will reschedule to Futu if available
    timerRef.current = setInterval(fetchKlines, YAHOO_POLL_MS);
    return () => {
      cancelRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchKlines]);

  return { candles, loading, error, lastPrice, dataSource, lastUpdated, refetch: fetchKlines };
}
