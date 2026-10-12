import type { GameDetail, Play } from '@pll/data/api';
import { periodLabel } from '../../lib/format';

export type FlowSide = 'away' | 'home';

/** The slice of the game the flow needs. A `GameDetail['data']` (or a `GameSummary`) fits. */
export interface FlowGame {
  status: GameDetail['data']['status'];
  clock?: { period: number } | null;
  home: { team: { id: string }; periodScores: readonly number[] };
  away: { team: { id: string }; periodScores: readonly number[] };
}

export interface GoalEvent {
  play: Play;
  side: FlowSide;
  period: number;
}

export interface QuarterFlow {
  period: number;
  /** `Q1`..`Q4`, `OT`, `2OT`. */
  label: string;
  /** Goals of each side in this period, in play order. */
  goals: Record<FlowSide, GoalEvent[]>;
  /** Goal counts (same as `goals[side].length`). */
  counts: Record<FlowSide, number>;
  /** The period is still being played (live game, current period). */
  inProgress: boolean;
}

/** Which side a team id belongs to, or `null` when it is neither team. */
function sideOf(game: FlowGame, teamId: string | null): FlowSide | null {
  if (teamId === null) return null;
  if (teamId === game.away.team.id) return 'away';
  if (teamId === game.home.team.id) return 'home';
  return null;
}

/** Goal plays of both teams in play order (`seq`). Plays of other types or of unknown teams are ignored. */
export function goalEvents(game: FlowGame, plays: readonly Play[]): GoalEvent[] {
  const events: GoalEvent[] = [];
  for (const play of plays) {
    if (play.type !== 'goal') continue;
    const side = sideOf(game, play.teamId);
    if (side) events.push({ play, side, period: play.period });
  }
  return events.sort((a, b) => a.play.seq - b.play.seq);
}

/** How many periods have started: the periods with scores, the live period, and any period that has plays. */
export function periodsStarted(game: FlowGame, plays: readonly Play[]): number {
  if (game.status !== 'live' && game.status !== 'final') return 0;
  const fromPlays = plays.reduce((max, p) => Math.max(max, p.period), 0);
  return Math.max(game.away.periodScores.length, game.home.periodScores.length, game.clock?.period ?? 0, fromPlays);
}

/** One entry per started period (Q1..Q4, then overtimes). Periods that have not started have no row. */
export function quarterFlows(game: FlowGame, plays: readonly Play[]): QuarterFlow[] {
  const total = periodsStarted(game, plays);
  const events = goalEvents(game, plays);
  const livePeriod = game.status === 'live' ? (game.clock?.period ?? null) : null;
  const rows: QuarterFlow[] = [];
  for (let period = 1; period <= total; period += 1) {
    const goals: Record<FlowSide, GoalEvent[]> = { away: [], home: [] };
    for (const e of events) if (e.period === period) goals[e.side].push(e);
    rows.push({
      period,
      label: periodLabel(period),
      goals,
      counts: { away: goals.away.length, home: goals.home.length },
      inProgress: livePeriod === period,
    });
  }
  return rows;
}

/** The most recent goal of the game, or `null` before the first one. */
export function latestGoal(game: FlowGame, plays: readonly Play[]): GoalEvent | null {
  const events = goalEvents(game, plays);
  return events[events.length - 1] ?? null;
}

/** The widest lane (most goals one team scored in one period), at least 1: segments are sized against it. */
export function maxGoalsInPeriod(rows: readonly QuarterFlow[]): number {
  return rows.reduce((max, r) => Math.max(max, r.counts.away, r.counts.home), 1);
}
