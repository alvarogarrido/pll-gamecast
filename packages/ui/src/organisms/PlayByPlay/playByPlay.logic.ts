/**
 * Pure logic for the Play-by-Play tab and the Latest Plays card: filtering, grouping by period, ordering,
 * labels and the "secondary detail" line of a play. No React, no clock access.
 */
import type { GameSummary, Play, PlayerRef } from '@pll/data/api';
import { periodLabel, playerShortName } from '../../lib/format';

export type PlayFilter = 'all' | 'goals' | 'shots' | 'faceoffs' | 'turnovers' | 'penalties';
export type PlayOrder = 'newest' | 'oldest';
export type PlayKind = 'goal' | 'micro' | 'divider';

export const PLAY_FILTERS: ReadonlyArray<{ id: PlayFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'goals', label: 'Goals' },
  { id: 'shots', label: 'Shots' },
  { id: 'faceoffs', label: 'Faceoffs' },
  { id: 'turnovers', label: 'Turnovers' },
  { id: 'penalties', label: 'Penalties' },
];

/** Plays that are not game action: only ever shown as small dividers in the "All" view. */
export function isDividerPlay(play: Pick<Play, 'type'>): boolean {
  return play.type === 'period_start' || play.type === 'period_end' || play.type === 'timeout';
}

export function playKind(play: Pick<Play, 'type'>): PlayKind {
  if (play.type === 'goal') return 'goal';
  return isDividerPlay(play) ? 'divider' : 'micro';
}

/**
 * Filter semantics (PRD): Shots = shot + goal; Turnovers = turnover; Faceoffs = faceoff; Penalties = penalty.
 * "All" is everything, including period and timeout dividers (which no other filter shows).
 */
export function matchesFilter(play: Pick<Play, 'type'>, filter: PlayFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'goals':
      return play.type === 'goal';
    case 'shots':
      return play.type === 'shot' || play.type === 'goal';
    case 'faceoffs':
      return play.type === 'faceoff';
    case 'turnovers':
      return play.type === 'turnover';
    case 'penalties':
      return play.type === 'penalty';
  }
}

export function filterPlays<T extends Pick<Play, 'type'>>(plays: readonly T[], filter: PlayFilter): T[] {
  return plays.filter((p) => matchesFilter(p, filter));
}

export function countByFilter(plays: readonly Pick<Play, 'type'>[]): Record<PlayFilter, number> {
  const counts: Record<PlayFilter, number> = { all: 0, goals: 0, shots: 0, faceoffs: 0, turnovers: 0, penalties: 0 };
  for (const p of plays) for (const f of PLAY_FILTERS) if (matchesFilter(p, f.id)) counts[f.id] += 1;
  return counts;
}

/** Chronological comparison. `seq` is authoritative; elapsed time breaks ties between logs that restart `seq`. */
function byTime(a: Play, b: Play): number {
  return a.elapsedSeconds - b.elapsedSeconds || a.seq - b.seq;
}

/** Live games read newest first (a feed); finished games read chronologically (a story). */
export function defaultPlayOrder(status: GameSummary['status']): PlayOrder {
  return status === 'live' ? 'newest' : 'oldest';
}

export function sortPlays(plays: readonly Play[], order: PlayOrder): Play[] {
  const sorted = [...plays].sort(byTime);
  return order === 'newest' ? sorted.reverse() : sorted;
}

export interface PeriodGroup {
  period: number;
  /** `Q1` .. `Q4`, `OT`, `2OT`. */
  label: string;
  /** Plays that pass the filter, in display order. */
  plays: Play[];
  /** Every play of the period regardless of the filter. */
  totalPlays: number;
  goals: number;
  /** Running score after the last play of the period (unfiltered), or null when nothing was played. */
  endScore: { away: number; home: number } | null;
}

export interface GroupOptions {
  filter?: PlayFilter;
  /** `newest`: newest period first and newest play first. `oldest`: chronological. */
  order?: PlayOrder;
}

