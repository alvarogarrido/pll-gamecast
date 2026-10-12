/**
 * Game-clock helpers. Pure and browser-safe.
 *
 * Rules modelled: 4 x 15:00 quarters, sudden-victory overtime periods of 4:00.
 * `elapsedSeconds` counts game-clock seconds since the opening faceoff across all periods.
 */
import type { LiveClock } from './api';

export const PERIOD_SECONDS = 900;
export const OT_SECONDS = 240;
export const REGULATION_PERIODS = 4;
export const REGULATION_SECONDS = PERIOD_SECONDS * REGULATION_PERIODS; // 3600

export function periodLength(period: number): number {
  return period <= REGULATION_PERIODS ? PERIOD_SECONDS : OT_SECONDS;
}

/** Elapsed seconds at the start of `period` (period 1 starts at 0, OT1 = period 5 starts at 3600). */
export function periodStartElapsed(period: number): number {
  if (period <= 1) return 0;
  if (period <= REGULATION_PERIODS + 1) return (period - 1) * PERIOD_SECONDS;
  return REGULATION_SECONDS + (period - REGULATION_PERIODS - 1) * OT_SECONDS;
}

export function periodEndElapsed(period: number): number {
  return periodStartElapsed(period) + periodLength(period);
}

export function elapsedOf(period: number, clockSeconds: number): number {
  return periodStartElapsed(period) + periodLength(period) - clockSeconds;
}

/**
 * Clock state at a given elapsed time. Period boundaries belong to the period that is ending
 * (clock 0:00, phase `break`/`halftime`), so the next period's plays stay hidden until it starts.
 */
export function clockAtElapsed(elapsed: number): LiveClock {
  if (elapsed <= 0) return { period: 1, clockSeconds: PERIOD_SECONDS, phase: 'in_progress' };
  let period = 1;
  while (periodEndElapsed(period) < elapsed) period += 1;
  const clockSeconds = Math.max(0, periodEndElapsed(period) - elapsed);
  if (clockSeconds > 0) return { period, clockSeconds, phase: 'in_progress' };
  return { period, clockSeconds: 0, phase: period === 2 ? 'halftime' : 'break' };
}

/** Human label: "1st", "2nd", "3rd", "4th", "OT", "2OT". */
export function periodLabel(period: number): string {
  if (period <= REGULATION_PERIODS) return ['1st', '2nd', '3rd', '4th'][period - 1] as string;
  const n = period - REGULATION_PERIODS;
  return n === 1 ? 'OT' : `${n}OT`;
}

/** "4:12" */
export function formatClock(clockSeconds: number): string {
  const m = Math.floor(clockSeconds / 60);
  const s = clockSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Wall clock <-> game clock (used for `lastPlayAt` and for picking a live moment from "now")
// ---------------------------------------------------------------------------

/** Real seconds per game-clock second, averaged over stoppages (a 60:00 game takes about 2h15m). */
const WALL_PER_GAME_SECOND = 2.1;
const SHORT_BREAK = 120;
const HALFTIME = 600;

/** Real seconds after the scheduled start at which `elapsed` game-seconds have been played. */
export function wallClockOffsetSeconds(elapsed: number): number {
  let t = Math.max(0, elapsed) * WALL_PER_GAME_SECOND;
  if (elapsed > periodEndElapsed(1)) t += SHORT_BREAK;
  if (elapsed > periodEndElapsed(2)) t += HALFTIME;
  if (elapsed > periodEndElapsed(3)) t += SHORT_BREAK;
  if (elapsed > REGULATION_SECONDS) t += SHORT_BREAK;
  return Math.round(t);
}

export function wallClockAt(startTime: string, elapsed: number): string {
  return new Date(Date.parse(startTime) + wallClockOffsetSeconds(elapsed) * 1000).toISOString();
}

/** Inverse of `wallClockAt`: the game-clock second that is in progress at `now` (0 if not yet started). */
export function elapsedAtWallClock(startTime: string, now: string, maxElapsed = REGULATION_SECONDS): number {
  const real = (Date.parse(now) - Date.parse(startTime)) / 1000;
  if (real <= 0) return 0;
  let lo = 0;
  let hi = maxElapsed;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (wallClockOffsetSeconds(mid) <= real) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}
