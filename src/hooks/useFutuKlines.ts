/**
 * useFutuKlines — HK Futures / HKEX market data hook
 *
 * Sprint 2: Now uses the local Futu proxy server by default.
 * Falls back to Yahoo Finance (allorigins CORS proxy) if the Futu proxy
 * is unreachable (e.g. FutuOpenD not running yet).
 *
 * Data source priority:
 *   1. Futu proxy  http://localhost:3001/api/klines/:symbol/:interval
 *   2. Yahoo Finance (fallback, 60s poll, delayed)
 *
 * Return shape is identical to useBinanceKlines so App.tsx is a 1-line swap.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Candle } from '../types/binance';
import { FutuSymbol, FUTU_TO_YAHOO } from '../types/futu';

export type HKInterval = '5m' | '15m' | '1h' | '4h' | '1d';

// ── Futu proxy ──────────────────────────────────────────────────────────────
const PROXY_BASE = '/api';  // Vite proxies /api → localhost:3001 in dev
                             // In production, point to your deployed proxy

async function fetchFromFutuProxy(symbol: string, interval: HKInterval, limit = 200): Promise<Candle[]> {
  const res = await fetch(`${PROXY_BASE}/klines/${encodeURIComponent(symbol)}/${interval}?limit=${limit}`,
    { signal: AbortSignal.timeout(5000) }  // 5s timeout — fast fail if OpenD not running
  );
  if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
  const data: Candle[] = await res.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error('Empty proxy response');
  return data;
}

// ── Yahoo Finance fallback ──────────────────────────────────────────────────
const YAHOO_INTERVAL_MAP: Record<HKInterval, string> = {
  '5m':  '5m',
  '15m': '15m',
  '1h':  '60m',
  '4h':  '1d',
  '1d':  '1d',
};

const YAHOO_RANGE_MAP: Record<HKInterval, string> = {
  '5m':  '5d',
  '15m': '10d',
  '1h':  '60d',
  '4h':  '1y',
  '1d':  '2y',
};

function yahooUrl(ticker: string, interval: HKInterval): string {
  const raw = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${YAHOO_INTERVAL_MAP[interval]}&range=${YAHOO_RANGE_MAP[interval]}`;
  return `https://api.allorigins.win/get?url=${encodeURIComponent(raw)}`;
}

function parseYahooChart(json: unknown): Candle[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (json as any)?.chart?.result?.[0];
  if (!result) return [];
  const timestamps: number[] = result.timestamp ?? [];
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

async function fetchFromYahoo(symbol: FutuSymbol, interval: HKInterval): Promise<Candle[]> {
  const ticker = FUTU_TO_YAHOO[symbol];
  if (!ticker) throw new Error(`No Yahoo ticker for ${symbol}`);
  const res = await fetch(yahooUrl(ticker, interval));
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
  const wrapper = await res.json();
  const inner   = JSON.parse(wrapper.contents ?? '{}');
  const data    = parseYahooChart(inner);
  if (data.length === 0) throw new Error('Empty Yahoo data');
  return data;
}

// ── Poll intervals ──────────────────────────────────────────────────────────
const FUTU_POLL_MS  =  10_000;  // Futu: real-time, poll every 10s
const YAHOO_POLL_MS =  60_000;  // Yahoo: rate-limited, poll every 60s

// ── Hook ────────────────────────────────────────────────────────────────────
export function useFutuKlines(
  interval: HKInterval = '15m',
  _limit = 200,
  symbol: FutuSymbol = 'HK.MHImain'
) {
  const [candles,    setCandles]    = useState<Candle[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [lastPrice,  setLastPrice]  = useState<number | null>(null);
  const [dataSource, setDataSource] = useState<'futu' | 'yahoo' | null>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollMsRef = useRef<number>(YAHOO_POLL_MS);

  const fetchKlines = useCallback(async () => {
    // Try Futu proxy first, fall back to Yahoo
    try {
      const data = await fetchFromFutuProxy(symbol, interval, _limit);
      setCandles(data);
      setLastPrice(data[data.length - 1]?.close ?? null);
      setError(null);
      setDataSource('futu');
      pollMsRef.current = FUTU_POLL_MS;   // speed up polling on success
    } catch (futuErr) {
      // Futu proxy unavailable — silently fall back to Yahoo
      try {
        const data = await fetchFromYahoo(symbol as FutuSymbol, interval);
        setCandles(data);
        setLastPrice(data[data.length - 1]?.close ?? null);
        setDataSource('yahoo');
        setError(null);
        pollMsRef.current = YAHOO_POLL_MS;
      } catch (yahooErr) {
        setError(
          `無法載入 ${symbol} 數據\n` +
          `Futu: ${futuErr instanceof Error ? futuErr.message : futuErr}\n` +
          `Yahoo: ${yahooErr instanceof Error ? yahooErr.message : yahooErr}`
        );
      }
    } finally {
      setLoading(false);
    }
  }, [symbol, interval, _limit]);

  // Re-subscribe whenever symbol/interval changes
  useEffect(() => {
    setLoading(true);
    setCandles([]);
    setLastPrice(null);
    setDataSource(null);

    fetchKlines();

    // Adaptive poll: fast if Futu connected, slow if Yahoo fallback
    const scheduleNext = () => {
      timerRef.current = setTimeout(async () => {
        await fetchKlines();
        scheduleNext();
      }, pollMsRef.current);
    };
    scheduleNext();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchKlines]);

  return { candles, loading, error, lastPrice, dataSource, refetch: fetchKlines };
}
