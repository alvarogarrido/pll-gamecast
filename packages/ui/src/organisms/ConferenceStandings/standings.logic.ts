import type { ConferenceStandings, GameDetail } from '@pll/data/api';

export type StandingsRowData = ConferenceStandings['rows'][number];
type Game = Pick<GameDetail['data'], 'home' | 'away'>;

const winPct = (r: { wins: number; losses: number }): number => {
  const games = r.wins + r.losses;
  return games === 0 ? 0 : r.wins / games;
};

/** Conference win % desc, then overall win % desc, then school name. Does not mutate. Rows stay stable otherwise. */
export function sortStandings(rows: readonly StandingsRowData[]): StandingsRowData[] {
  return [...rows].sort(
    (a, b) =>
      winPct(b.conferenceRecord) - winPct(a.conferenceRecord) ||
      b.conferenceRecord.wins - a.conferenceRecord.wins ||
      winPct(b.record) - winPct(a.record) ||
      a.team.school.localeCompare(b.team.school),
  );
}

/** True when the row is one of the two teams playing. */
export const isGameTeam = (row: StandingsRowData, game: Game): boolean =>
  row.team.id === game.away.team.id || row.team.id === game.home.team.id;

export interface StandingsView {
  /** One entry when both teams share a conference (no selector needed), otherwise one per conference. */
  tables: ConferenceStandings[];
  /** Conference to show first: the away team's, then the home team's, then the first available. */
  defaultConferenceId: string | null;
}

/** Picks the tables to show. Conferences that contain neither team are kept (the API only sends relevant ones). */
export function standingsView(standings: readonly ConferenceStandings[], game: Game): StandingsView {
  const withRows = standings.filter((s) => s.rows.length > 0);
  const containing = (teamId: string) => withRows.find((s) => s.rows.some((r) => r.team.id === teamId));
  const defaultConference = containing(game.away.team.id) ?? containing(game.home.team.id) ?? withRows[0];
  return { tables: withRows, defaultConferenceId: defaultConference?.conferenceId ?? null };
}
