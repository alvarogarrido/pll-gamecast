/**
 * Score + box score derivation. Everything here is a pure function of a play log (already truncated to
 * the cutoff by the caller), so a live game at any moment gets consistent scores and stats.
 */
import { clockAtElapsed } from './clock';
import type { LiveClock, PlayerGameStats, TeamGameStats } from './api';
import type { PlayRecord } from './schema';

export interface ScoreState {
  home: number;
  away: number;
  /** Goals per started period. */
  periodScores: { home: number[]; away: number[] };
}

export function scoreFromPlays(plays: readonly PlayRecord[], homeId: string): ScoreState {
  const periods = plays.reduce((max, p) => Math.max(max, p.period), 0);
  const home = new Array<number>(periods).fill(0);
  const away = new Array<number>(periods).fill(0);
  for (const p of plays) {
    if (p.type !== 'goal') continue;
    (p.teamId === homeId ? home : away)[p.period - 1]! += 1;
  }
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  return { home: sum(home), away: sum(away), periodScores: { home, away } };
}

/** Plays visible at `cutoff` elapsed seconds (null = the whole log). Boundary plays of a not-yet-started period stay hidden. */
export function playsUpTo<T extends Pick<PlayRecord, 'period' | 'elapsedSeconds'>>(plays: readonly T[], cutoff: number | null): T[] {
  if (cutoff === null) return [...plays];
  const clock = clockAtElapsed(cutoff);
  return plays.filter((p) => p.period < clock.period || (p.period === clock.period && p.elapsedSeconds <= cutoff));
}

export function liveClock(cutoff: number): LiveClock {
  return clockAtElapsed(cutoff);
}

// ---------------------------------------------------------------------------
// Box score
// ---------------------------------------------------------------------------

const ratio = (n: number, d: number) => (d > 0 ? n / d : 0);

export function emptyTeamStats(teamId: string): TeamGameStats {
  return {
    teamId,
    goals: 0,
    assists: 0,
    shots: 0,
    shotsOnGoal: 0,
    shotPct: 0,
    groundBalls: 0,
    turnovers: 0,
    causedTurnovers: 0,
    faceoffsWon: 0,
    faceoffsTaken: 0,
    faceoffPct: 0,
    saves: 0,
    goalsAgainst: 0,
    savePct: 0,
    clears: 0,
    clearAttempts: 0,
    clearPct: 0,
    extraManGoals: 0,
    extraManOpportunities: 0,
    penalties: 0,
    penaltySeconds: 0,
  };
}

function emptyPlayerStats(playerId: string, teamId: string): PlayerGameStats {
  return {
    playerId,
    teamId,
    goals: 0,
    assists: 0,
    points: 0,
    shots: 0,
    shotsOnGoal: 0,
    groundBalls: 0,
    turnovers: 0,
    causedTurnovers: 0,
    faceoffsWon: 0,
    faceoffsTaken: 0,
    saves: 0,
    goalsAgainst: 0,
    penalties: 0,
    penaltySeconds: 0,
  };
}

export interface BoxScore {
  /** [home, away] */
  teams: [TeamGameStats, TeamGameStats];
  /** Every player who appears in the log, home first, then by points/goals. */
  players: PlayerGameStats[];
}

/**
 * Team and player stats from a play log.
 *
 * Conventions: a player "appears" when named in any play (shooter, assister, goalie, opponent of a
 * turnover/faceoff). Extra-man opportunities = penalties drawn (the opponent's penalties).
 */
export function computeBoxScore(plays: readonly PlayRecord[], homeId: string, awayId: string): BoxScore {
  const teams = new Map<string, TeamGameStats>([
    [homeId, emptyTeamStats(homeId)],
    [awayId, emptyTeamStats(awayId)],
  ]);
  const players = new Map<string, PlayerGameStats>();
  const opponentOf = (teamId: string) => (teamId === homeId ? awayId : homeId);
  const team = (id: string) => teams.get(id) as TeamGameStats;
  const player = (id: string | null, teamId: string): PlayerGameStats | null => {
    if (!id) return null;
    let row = players.get(id);
    if (!row) {
      row = emptyPlayerStats(id, teamId);
      players.set(id, row);
    }
    return row;
  };

  for (const p of plays) {
    if (!p.teamId) continue;
    const t = team(p.teamId);
    const oppId = opponentOf(p.teamId);
    const opp = team(oppId);
    const actor = player(p.playerId, p.teamId);

    switch (p.type) {
      case 'goal': {
        t.goals += 1;
        t.shots += 1;
        t.shotsOnGoal += 1;
        if (p.details.extraMan) t.extraManGoals += 1;
        opp.goalsAgainst += 1;
        if (actor) {
          actor.goals += 1;
          actor.shots += 1;
          actor.shotsOnGoal += 1;
        }
        const assister = player(p.assistPlayerId, p.teamId);
        if (assister) {
          assister.assists += 1;
          t.assists += 1;
        }
        const goalie = player(p.goalieId, oppId);
        if (goalie) goalie.goalsAgainst += 1;
        break;
      }
      case 'shot': {
        t.shots += 1;
        if (actor) actor.shots += 1;
        const goalie = player(p.goalieId, oppId);
        if (p.details.shotResult === 'saved') {
          t.shotsOnGoal += 1;
          opp.saves += 1;
          if (actor) actor.shotsOnGoal += 1;
          if (goalie) goalie.saves += 1;
        }
        break;
      }
      case 'ground_ball':
        t.groundBalls += 1;
        if (actor) actor.groundBalls += 1;
        break;
      case 'turnover': {
        t.turnovers += 1;
        if (actor) actor.turnovers += 1;
        if (p.details.causedTurnover) {
          opp.causedTurnovers += 1;
          const causer = player(p.opponentPlayerId, oppId);
          if (causer) causer.causedTurnovers += 1;
        }
        break;
      }
      case 'clear':
        t.clearAttempts += 1;
        if (p.details.cleared !== false) t.clears += 1;
        player(p.playerId, p.teamId);
        break;
      case 'faceoff': {
        t.faceoffsWon += 1;
        t.faceoffsTaken += 1;
        opp.faceoffsTaken += 1;
        if (actor) {
          actor.faceoffsWon += 1;
          actor.faceoffsTaken += 1;
        }
        const loser = player(p.opponentPlayerId, oppId);
        if (loser) loser.faceoffsTaken += 1;
        break;
      }
      case 'penalty': {
        const seconds = p.details.penaltySeconds ?? 0;
        t.penalties += 1;
        t.penaltySeconds += seconds;
        opp.extraManOpportunities += 1;
        if (actor) {
          actor.penalties += 1;
          actor.penaltySeconds += seconds;
        }
        break;
      }
      default:
        break;
    }
  }

  for (const t of teams.values()) {
    t.shotPct = ratio(t.goals, t.shots);
    t.faceoffPct = ratio(t.faceoffsWon, t.faceoffsTaken);
    t.savePct = ratio(t.saves, t.saves + t.goalsAgainst);
    t.clearPct = ratio(t.clears, t.clearAttempts);
  }
  for (const row of players.values()) row.points = row.goals + row.assists;

  const teamIndex = (id: string) => (id === homeId ? 0 : 1);
  const sorted = [...players.values()].sort(
    (a, b) =>
      teamIndex(a.teamId) - teamIndex(b.teamId) ||
      b.points - a.points ||
      b.goals - a.goals ||
      a.playerId.localeCompare(b.playerId),
  );
  return { teams: [team(homeId), team(awayId)], players: sorted };
}
