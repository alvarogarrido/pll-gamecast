import type { GameDetail, GamePreview, TeamRef } from '@pll/data/api';

export type InjuryEntry = GamePreview['data']['injuries'][number];
export type InjuryStatus = InjuryEntry['status'];
export type InjuryGame = Pick<GameDetail['data'], 'home' | 'away'>;

export interface InjuryGroup {
  side: 'away' | 'home';
  team: TeamRef;
  injuries: InjuryEntry[];
}

/** Most severe first, so an "Out" never hides under a "Day-to-day". */
const severity: Record<InjuryStatus, number> = { out: 0, doubtful: 1, questionable: 2, day_to_day: 3 };

const labels: Record<InjuryStatus, string> = {
  out: 'Out',
  doubtful: 'Doubtful',
  questionable: 'Questionable',
  day_to_day: 'Day-to-day',
};

export const injuryStatusLabel = (status: InjuryStatus): string => labels[status];

export type InjuryTone = 'negative' | 'gold' | 'neutral';

/** out = negative tint, doubtful/questionable = gold tint, day-to-day = neutral. */
export function injuryTone(status: InjuryStatus): InjuryTone {
  if (status === 'out') return 'negative';
  if (status === 'day_to_day') return 'neutral';
  return 'gold';
}

/**
 * Groups injuries by team (away first, then home), sorted by severity then last name. Players that belong to neither
 * team are dropped. Both teams are always returned so the UI can say "No reported injuries" for a healthy one.
 */
export function groupInjuries(injuries: readonly InjuryEntry[], game: InjuryGame): InjuryGroup[] {
  const sides = [
    { side: 'away' as const, team: game.away.team },
    { side: 'home' as const, team: game.home.team },
  ];
  return sides.map(({ side, team }) => ({
    side,
    team,
    injuries: injuries
      .filter((i) => i.player.teamId === team.id)
      .sort(
        (a, b) =>
          severity[a.status] - severity[b.status] || a.player.lastName.localeCompare(b.player.lastName),
      ),
  }));
}

/** True when no injury belongs to either team of the game. */
export const hasInjuries = (groups: readonly InjuryGroup[]): boolean => groups.some((g) => g.injuries.length > 0);
