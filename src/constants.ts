/**
 * src/constants.ts
 * A1 — Single source of truth for all magic numbers and app-wide defaults.
 * Import from here instead of scattering literals across components.
 */
import type { HKInterval } from './hooks/useFutuKlines';
import type { FutuSymbol } from './types/futu';
import type { Lang } from './i18n';
import type { AppMode } from './types/mode';

// ── Data freshness ──────────────────────────────────────────────────────────
/** Mark data as stale after this many milliseconds without a successful fetch */
export const STALE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

// ── Polling intervals ───────────────────────────────────────────────────────
/** How often (ms) to re-check staleness in the UI tick */
export const STALE_CHECK_INTERVAL_MS = 5_000;

// ── Default chart / MA settings ─────────────────────────────────────────────
export const DEFAULT_SYMBOL: FutuSymbol    = 'HK.MHImain';
export const DEFAULT_INTERVAL: HKInterval  = '15m';
export const DEFAULT_MA1_PERIOD            = 10;
export const DEFAULT_MA2_PERIOD            = 20;
export const DEFAULT_CANDLE_LIMIT          = 200;

// ── Default app settings ─────────────────────────────────────────────────────
export const DEFAULT_MODE: AppMode = 'LIVE';
export const DEFAULT_LANG: Lang    = 'ZH';

// ── localStorage keys ────────────────────────────────────────────────────────
export const LS_ONBOARD_DISMISSED  = 'onboard_dismissed';
export const LS_ROADMAP_DISMISSED  = 'roadmap_dismissed';
export const LS_ROADMAP_DONE       = 'roadmap_done';
export const LS_TRADE_JOURNAL      = 'kma_trade_journal';

// ── Signal notification ──────────────────────────────────────────────────────
/** Toast duration in ms for trade signal notifications */
export const SIGNAL_TOAST_DURATION_MS = 12_000;

// ── Stop-loss / take-profit defaults (as fraction of entry price) ───────────
export const DEFAULT_SL_FRACTION = 0.01;  // 1%
export const DEFAULT_TP_FRACTION = 0.03;  // 3%
