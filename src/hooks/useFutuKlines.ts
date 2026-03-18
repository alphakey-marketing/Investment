/**
 * useFutuKlines — HK Futures / HKEX market data hook
 *
 * Fix 3: now exports `lastUpdated: Date | null`
 * App.tsx uses this to show a red STALE banner when data is >2 min old.
 *
 * Data source priority:
 *   1. Futu proxy  /api/klines/:symbol/:interval  (real-time, 10s poll)
 *   2. Yahoo Finance via allorigins.win            (primary CORS proxy)
 *   3. Yahoo Finance via corsproxy.io             (backup CORS proxy)
 *
 * 4h Yahoo interval mapped to '60m' — Yahoo has no native 4h bar.
 *
 * D5: Sends x-proxy-secret header (VITE_PROXY_SECRET env var) so the
 * Express proxy can authenticate frontend requests. Falls back to empty
 * string in dev when PROXY_SECRET is the default placeholder (server
 * will skip the check automatically in that case).
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Candle } from '../types/binance';
import { FutuSymbol, FUTU_TO_YAHOO } from '../types/futu';

export type HKInterval = '5m' | '15m' | '1h' | '4h' | '1d';

// ── D5: proxy shared secret ───────────────────────────────────────────────────
const PROXY_SECRET = import.meta.env.VITE_PROXY_SECRET ?? '';

// ── Futu proxy ──────────────────────────────────────────────────────────────
async function fetchFromFutuProxy(symbol: string, interval: HKInterval, limit: number): Promise<Candle[]> {
  const headers: HeadersInit = {};
  if (PROXY_SECRET) headers['x-proxy-secret'] = PROXY_SECRET; // D5

  const res = await fetch(
    `/api/klines/${encodeURIComponent(symbol)}/${interval}?limit=${limit}`,
    { signal: AbortSignal.timeout(5000), headers }
  );
  if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
  const data: Candle[] = await res.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error('Empty proxy response');
  return data;
}

// ── Yahoo Finance ──────────────────────────────────────────────────────────────
const YAHOO_INTERVAL_MAP: Record<HKInterval, string> = {
  '5m':  '5m',
  '15m': '15m',
  '1h':  '60m',
  '4h':  '60m', // Yahoo has no native 4h; use 1h bars (Futu proxy handles real 4h)
  '1d':  '1d',
};

const YAHOO_RANGE_MAP: Record<HKInterval, string> = {
  '5m':  '5d',
  '15m': '10d',
  '1h':  '60d',
  '4h':  '30d', // 30d of 1h bars ≈ 120 bars, enough for MA60
  '1d':  '2y',
};

function yahooUrlPrimary(ticker: string, interval: HKInterval): string {
  const raw = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${YAHOO_INTERVAL_MAP[interval]}&range=${YAHOO_RANGE_MAP[interval]}`;
  return `https://api.allorigins.win/get?url=${encodeURIComponent(raw)}`;
}

function yahooUrlBackup(ticker: string, interval: HKInterval): string {
  const raw = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${YAHOO_INTERVAL_MAP[interval]}&range=${YAHOO_RANGE_MAP[interval]}`;
  return `https://corsproxy.io/?${encodeURIComponent(raw)}`;
}

function parseYahooChart(json: unknown): Candle[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (json as any)?.chart?.result?.[0];
  if (!result) return [];
  const ts: number[] = result.timestamp ?? [];
  const q = result.indicators?.quote?.[0] ?? {};
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
  try {
    const res = await fetch(yahooUrlPrimary(ticker, interval), { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const wrapper = await res.json();
      const inner = JSON.parse(wrapper.contents ?? '{}');
      const data = parseYahooChart(inner);
      if (data.length > 0) return data;
    }
  } catch { /* fall through to backup */ }
  const res2 = await fetch(yahooUrlBackup(ticker, interval), { signal: AbortSignal.timeout(10000) });
  if (!res2.ok) throw new Error(`Yahoo HTTP ${res2.status} (both proxies failed)`);
  const raw2 = await res2.json();
  const data2 = parseYahooChart(raw2);
  if (data2.length === 0) throw new Error('Empty data from both proxies');
  return data2;
}

// ── Poll intervals ────────────────────────────────────────────────────────────
const FUTU_POLL_MS  = 10_000;
const YAHOO_POLL_MS = 60_000;

// ── Hook ──────────────────────────────────────────────────────────────────
export function useFutuKlines(
  interval: HKInterval = '15m',
  limit = 200,
  symbol: FutuSymbol = 'HK.MHImain'
) {
  const [candles,     setCandles]     = useState<Candle[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [lastPrice,   setLastPrice]   = useState<number | null>(null);
  const [dataSource,  setDataSource]  = useState<'futu' | 'yahoo' | null>(null);
  // Fix 3: track exact time of last successful data fetch
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelRef = useRef(false);

  const fetchKlines = useCallback(async () => {
    try {
      const data = await fetchFromFutuProxy(symbol, interval, limit);
      if (cancelRef.current) return;
      setCandles(data);
      setLastPrice(data[data.length - 1]?.close ?? null);
      setError(null);
      setDataSource('futu');
      setLastUpdated(new Date()); // Fix 3: stamp successful fetch
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(fetchKlines, FUTU_POLL_MS);
      }
    } catch {
      try {
        const data = await fetchFromYahoo(symbol as FutuSymbol, interval);
        if (cancelRef.current) return;
        setCandles(data);
        setLastPrice(data[data.length - 1]?.close ?? null);
        setError(null);
        setDataSource('yahoo');
        setLastUpdated(new Date()); // Fix 3: stamp successful fetch
      } catch (yahooErr) {
        if (cancelRef.current) return;
        setError(`無法載入 ${symbol} 數據: ${yahooErr instanceof Error ? yahooErr.message : yahooErr}`);
        // Do NOT update lastUpdated on failure — keeps showing stale timestamp
      }
    } finally {
      if (!cancelRef.current) setLoading(false);
    }
  }, [symbol, interval, limit]);

  useEffect(() => {
    cancelRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    cancelRef.current = false;
    setLoading(true);
    setCandles([]);
    setLastPrice(null);
    setDataSource(null);
    setLastUpdated(null); // Fix 3: reset on symbol/interval change
    fetchKlines();
    timerRef.current = setInterval(fetchKlines, YAHOO_POLL_MS);
    return () => {
      cancelRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchKlines]);

  return { candles, loading, error, lastPrice, dataSource, lastUpdated, refetch: fetchKlines };
}
