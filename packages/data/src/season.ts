/** Season-level derivations: records, season averages, previous results and conference standings. */
import type { ConferenceStandings, PreviousResult, SeasonAverages, TeamGameStats } from './api';
import { toTeamRef } from './refs';
import type { Conference, GameRecord, Record as WinLoss, Team } from './schema';

/** A completed game and its final score. */
export interface FinishedGame {
  game: GameRecord;
  homeScore: number;
  awayScore: number;
}

const involves = (g: FinishedGame, teamId: string) => g.game.home.teamId === teamId || g.game.away.teamId === teamId;

export function resultFor(g: FinishedGame, teamId: string): { teamScore: number; opponentScore: number; won: boolean } {
  const isHome = g.game.home.teamId === teamId;
  const teamScore = isHome ? g.homeScore : g.awayScore;
  const opponentScore = isHome ? g.awayScore : g.homeScore;
  return { teamScore, opponentScore, won: teamScore > opponentScore };
}

/** Win-loss record over finished games; `conferenceOnly` restricts to conference games. */
export function recordFor(teamId: string, finished: readonly FinishedGame[], conferenceOnly = false): WinLoss {
  let wins = 0;
  let losses = 0;
  for (const g of finished) {
    if (!involves(g, teamId) || (conferenceOnly && !g.game.isConferenceGame)) continue;
    if (resultFor(g, teamId).won) wins += 1;
    else losses += 1;
  }
  return { wins, losses };
}

/** Most recent first, strictly before `before` (ISO time). */
export function previousResults(
  team: Team,
  finished: readonly FinishedGame[],
  teamsById: ReadonlyMap<string, Team>,
  before: string,
  limit = 3,
): PreviousResult[] {
  const cutoff = Date.parse(before);
  return finished
    .filter((g) => involves(g, team.id) && Date.parse(g.game.startTime) < cutoff)
    .sort((a, b) => Date.parse(b.game.startTime) - Date.parse(a.game.startTime))
    .slice(0, limit)
    .flatMap((g) => {
      const isHome = g.game.home.teamId === team.id;
      const opponent = teamsById.get(isHome ? g.game.away.teamId : g.game.home.teamId);
      if (!opponent) return [];
      const { teamScore, opponentScore, won } = resultFor(g, team.id);
      return [
        {
          gameId: g.game.id,
          startTime: g.game.startTime,
          opponent: toTeamRef(opponent),
          isHome,
          teamScore,
          opponentScore,
          result: won ? ('W' as const) : ('L' as const),
        },
      ];
    });
}

const ratio = (n: number, d: number) => (d > 0 ? n / d : 0);
const round = (n: number, places = 2) => Math.round(n * 10 ** places) / 10 ** places;

/** Season averages from the team's box score in each finished game. */
export function seasonAverages(teamId: string, games: readonly TeamGameStats[]): SeasonAverages {
  const sum = (pick: (s: TeamGameStats) => number) => games.reduce((total, s) => total + pick(s), 0);
  const gp = games.length;
  return {
    teamId,
    gamesPlayed: gp,
    scoresPerGame: round(ratio(sum((s) => s.goals), gp)),
    shotsPerGame: round(ratio(sum((s) => s.shots), gp)),
    shootingPct: ratio(sum((s) => s.goals), sum((s) => s.shots)),
    turnoversPerGame: round(ratio(sum((s) => s.turnovers), gp)),
    faceoffPct: ratio(sum((s) => s.faceoffsWon), sum((s) => s.faceoffsTaken)),
    savePct: ratio(sum((s) => s.saves), sum((s) => s.saves + s.goalsAgainst)),
  };
}

const winPct = (r: WinLoss) => ratio(r.wins, r.wins + r.losses);

export function conferenceStandings(
  conference: Conference,
  teams: readonly Team[],
  finished: readonly FinishedGame[],
): ConferenceStandings {
  const rows = teams
    .filter((t) => t.conferenceId === conference.id)
    .map((t) => ({
      team: toTeamRef(t),
      rank: t.nationalRank,
      conferenceRecord: recordFor(t.id, finished, true),
      record: recordFor(t.id, finished),
    }))
    .sort(
      (a, b) =>
        winPct(b.conferenceRecord) - winPct(a.conferenceRecord) ||
        b.conferenceRecord.wins - a.conferenceRecord.wins ||
        winPct(b.record) - winPct(a.record) ||
        (a.rank ?? 99) - (b.rank ?? 99) ||
        a.team.school.localeCompare(b.team.school),
    );
  return { conferenceId: conference.id, name: conference.name, shortName: conference.shortName, rows };
}
