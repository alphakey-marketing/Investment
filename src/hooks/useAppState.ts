/**
 * src/hooks/useAppState.ts
 * A2 — Centralized application state manager
 * Replaces 10+ useState calls in App.tsx with a single hook.
 */
import { useState, useEffect } from 'react';
import type { HKTicker } from '../types/hkmarket';
import type { HKInterval } from './useYahooKlines';
import type { AppMode } from '../types/mode';
import type { Lang } from '../i18n';
import {
  DEFAULT_MODE, DEFAULT_LANG, DEFAULT_SYMBOL, DEFAULT_INTERVAL,
  DEFAULT_MA1_PERIOD, DEFAULT_MA2_PERIOD, DEFAULT_MA3_PERIOD,
  LS_ONBOARD_DISMISSED, LS_ROADMAP_DISMISSED,
  STALE_CHECK_INTERVAL_MS,
} from '../constants';

export interface AppState {
  // ── Core trading settings ────────────────────────────────────────────────────
  mode:          AppMode;
  lang:          Lang;
  symbol:        HKTicker;    // Yahoo Finance ticker format e.g. '3081.HK'
  klineInterval: HKInterval;
  ma1Period:     number;   // MA5  — fast line
  ma2Period:     number;   // MA30 — trend anchor
  ma3Period:     number;   // MA150 — macro filter (v2)

  // ── UI flags ───────────────────────────────────────────────────────────────
  showOnboard: boolean;
  showRoadmap: boolean;

  // ── Staleness ticker ────────────────────────────────────────────────────────────
  now: number; // timestamp used to force staleness re-check
}

export interface AppActions {
  setMode:          (m: AppMode) => void;
  setLang:          (l: Lang) => void;
  setSymbol:        (s: HKTicker) => void;
  setKlineInterval: (i: HKInterval) => void;
  setMa1Period:     (p: number) => void;
  setMa2Period:     (p: number) => void;
  setMa3Period:     (p: number) => void;  // v2
  dismissOnboard:   () => void;
  dismissRoadmap:   () => void;
  showRoadmapAgain: () => void;
}

export function useAppState(): [AppState, AppActions] {
  const [mode,          setMode]          = useState<AppMode>(DEFAULT_MODE);
  const [lang,          setLang]          = useState<Lang>(DEFAULT_LANG);
  const [symbol,        setSymbol]        = useState<HKTicker>(DEFAULT_SYMBOL);
  const [klineInterval, setKlineInterval] = useState<HKInterval>(DEFAULT_INTERVAL);
  const [ma1Period,     setMa1Period]     = useState(DEFAULT_MA1_PERIOD);
  const [ma2Period,     setMa2Period]     = useState(DEFAULT_MA2_PERIOD);
  const [ma3Period,     setMa3Period]     = useState(DEFAULT_MA3_PERIOD);  // v2
  const [showOnboard,   setShowOnboard]   = useState(() => !localStorage.getItem(LS_ONBOARD_DISMISSED));
  const [showRoadmap,   setShowRoadmap]   = useState(() => !localStorage.getItem(LS_ROADMAP_DISMISSED));
  const [now,           setNow]           = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), STALE_CHECK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const dismissOnboard = () => {
    localStorage.setItem(LS_ONBOARD_DISMISSED, '1');
    setShowOnboard(false);
  };

  const dismissRoadmap = () => {
    localStorage.setItem(LS_ROADMAP_DISMISSED, '1');
    setShowRoadmap(false);
  };

  const showRoadmapAgain = () => {
    localStorage.removeItem(LS_ROADMAP_DISMISSED);
    setShowRoadmap(true);
  };

  const state: AppState = {
    mode, lang, symbol, klineInterval, ma1Period, ma2Period, ma3Period,
    showOnboard, showRoadmap, now,
  };

  const actions: AppActions = {
    setMode, setLang, setSymbol, setKlineInterval,
    setMa1Period, setMa2Period, setMa3Period,
    dismissOnboard, dismissRoadmap, showRoadmapAgain,
  };

  return [state, actions];
}
