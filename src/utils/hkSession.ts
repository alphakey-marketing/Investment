/**
 * hkSession.ts — HK market trading hours helper (UTC+8)
 *
 * HKEX Derivatives trading hours:
 *   Morning:   09:15 – 12:00 HKT
 *   Afternoon: 13:00 – 16:30 HKT
 *   Evening:   17:15 – 03:00 HKT (next day) — futures only
 *
 * Fix 8: isHKTradingHours() now returns false on weekends (Sat/Sun).
 * Yahoo Finance occasionally returns weekend timestamps for some indices;
 * without this check a signal could fire on Saturday/Sunday data.
 *
 * Used by detectSignal() and backtest.ts to suppress off-hours signals.
 */

export interface HKTTime { h: number; m: number; dayOfWeek: number }

/** Convert a Unix timestamp (seconds) to HKT hour, minute, and day-of-week */
export function toHKT(unixSec: number): HKTTime {
  const d = new Date(unixSec * 1000);
  // HKT = UTC+8: add 480 minutes to UTC
  const utcMins     = d.getUTCHours() * 60 + d.getUTCMinutes();
  const hktMins     = utcMins + 480;
  const hktDay      = d.getUTCDay(); // 0=Sun, 1=Mon … 6=Sat (UTC, close enough for HKT)
  // If hktMins >= 1440 we've wrapped into the next day
  const overflowDay = hktMins >= 1440 ? (hktDay + 1) % 7 : hktDay;
  return {
    h:         Math.floor((hktMins % 1440) / 60),
    m:         hktMins % 60,
    dayOfWeek: overflowDay,
  };
}

function toMins(h: number, m: number) { return h * 60 + m; }

/**
 * Returns true if the given Unix timestamp is a HKT weekend day (Sat or Sun).
 * Used by backtest.ts to filter out weekend candles before signal detection.
 */
export function isHKWeekend(unixSec: number): boolean {
  const { dayOfWeek } = toHKT(unixSec);
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Returns true if the given Unix timestamp falls within any HKEX trading session.
 *
 * @param unixSec               — candle close timestamp in seconds
 * @param includeFuturesEvening — include the 17:15–03:00 evening session (futures only)
 */
export function isHKTradingHours(
  unixSec: number,
  includeFuturesEvening = true
): boolean {
  // Fix 8: reject weekends before checking hours
  if (isHKWeekend(unixSec)) return false;

  const { h, m } = toHKT(unixSec);
  const mins = toMins(h, m);

  const morning   = mins >= toMins(9, 15)  && mins < toMins(12, 0);
  const afternoon = mins >= toMins(13, 0)  && mins < toMins(16, 30);
  // Evening crosses midnight: 17:15–23:59 OR 00:00–03:00
  const eveningA  = mins >= toMins(17, 15);
  const eveningB  = mins <  toMins(3, 0);
  const evening   = includeFuturesEvening && (eveningA || eveningB);

  return morning || afternoon || evening;
}

/**
 * Returns a short HKT time string for display, e.g. "14:32 HKT"
 */
export function formatHKT(unixSec: number): string {
  const { h, m } = toHKT(unixSec);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} HKT`;
}
