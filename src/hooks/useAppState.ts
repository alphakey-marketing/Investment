/**
 * src/hooks/useAppState.ts
 * Centralized application state manager.
 */
import { useState, useEffect } from 'react';
import type { HKTicker } from '../types/hkmarket';
import type { HKInterval } from './useYahooKlines';
import type { AppMode } from '../types/mode';
import {
  DEFAULT_MODE, DEFAULT_SYMBOL, DEFAULT_INTERVAL,
  DEFAULT_MA1_PERIOD, DEFAULT_MA2_PERIOD, DEFAULT_MA3_PERIOD,
  STALE_CHECK_INTERVAL_MS,
} from '../constants';

export interface AppState {
  mode:          AppMode;
  symbol:        HKTicker;
  klineInterval: HKInterval;
  ma1Period:     number;
  ma2Period:     number;
  ma3Period:     number;
  now:           number;
}

export interface AppActions {
  setMode:          (m: AppMode) => void;
  setSymbol:        (s: HKTicker) => void;
  setKlineInterval: (i: HKInterval) => void;
  setMa1Period:     (p: number) => void;
  setMa2Period:     (p: number) => void;
  setMa3Period:     (p: number) => void;
}

export function useAppState(): [AppState, AppActions] {
  const [mode,          setMode]          = useState<AppMode>(DEFAULT_MODE);
  const [symbol,        setSymbol]        = useState<HKTicker>(DEFAULT_SYMBOL);
  const [klineInterval, setKlineInterval] = useState<HKInterval>(DEFAULT_INTERVAL);
  const [ma1Period,     setMa1Period]     = useState(DEFAULT_MA1_PERIOD);
  const [ma2Period,     setMa2Period]     = useState(DEFAULT_MA2_PERIOD);
  const [ma3Period,     setMa3Period]     = useState(DEFAULT_MA3_PERIOD);
  const [now,           setNow]           = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), STALE_CHECK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const state: AppState = {
    mode, symbol, klineInterval, ma1Period, ma2Period, ma3Period, now,
  };

  const actions: AppActions = {
    setMode, setSymbol, setKlineInterval,
    setMa1Period, setMa2Period, setMa3Period,
  };

  return [state, actions];
}