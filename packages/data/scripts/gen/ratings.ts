/** Running team state (record, goal difference), power ratings, poll/RPI ranking and pregame priors. */
import type { Record as WinLoss } from '../../src/schema';
import { GOAL_DIFF_SD } from '../../src/win-probability';
import type { TeamSeed } from './league';

export interface TeamState {
  seed: TeamSeed;
  wins: number;
  losses: number;
  confWins: number;
  confLosses: number;
  goalsFor: number;
  goalsAgainst: number;
  games: number;
  homeGames: number;
}

export function createStates(seeds: readonly TeamSeed[]): Map<string, TeamState> {
  return new Map(
    seeds.map((seed) => [
      seed.id,
      { seed, wins: 0, losses: 0, confWins: 0, confLosses: 0, goalsFor: 0, goalsAgainst: 0, games: 0, homeGames: 0 },
    ]),
  );
}

export const cloneStates = (states: ReadonlyMap<string, TeamState>): Map<string, TeamState> =>
  new Map([...states].map(([id, s]) => [id, { ...s }]));

export function applyResult(
  states: Map<string, TeamState>,
  homeId: string,
  awayId: string,
  homeScore: number,
  awayScore: number,
  conference: boolean,
): void {
  const home = states.get(homeId) as TeamState;
  const away = states.get(awayId) as TeamState;
  const record = (s: TeamState, won: boolean, gf: number, ga: number) => {
    s.games += 1;
    s.goalsFor += gf;
    s.goalsAgainst += ga;
    if (won) s.wins += 1;
    else s.losses += 1;
    if (conference) {
      if (won) s.confWins += 1;
      else s.confLosses += 1;
    }
  };
  record(home, homeScore > awayScore, homeScore, awayScore);
  record(away, awayScore > homeScore, awayScore, homeScore);
  home.homeGames += 1;
}

export const recordOf = (s: TeamState): WinLoss => ({ wins: s.wins, losses: s.losses });
export const conferenceRecordOf = (s: TeamState): WinLoss => ({ wins: s.confWins, losses: s.confLosses });

const goalDiffPerGame = (s: TeamState) => (s.games > 0 ? (s.goalsFor - s.goalsAgainst) / s.games : 0);

/** Poll-style score: preseason strength fades into results. */
const pollScore = (s: TeamState) => s.seed.strength * 0.7 + (s.wins - s.losses) * 0.9 + goalDiffPerGame(s) * 0.35;

/** Expected goal margin vs an average team (drives pregame priors). */
const rating = (s: TeamState) => s.seed.strength * 0.75 + goalDiffPerGame(s) * 0.25 * Math.min(1, s.games / 4);

export interface Ranking {
  rank: number | null;
  rpi: number;
}

const POLL_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 13, 15, 17];
const RPI_SLOTS = [1, 2, 4, 5, 8, 9, 12, 15, 18, 22, 27, 33, 38, 47, 55, 64];

/** Top 13 of the 16 teams are ranked (slots skip numbers held by programs outside this league). */
export function rankTeams(states: ReadonlyMap<string, TeamState>): Map<string, Ranking> {
  const ordered = [...states.values()].sort((a, b) => pollScore(b) - pollScore(a) || a.seed.id.localeCompare(b.seed.id));
  return new Map(
    ordered.map((s, i) => [s.seed.id, { rank: POLL_SLOTS[i] ?? null, rpi: RPI_SLOTS[i] ?? 70 + i }]),
  );
}

/** Pregame home win probability from current ratings. */
export function pregameHomeProbability(home: TeamState, away: TeamState, neutralSite: boolean): number {
  const homeEdge = neutralSite ? 0 : 0.5;
  const margin = rating(home) - rating(away) + homeEdge;
  const p = 1 / (1 + Math.exp(-(1.702 * margin) / GOAL_DIFF_SD));
  return Math.round(Math.min(0.96, Math.max(0.04, p)) * 1000) / 1000;
}
