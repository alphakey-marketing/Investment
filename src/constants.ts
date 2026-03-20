/**
 * src/constants.ts
 * A1 — Single source of truth for all magic numbers and app-wide defaults.
 */
import type { HKInterval } from './hooks/useYahooKlines';
import type { HKTicker } from './types/hkmarket';
import type { Lang } from './i18n';
import type { AppMode } from './types/mode';

// ── Data freshness ──────────────────────────────────────────────
// Set to 6 min to match the 5-min Yahoo poll interval in useYahooKlines.
// Previously 2 min — caused false STALE banner on every poll cycle.
export const STALE_THRESHOLD_MS = 6 * 60 * 1000; // 6 minutes

// ── Polling intervals ───────────────────────────────────────────
export const STALE_CHECK_INTERVAL_MS = 5_000;

// ── Default chart / MA settings ───────────────────────────────────
export const DEFAULT_SYMBOL: HKTicker     = '3081.HK';  // Value Gold ETF
export const DEFAULT_INTERVAL: HKInterval = '1h';        // 1h suits ETF swing trading
export const DEFAULT_MA1_PERIOD           = 5;    // MA5  — fast line, tracks price
export const DEFAULT_MA2_PERIOD           = 30;   // MA30 — trend anchor / dynamic S/R
export const DEFAULT_MA3_PERIOD           = 150;  // MA150 — macro trend filter (NEW)
export const DEFAULT_CANDLE_LIMIT         = 400;  // was 200 — MA150 needs 170+ bars warmup

// ── Default app settings ──────────────────────────────────────────
export const DEFAULT_MODE: AppMode = 'LIVE';
export const DEFAULT_LANG: Lang    = 'ZH';

// ── localStorage keys ────────────────────────────────────────────
export const LS_ONBOARD_DISMISSED  = 'onboard_dismissed';
export const LS_ROADMAP_DISMISSED  = 'roadmap_dismissed';
export const LS_ROADMAP_DONE       = 'roadmap_done';
export const LS_TRADE_JOURNAL      = 'kma_trade_journal';

// ── Signal notification ──────────────────────────────────────────
export const SIGNAL_TOAST_DURATION_MS = 12_000;

// ── Stop-loss / take-profit defaults ──────────────────────────────
// NOTE: SL and TP are now DYNAMIC in signal.ts v2 (structure-based from swing points).
// DEFAULT_SL_FRACTION and DEFAULT_TP_FRACTION removed in KMA v2.
// SL/TP are now computed dynamically from swing structure in signal.ts.