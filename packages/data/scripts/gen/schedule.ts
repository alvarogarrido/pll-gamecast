/** Who plays whom: weekly pairings for weeks 1-5 and the hand-built snapshot slate (week 6). */
import type { GameType } from '../../src/schema';
import { TEAM_SEEDS, type TeamSeed } from './league';
import type { Rng } from './rng';
import type { TeamState } from './ratings';

export type PlanKind = 'normal' | 'ot' | 'comeback' | 'live_close' | 'live_mid';
export type SlotKind = 'final' | 'live' | 'scheduled';

export interface GameSlot {
  key: string;
  week: number;
  /** 'YYYY-MM-DD' (local date at the venue). */
  date: string;
  /** Local start time at the home venue. */
  hour: number;
  minute: number;
  homeId: string;
  awayId: string;
  kind: SlotKind;
  plan: PlanKind;
  gameType: GameType;
  label: string | null;
  neutralSite: boolean;
  seeds: { home: number; away: number } | null;
}

/** Games per week for weeks 1-5 (the rest of the field has a bye). */
export const GAMES_PER_WEEK = [6, 7, 7, 8, 8];

const START_TIMES: ReadonlyArray<readonly [number, number]> = [
  [11, 0],
  [12, 0],
  [12, 0],
  [13, 0],
  [14, 0],
  [15, 0],
  [16, 0],
  [18, 0],
];

export const pairKey = (a: string, b: string) => [a, b].sort().join('|');

/** Pair up `count` games for one week, avoiding rematches and favouring conference games once league play starts. */
export function weeklySlots(
  rng: Rng,
  week: number,
  count: number,
  states: ReadonlyMap<string, TeamState>,
  played: Set<string>,
  blocked: ReadonlySet<string>,
  date: (dayOffset: number) => string,
): GameSlot[] {
  // Teams with fewer games played get priority; random tiebreak.
  const field = rng
    .shuffle(TEAM_SEEDS)
    .sort((a, b) => (states.get(a.id)?.games ?? 0) - (states.get(b.id)?.games ?? 0))
    .slice(0, count * 2);
  const pool = rng.shuffle(field);
  const slots: GameSlot[] = [];
  const leagueWeight = week >= 3 ? 2.4 : 0.9;

  while (pool.length >= 2) {
    const first = pool.shift() as TeamSeed;
    const opponent = rng.weighted(pool, (t) => {
      const sameConference = t.conferenceId === first.conferenceId;
      const key = pairKey(first.id, t.id);
      const rematch = played.has(key);
      return blocked.has(key) ? 0 : (sameConference ? leagueWeight : 1) * (rematch ? 0.03 : 1);
    });
    pool.splice(pool.indexOf(opponent), 1);
    played.add(pairKey(first.id, opponent.id));

    const firstHomeGames = states.get(first.id)?.homeGames ?? 0;
    const oppHomeGames = states.get(opponent.id)?.homeGames ?? 0;
    const firstIsHome = rng.chance(firstHomeGames === oppHomeGames ? 0.5 : firstHomeGames < oppHomeGames ? 0.72 : 0.28);
    const [home, away] = firstIsHome ? [first, opponent] : [opponent, first];

    const [hour, minute] = rng.pick(START_TIMES);
    const index = slots.length + 1;
    slots.push({
      key: `w${week}-g${index}`,
      week,
      date: date(rng.chance(0.88) ? 0 : 1),
      hour: home.timeZone === 'MT' ? hour - 2 : hour,
      minute,
      homeId: home.id,
      awayId: away.id,
      kind: 'final',
      plan: 'normal',
      gameType: 'regular',
      label: null,
      neutralSite: false,
      seeds: null,
    });
  }
  return slots;
}

/** The Saturday slate at the snapshot: 3 final, 2 live (mid-Q2 and a tight Q4), 3 scheduled. Local start times. */
export const SNAPSHOT_SLATE: ReadonlyArray<{
  home: string;
  away: string;
  hour: number;
  minute: number;
  kind: SlotKind;
  plan: PlanKind;
}> = [
  { home: 'cornell', away: 'penn', hour: 11, minute: 0, kind: 'final', plan: 'normal' },
  { home: 'ohio-state', away: 'michigan', hour: 12, minute: 0, kind: 'final', plan: 'normal' },
  { home: 'virginia', away: 'georgetown', hour: 12, minute: 30, kind: 'final', plan: 'normal' },
  { home: 'notre-dame', away: 'duke', hour: 13, minute: 15, kind: 'live', plan: 'live_close' },
  { home: 'johns-hopkins', away: 'maryland', hour: 14, minute: 40, kind: 'live', plan: 'live_mid' },
  { home: 'syracuse', away: 'north-carolina', hour: 16, minute: 0, kind: 'scheduled', plan: 'normal' },
  { home: 'princeton', away: 'yale', hour: 17, minute: 0, kind: 'scheduled', plan: 'normal' },
  { home: 'denver', away: 'penn-state', hour: 17, minute: 0, kind: 'scheduled', plan: 'normal' }, // 5:00 PM MT
];
