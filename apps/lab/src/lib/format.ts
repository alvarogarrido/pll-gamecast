import type { Db } from '@pll/data/db';
import { clockAtElapsed, formatClock, periodLabel } from '@pll/data/derive';

type Game = Db['games'][number];

export const teamName = (db: Db, id: string) => db.teams.find((t) => t.id === id)?.school ?? id;

export const matchup = (db: Db, g: Game) => `${teamName(db, g.away.teamId)} at ${teamName(db, g.home.teamId)}`;

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** "Q3 4:12", "Halftime", "OT 1:30", "Final" ... for a game-second. */
export function clockLabel(elapsed: number, end: number): string {
  if (elapsed <= 0) return 'Start';
  if (end > 0 && elapsed >= end) return 'End of log';
  const c = clockAtElapsed(elapsed);
  if (c.phase === 'halftime') return 'Halftime';
  const p = periodLabel(c.period);
  const name = c.period <= 4 ? `Q${c.period}` : p;
  return c.phase === 'break' ? `End of ${name}` : `${name} ${formatClock(c.clockSeconds)}`;
}

export function isoToClock(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  });
}
