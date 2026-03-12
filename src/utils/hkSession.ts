/**
 * hkSession.ts — HK market trading hours helper (UTC+8)
 *
 * HKEX Derivatives trading hours:
 *   Morning:   09:15 – 12:00 HKT
 *   Afternoon: 13:00 – 16:30 HKT
 *   Evening:   17:15 – 03:00 HKT (next day) — futures only
 *
 * Used by detectSignal() to suppress signals outside trading hours.
 */

export interface HKTTime { h: number; m: number }

/** Convert a Unix timestamp (seconds) to HKT hour & minute */
export function toHKT(unixSec: number): HKTTime {
  const d = new Date(unixSec * 1000);
  // HKT = UTC+8
  const totalMinutes = d.getUTCHours() * 60 + d.getUTCMinutes() + 480;
  return {
    h: Math.floor((totalMinutes % 1440) / 60),
    m: totalMinutes % 60,
  };
}

function toMins(h: number, m: number) { return h * 60 + m; }

/**
 * Returns true if the given Unix timestamp falls within any HKEX trading session.
 * @param unixSec  — candle close timestamp in seconds
 * @param includeFuturesEvening — include the 17:15–03:00 evening session (futures only)
 */
export function isHKTradingHours(
  unixSec: number,
  includeFuturesEvening = true
): boolean {
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
