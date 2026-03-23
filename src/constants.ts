/**
 * src/constants.ts
 * A1 — Single source of truth for all magic numbers and app-wide defaults.
 */
import type { HKInterval } from './hooks/useYahooKlines';
import type { HKTicker } from './types/hkmarket';
import type { AppMode } from './types/mode';

// ── Data freshness ──────────────────────────────────────────────
// Set to 6 min to match the 5-min Yahoo poll interval in useYahooKlines.
export const STALE_THRESHOLD_MS = 6 * 60 * 1000; // 6 minutes

// ── Polling intervals ───────────────────────────────────────────
export const STALE_CHECK_INTERVAL_MS = 5_000;

// ── Default chart / MA settings ───────────────────────────────────
export const DEFAULT_SYMBOL: HKTicker     = '3081.HK';  // Value Gold ETF
export const DEFAULT_INTERVAL: HKInterval = '1h';
export const DEFAULT_MA1_PERIOD           = 5;
export const DEFAULT_MA2_PERIOD           = 30;
export const DEFAULT_MA3_PERIOD           = 150;
export const DEFAULT_CANDLE_LIMIT         = 400;

// ── Default app settings ──────────────────────────────────────────
export const DEFAULT_MODE: AppMode = 'LIVE';

// ── localStorage keys ────────────────────────────────────────────
export const LS_TRADE_JOURNAL = 'kma_trade_journal';

// ── Signal notification ──────────────────────────────────────────
export const SIGNAL_TOAST_DURATION_MS = 12_000;

// ── Stop-loss / take-profit defaults ──────────────────────────────
// NOTE: SL and TP are DYNAMIC in signal.ts v2 (structure-based from swing points).