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
export const DEFAULT_MA1_PERIOD           = 20;
export const DEFAULT_MA2_PERIOD           = 60;
export const DEFAULT_CANDLE_LIMIT         = 200;

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
export const DEFAULT_SL_FRACTION = 0.01;   // 1% — widened for ETF noise tolerance
export const DEFAULT_TP_FRACTION = 0.025;  // 2.5% — aligns with backtest tpPct
