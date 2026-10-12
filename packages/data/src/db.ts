/**
 * The in-memory text-file database. Browser-safe: reading it from disk lives in scripts/load-db.ts.
 *
 * Files in db/: conferences, teams, players, games, plays/{gameId}, articles, videos, staff,
 * staff-picks, injuries, insights (editorial only), meta.
 */
import { z } from 'zod';
import {
  Article,
  Conference,
  GameRecord,
  Id,
  Injury,
  InsightRecord,
  IsoDateTime,
  Person,
  PlayRecord,
  Player,
  StaffPick,
  Team,
  Video,
} from './schema';

export const DbMeta = z.object({
  /** The "real" now of the dataset: live games are at `snapshotElapsedSeconds` at this moment. */
  snapshotTime: IsoDateTime,
  season: z.int(),
  currentWeek: z.int().min(1),
});
export type DbMeta = z.infer<typeof DbMeta>;

export const DbSchema = z.object({
  meta: DbMeta,
  conferences: z.array(Conference),
  teams: z.array(Team),
  players: z.array(Player),
  games: z.array(GameRecord),
  /** Play log per game id (complete for every game; the API reveals only what has happened). */
  plays: z.record(Id, z.array(PlayRecord)),
  articles: z.array(Article),
  videos: z.array(Video),
  staff: z.array(Person),
  staffPicks: z.array(StaffPick),
  injuries: z.array(Injury),
  insights: z.array(InsightRecord),
});
export type Db = z.infer<typeof DbSchema>;

export class DbValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(`Invalid DB (${issues.length} issue${issues.length === 1 ? '' : 's'}):\n- ${issues.slice(0, 25).join('\n- ')}`);
    this.name = 'DbValidationError';
  }
}

function uniqueIssues(label: string, ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const issues: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) issues.push(`duplicate ${label} id ${id}`);
    seen.add(id);
  }
  return issues;
}

/** Cross-reference checks the zod shapes cannot express. Returns human-readable issues. */
export function checkDbIntegrity(db: Db): string[] {
  const issues: string[] = [];
  const conferences = new Set(db.conferences.map((c) => c.id));
  const teams = new Map(db.teams.map((t) => [t.id, t]));
  const players = new Map(db.players.map((p) => [p.id, p]));
  const staff = new Set(db.staff.map((s) => s.id));
  const gameIds = new Set(db.games.map((g) => g.id));

  issues.push(...uniqueIssues('conference', db.conferences.map((c) => c.id)));
  issues.push(...uniqueIssues('team', db.teams.map((t) => t.id)));
  issues.push(...uniqueIssues('player', db.players.map((p) => p.id)));
  issues.push(...uniqueIssues('game', db.games.map((g) => g.id)));
  issues.push(...uniqueIssues('article', db.articles.map((a) => a.id)));
  issues.push(...uniqueIssues('video', db.videos.map((v) => v.id)));

  for (const t of db.teams) if (!conferences.has(t.conferenceId)) issues.push(`team ${t.id}: unknown conference ${t.conferenceId}`);

  const jerseys = new Set<string>();
  for (const p of db.players) {
    if (!teams.has(p.teamId)) issues.push(`player ${p.id}: unknown team ${p.teamId}`);
    const key = `${p.teamId}#${p.jerseyNumber}`;
    if (jerseys.has(key)) issues.push(`player ${p.id}: duplicate jersey ${p.jerseyNumber} on ${p.teamId}`);
    jerseys.add(key);
  }

  const articleIds = new Set(db.articles.map((a) => a.id));
  for (const g of db.games) {
    for (const side of [g.home, g.away]) if (!teams.has(side.teamId)) issues.push(`game ${g.id}: unknown team ${side.teamId}`);
    if (g.home.teamId === g.away.teamId) issues.push(`game ${g.id}: team plays itself`);
    if (g.previewArticleId && !articleIds.has(g.previewArticleId)) issues.push(`game ${g.id}: unknown preview article`);
    if (g.recapArticleId && !articleIds.has(g.recapArticleId)) issues.push(`game ${g.id}: unknown recap article`);
    if (g.status === 'live' && g.snapshotElapsedSeconds === null) issues.push(`game ${g.id}: live without snapshotElapsedSeconds`);
    if (!db.plays[g.id]) issues.push(`game ${g.id}: missing play log`);
  }
  for (const gameId of Object.keys(db.plays)) if (!gameIds.has(gameId)) issues.push(`plays for unknown game ${gameId}`);

  for (const g of db.games) issues.push(...checkPlayLog(g, db.plays[g.id] ?? [], players));

  for (const a of db.articles) {
    if (a.gameId && !gameIds.has(a.gameId)) issues.push(`article ${a.id}: unknown game`);
    if (!staff.has(a.authorId)) issues.push(`article ${a.id}: unknown author`);
  }
  for (const v of db.videos) if (v.gameId && !gameIds.has(v.gameId)) issues.push(`video ${v.id}: unknown game`);
  for (const pick of db.staffPicks) {
    if (!gameIds.has(pick.gameId)) issues.push(`staff pick: unknown game ${pick.gameId}`);
    if (!staff.has(pick.staffId)) issues.push(`staff pick: unknown staff ${pick.staffId}`);
    if (!teams.has(pick.pickTeamId)) issues.push(`staff pick: unknown team ${pick.pickTeamId}`);
  }
  for (const i of db.injuries) if (!players.has(i.playerId)) issues.push(`injury: unknown player ${i.playerId}`);
  for (const i of db.insights) if (!gameIds.has(i.gameId)) issues.push(`insight ${i.id}: unknown game`);
  return issues;
}

function checkPlayLog(game: GameRecord, plays: readonly PlayRecord[], players: ReadonlyMap<string, Player>): string[] {
  const issues: string[] = [];
  const sides = new Set([game.home.teamId, game.away.teamId]);
  let lastElapsed = -1;
  plays.forEach((p, i) => {
    if (p.seq !== i) issues.push(`game ${game.id}: play ${i} has seq ${p.seq}`);
    if (p.elapsedSeconds < lastElapsed) issues.push(`game ${game.id}: play ${p.seq} goes back in time`);
    lastElapsed = p.elapsedSeconds;
    if (p.teamId && !sides.has(p.teamId)) issues.push(`game ${game.id}: play ${p.seq} has a foreign team`);
    for (const id of [p.playerId, p.assistPlayerId, p.goalieId, p.opponentPlayerId]) {
      if (id && !players.has(id)) issues.push(`game ${game.id}: play ${p.seq} references unknown player ${id}`);
    }
  });
  const ids = plays.map((p) => p.id);
  issues.push(...uniqueIssues(`play (game ${game.id})`, ids));
  return issues;
}

/** Parse + cross-check an unknown value as a Db. Throws `DbValidationError` listing every issue. */
export function validateDb(input: unknown): Db {
  const parsed = DbSchema.safeParse(input);
  if (!parsed.success) {
    throw new DbValidationError(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
  }
  const issues = checkDbIntegrity(parsed.data);
  if (issues.length > 0) throw new DbValidationError(issues);
  return parsed.data;
}
