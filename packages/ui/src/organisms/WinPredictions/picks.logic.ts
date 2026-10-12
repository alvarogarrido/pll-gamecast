import type { GameDetail, GamePreview, TeamRef } from '@pll/data/api';

export type StaffPickEntry = GamePreview['data']['staffPicks'][number];
type Game = Pick<GameDetail['data'], 'home' | 'away'>;

export interface ResolvedPick {
  pick: StaffPickEntry;
  team: TeamRef;
  side: 'away' | 'home';
}

/** Picks whose team is one of the two playing teams (others are ignored), in the given order. */
export function resolvePicks(picks: readonly StaffPickEntry[], game: Game): ResolvedPick[] {
  const out: ResolvedPick[] = [];
  for (const pick of picks) {
    if (pick.pickTeamId === game.away.team.id) out.push({ pick, team: game.away.team, side: 'away' });
    else if (pick.pickTeamId === game.home.team.id) out.push({ pick, team: game.home.team, side: 'home' });
  }
  return out;
}

export interface PickTally {
  total: number;
  away: number;
  home: number;
  /** The team most staff picked; `null` for a tie or no picks. */
  leader: TeamRef | null;
  leaderCount: number;
  /** "3 of 4 pick Duke", "Staff split 2–2", or `null` with no picks. */
  text: string | null;
}

export function tallyPicks(picks: readonly StaffPickEntry[], game: Game): PickTally {
  const resolved = resolvePicks(picks, game);
  const away = resolved.filter((p) => p.side === 'away').length;
  const home = resolved.length - away;
  const total = resolved.length;
  if (total === 0) return { total, away, home, leader: null, leaderCount: 0, text: null };
  if (away === home) return { total, away, home, leader: null, leaderCount: away, text: `Staff split ${away}–${home}` };
  const leader = away > home ? game.away.team : game.home.team;
  const leaderCount = Math.max(away, home);
  return { total, away, home, leader, leaderCount, text: `${leaderCount} of ${total} pick ${leader.school}` };
}

/** Home win probability to the two sides; `null` when unknown. */
export function winSplit(winProbabilityHome: number | null): { away: number; home: number } | null {
  if (winProbabilityHome === null || !Number.isFinite(winProbabilityHome)) return null;
  const home = Math.min(1, Math.max(0, winProbabilityHome));
  return { away: 1 - home, home };
}
