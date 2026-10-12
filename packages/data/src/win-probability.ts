/**
 * Win probability for the home team.
 *
 * Logistic model on the normal approximation of the remaining goal differential:
 *
 *   z = (margin + expectedDiff * tau) / (sigma * sqrt(tau + eps)),   p = 1 / (1 + exp(-1.702 z))
 *
 *  - margin = home - away goals
 *  - tau = fraction of regulation left (an OT period counts as tau = remaining / 3600)
 *  - expectedDiff = pregame expected goal differential implied by the pregame prior
 *  - sigma = per-game goal-differential standard deviation
 *
 * Monotone: increases with margin, with the prior, and (for the team that is ahead) as time runs out.
 * Always strictly inside (0, 1).
 */
import { elapsedOf, periodLength, REGULATION_SECONDS } from './clock';
import type { PlayRecord } from './schema';

export const GOAL_DIFF_SD = 4.8;
const SIGMA = GOAL_DIFF_SD;
const EPSILON = 0.003;
const LOGISTIC_SCALE = 1.702;
export const WIN_PROB_MIN = 0.0005;
export const WIN_PROB_MAX = 0.9995;

const clampProb = (p: number) => Math.min(WIN_PROB_MAX, Math.max(WIN_PROB_MIN, p));
const logit = (p: number) => Math.log(p / (1 - p));
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export interface WinProbabilityInput {
  /** home goals - away goals */
  margin: number;
  /** Seconds left in regulation, or in the current OT period. */
  secondsRemaining: number;
  /** Pregame home win probability. */
  prior: number;
  /** The game has ended (final whistle or sudden-victory goal). */
  over?: boolean;
}

export function winProbabilityHome({ margin, secondsRemaining, prior, over = false }: WinProbabilityInput): number {
  const safePrior = Math.min(0.995, Math.max(0.005, prior));
  if (over) {
    if (margin > 0) return WIN_PROB_MAX;
    if (margin < 0) return WIN_PROB_MIN;
    return clampProb(safePrior);
  }
  const tau = Math.max(0, secondsRemaining) / REGULATION_SECONDS;
  const expectedDiff = (SIGMA * logit(safePrior)) / LOGISTIC_SCALE;
  const z = (margin + expectedDiff * tau) / (SIGMA * Math.sqrt(tau + EPSILON));
  return clampProb(sigmoid(LOGISTIC_SCALE * z));
}

/** Seconds left in regulation, or in the current OT period. */
export function secondsRemainingAt(period: number, clockSeconds: number): number {
  return period <= 4 ? REGULATION_SECONDS - elapsedOf(period, clockSeconds) : clockSeconds;
}

export interface PlayWinProbability {
  seq: number;
  elapsedSeconds: number;
  homeScore: number;
  awayScore: number;
  winProbabilityHome: number;
}

/**
 * Win probability after every play, with the running score.
 * `complete` marks a log that reaches the final whistle, so its last play is a decided game.
 */
export function winProbabilityByPlay(
  plays: readonly PlayRecord[],
  homeId: string,
  prior: number,
  complete: boolean,
): PlayWinProbability[] {
  let home = 0;
  let away = 0;
  return plays.map((play, i) => {
    if (play.type === 'goal') {
      if (play.teamId === homeId) home += 1;
      else away += 1;
    }
    const isLast = i === plays.length - 1;
    const sudden = play.period > 4 && play.type === 'goal';
    const over = (complete && isLast) || sudden;
    const secondsRemaining =
      play.period <= 4 ? REGULATION_SECONDS - play.elapsedSeconds : Math.min(play.clockSeconds, periodLength(play.period));
    return {
      seq: play.seq,
      elapsedSeconds: play.elapsedSeconds,
      homeScore: home,
      awayScore: away,
      winProbabilityHome: winProbabilityHome({ margin: home - away, secondsRemaining, prior, over }),
    };
  });
}

/** Chart points: pregame value at t=0, then the last value at each game second. */
export function winProbabilityPoints(
  series: readonly PlayWinProbability[],
  prior: number,
): Array<{ elapsedSeconds: number; home: number }> {
  const points: Array<{ elapsedSeconds: number; home: number }> = [{ elapsedSeconds: 0, home: clampProb(prior) }];
  for (const entry of series) {
    const last = points[points.length - 1] as { elapsedSeconds: number; home: number };
    if (last.elapsedSeconds === entry.elapsedSeconds) last.home = entry.winProbabilityHome;
    else points.push({ elapsedSeconds: entry.elapsedSeconds, home: entry.winProbabilityHome });
  }
  return points;
}
