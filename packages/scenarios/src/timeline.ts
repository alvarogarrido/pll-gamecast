import type { Db } from '@pll/data/db';
import { periodEndElapsed, periodLabel } from '@pll/data/derive';

export interface TimelineTick {
  elapsed: number;
  /** "Q1", "HALF", "Q3", "END", "OT", "2OT" ... (the end of that period). */
  label: string;
}

export interface Timeline {
  gameId: string;
  /** Elapsed second of the last play (0 when the log is empty). */
  end: number;
  ticks: TimelineTick[];
  /** Goals in chronological order with the running score after each. */
  goals: { elapsed: number; home: number; away: number }[];
  /** Highest period in the log. */
  periods: number;
}

/** Total length of a game's log, in game-seconds. */
export function logEnd(db: Db, gameId: string): number {
  const plays = db.plays[gameId];
  return plays?.[plays.length - 1]?.elapsedSeconds ?? 0;
}

export function buildTimeline(db: Db, gameId: string): Timeline {
  const game = db.games.find((g) => g.id === gameId);
  const plays = db.plays[gameId] ?? [];
  const end = logEnd(db, gameId);
  const periods = plays.reduce((m, p) => Math.max(m, p.period), 0);
  const goals: Timeline['goals'] = [];
  let home = 0;
  let away = 0;
  for (const p of plays) {
    if (p.type !== 'goal') continue;
    if (p.teamId === game?.home.teamId) home += 1;
    else away += 1;
    goals.push({ elapsed: p.elapsedSeconds, home, away });
  }
  const ticks: TimelineTick[] = [];
  for (let period = 1; period <= Math.max(periods, 4); period += 1) {
    const elapsed = periodEndElapsed(period);
    if (period > periods || elapsed > end + 1) break;
    const label =
      period === 1 ? 'Q1' : period === 2 ? 'HALF' : period === 3 ? 'Q3' : period === 4 ? 'END' : periodLabel(period);
    ticks.push({ elapsed, label });
  }
  return { gameId, end, ticks, goals, periods };
}

/** Score after every goal with `elapsedSeconds <= elapsed`. */
export function scoreAt(timeline: Timeline, elapsed: number): { home: number; away: number } {
  let lo = 0;
  let hi = timeline.goals.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((timeline.goals[mid] as { elapsed: number }).elapsed <= elapsed) lo = mid + 1;
    else hi = mid;
  }
  const g = timeline.goals[lo - 1];
  return g ? { home: g.home, away: g.away } : { home: 0, away: 0 };
}