/** Group plays by period for the accordions. Periods with no play for the active filter are dropped. */
export function groupPlaysByPeriod(plays: readonly Play[], { filter = 'all', order = 'newest' }: GroupOptions = {}): PeriodGroup[] {
  const chronological = [...plays].sort(byTime);
  const periods = new Map<number, Play[]>();
  for (const p of chronological) {
    const list = periods.get(p.period);
    if (list) list.push(p);
    else periods.set(p.period, [p]);
  }

  const groups: PeriodGroup[] = [];
  for (const [period, all] of periods) {
    const shown = filterPlays(all, filter);
    if (shown.length === 0) continue;
    const last = all[all.length - 1];
    groups.push({
      period,
      label: periodLabel(period),
      plays: order === 'newest' ? [...shown].reverse() : shown,
      totalPlays: all.length,
      goals: all.filter((p) => p.type === 'goal').length,
      endScore: last ? { away: last.awayScore, home: last.homeScore } : null,
    });
  }
  groups.sort((a, b) => (order === 'newest' ? b.period - a.period : a.period - b.period));
  return groups;
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

/** Play title: "Goal", "Save", "Caused turnover", "Faceoff"... Dividers get their own wording, see {@link dividerLabel}. */
export function playLabel(play: Play): string {
  switch (play.type) {
    case 'goal':
      return 'Goal';
    case 'shot':
      switch (play.details.shotResult) {
        case 'saved':
          return 'Save';
        case 'wide':
          return 'Shot wide';
        case 'pipe':
          return 'Hits the pipe';
        case 'blocked':
          return 'Blocked shot';
        default:
          return 'Shot';
      }
    case 'faceoff':
      return 'Faceoff';
    case 'ground_ball':
      return 'Ground ball';
    case 'turnover':
      return play.details.causedTurnover === true || play.opponentPlayerId ? 'Caused turnover' : 'Turnover';
    case 'clear':
      return play.details.cleared === false ? 'Failed clear' : 'Clear';
    case 'penalty':
      return 'Penalty';
    case 'timeout':
      return 'Timeout';
    case 'period_start':
      return `Start of ${periodLabel(play.period)}`;
    case 'period_end':
      return `End of ${periodLabel(play.period)}`;
  }
}

/** Divider text: "Start of Q2", "End of Q1", "Timeout · DUKE". */
export function dividerLabel(play: Play, teamAbbreviation?: string): string {
  if (play.type === 'timeout') return teamAbbreviation ? `Timeout · ${teamAbbreviation}` : 'Timeout';
  return playLabel(play);
}

/** `"Q3 8:11"` is built in the component with `clock()`; this is the period part only. */
export const playPeriodLabel = (play: Pick<Play, 'period'>) => periodLabel(play.period);

type PlayerLookup = ReadonlyMap<string, PlayerRef>;

const mapCache = new WeakMap<readonly PlayerRef[], PlayerLookup>();

/** `playerRefs` array to id map, cached per array identity so hundreds of rows share one map. */
export function playerMap(refs: readonly PlayerRef[] | PlayerLookup): PlayerLookup {
  if (refs instanceof Map) return refs;
  const arr = refs as readonly PlayerRef[];
  let m = mapCache.get(arr);
  if (!m) {
    m = new Map(arr.map((p) => [p.id, p]));
    mapCache.set(arr, m);
  }
  return m;
}

/**
 * The secondary line under the relevant player: "Assisted by J. Smith", "Saved by G. Pipe", "Caused by T. Wood",
 * "Won over B. Lee", "Warding · 30 sec". Empty string when there is nothing to add.
 */
export function playDetail(play: Play, players: PlayerLookup): string {
  const name = (id: string | null) => {
    const p = id ? players.get(id) : undefined;
    return p ? playerShortName(p) : null;
  };
  switch (play.type) {
    case 'goal': {
      const a = name(play.assistPlayerId);
      const extra = play.details.extraMan === true ? ' · Extra-man' : '';
      return (a ? `Assisted by ${a}` : 'Unassisted') + extra;
    }
    case 'shot': {
      const g = name(play.goalieId);
      if (play.details.shotResult === 'saved' && g) return `Saved by ${g}`;
      return g ? `Goalie ${g}` : '';
    }
    case 'turnover': {
      const o = name(play.opponentPlayerId);
      return o ? `Caused by ${o}` : '';
    }
    case 'faceoff': {
      const o = name(play.opponentPlayerId);
      return o ? `Won over ${o}` : 'Won';
    }
    case 'penalty': {
      const bits: string[] = [];
      if (typeof play.details.penaltyName === 'string') bits.push(play.details.penaltyName);
      if (typeof play.details.penaltySeconds === 'number') bits.push(`${play.details.penaltySeconds} sec`);
      return bits.join(' · ');
    }
    case 'clear':
      return play.details.cleared === false ? 'Clear failed' : 'Cleared';
    default:
      return '';
  }
}

// ---------------------------------------------------------------------------
// Latest plays
// ---------------------------------------------------------------------------

const LATEST_NON_GOAL: ReadonlySet<Play['type']> = new Set(['shot', 'turnover', 'penalty']);

/**
 * Plays for the compact Gamecast card. Goals have priority: the newest goals (at most `max - 1`, so one more play of
 * context always fits when there are other plays) are picked first, then the newest shots, turnovers and penalties fill
 * the remaining slots. The result is ordered newest first.
 */
export function selectLatestPlays(plays: readonly Play[], max = 5): Play[] {
  const newest = [...plays].sort(byTime).reverse();
  const goals = newest.filter((p) => p.type === 'goal');
  const others = newest.filter((p) => LATEST_NON_GOAL.has(p.type));
  const goalSlots = others.length > 0 ? Math.min(goals.length, Math.max(1, max - 1)) : Math.min(goals.length, max);
  const picked = [...goals.slice(0, goalSlots), ...others.slice(0, max - goalSlots)];
  return picked.sort((a, b) => byTime(b, a));
}
