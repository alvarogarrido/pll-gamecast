/**
 * Domain schemas — the single source of truth for the Gamecast data contract.
 *
 * Two layers live here:
 *  1. "DB" records: what the text-file database in `db/` stores (normalized, raw counts).
 *  2. API responses (see `api.ts`): what the prototype fetches (denormalized, with derived values).
 *
 * Percentages are always fractions 0..1. Clock values are integer seconds.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export const Id = z.string().min(1);
export const IsoDateTime = z.iso.datetime({ offset: true });
export const Fraction = z.number().min(0).max(1);
export const Count = z.int().min(0);
export const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const ClassYear = z.enum(['Fr', 'So', 'Jr', 'Sr', 'Gr']);
export type ClassYear = z.infer<typeof ClassYear>;

/** A = attack, M = midfield, D = close defense, LSM, SSDM, FO = faceoff specialist, G = goalie. */
export const Position = z.enum(['A', 'M', 'D', 'LSM', 'SSDM', 'FO', 'G']);
export type Position = z.infer<typeof Position>;

export const Record = z.object({ wins: Count, losses: Count });
export type Record = z.infer<typeof Record>;

// ---------------------------------------------------------------------------
// Conferences & teams
// ---------------------------------------------------------------------------

export const Conference = z.object({
  id: Id,
  name: z.string(), // "Atlantic Coast Conference"
  shortName: z.string(), // "ACC"
});
export type Conference = z.infer<typeof Conference>;

export const Team = z.object({
  id: Id,
  slug: z.string(),
  school: z.string(), // "Duke"
  mascot: z.string(), // "Blue Devils"
  abbreviation: z.string().max(5), // "DUKE"
  conferenceId: Id,
  colors: z.object({ primary: HexColor, secondary: HexColor }),
  logoUrl: z.string(),
  record: Record,
  conferenceRecord: Record,
  /** Current national poll rank (1–20) or null when unranked. */
  nationalRank: z.int().min(1).max(20).nullable(),
  rpi: z.int().min(1).nullable(),
  headCoach: z.string().nullable(),
});
export type Team = z.infer<typeof Team>;

/** Season totals; per-game rates and percentages are derived (see derive.ts). */
export const TeamSeasonTotals = z.object({
  teamId: Id,
  gamesPlayed: Count,
  goals: Count,
  goalsAgainst: Count,
  shots: Count,
  turnovers: Count,
  faceoffsWon: Count,
  faceoffsTaken: Count,
  saves: Count,
  shotsOnGoalFaced: Count,
});
export type TeamSeasonTotals = z.infer<typeof TeamSeasonTotals>;

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

export const PlayerSeasonTotals = z.object({
  gamesPlayed: Count,
  goals: Count,
  assists: Count,
  shots: Count,
  shotsOnGoal: Count,
  groundBalls: Count,
  turnovers: Count,
  causedTurnovers: Count,
  faceoffsWon: Count,
  faceoffsTaken: Count,
  saves: Count,
  goalsAgainst: Count,
});
export type PlayerSeasonTotals = z.infer<typeof PlayerSeasonTotals>;

export const Player = z.object({
  id: Id,
  teamId: Id,
  firstName: z.string(),
  lastName: z.string(),
  jerseyNumber: z.int().min(0).max(99),
  position: Position,
  classYear: ClassYear,
  photoUrl: z.string().nullable(),
  hometown: z.string().nullable(),
  season: PlayerSeasonTotals,
});
export type Player = z.infer<typeof Player>;

export const Injury = z.object({
  playerId: Id,
  status: z.enum(['out', 'doubtful', 'questionable', 'day_to_day']),
  description: z.string(), // "Lower body"
  updatedAt: IsoDateTime,
});
export type Injury = z.infer<typeof Injury>;

// ---------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------

export const GameType = z.enum(['regular', 'conference_tournament', 'ncaa_tournament']);
export type GameType = z.infer<typeof GameType>;

export const GameStatus = z.enum(['scheduled', 'live', 'final', 'delayed', 'postponed', 'canceled']);
export type GameStatus = z.infer<typeof GameStatus>;

/** Only meaningful while live. `break` = between quarters, `halftime` after Q2. */
export const LivePhase = z.enum(['in_progress', 'break', 'halftime']);
export type LivePhase = z.infer<typeof LivePhase>;

export const Weather = z.object({
  temperatureF: z.int(),
  condition: z.enum(['clear', 'partly_cloudy', 'cloudy', 'rain', 'snow', 'wind', 'indoor']),
  precipitationChance: Fraction.nullable(),
});
export type Weather = z.infer<typeof Weather>;

export const Venue = z.object({
  name: z.string(),
  city: z.string(),
  state: z.string(),
});
export type Venue = z.infer<typeof Venue>;

export const Broadcast = z.object({ network: z.string(), url: z.string().nullable() });
export type Broadcast = z.infer<typeof Broadcast>;

/** One side of a game as stored in the DB (scores are derived from plays). */
export const GameSideRecord = z.object({
  teamId: Id,
  rankBefore: z.int().min(1).max(20).nullable(),
  rpiBefore: z.int().min(1).nullable(),
  recordBefore: Record,
  /** Filled after the game when the poll/RPI updates. */
  rankAfter: z.int().min(1).max(20).nullable(),
  rpiAfter: z.int().min(1).nullable(),
  /** Tournament seed (conference or NCAA tournament games only). */
  seed: z.int().min(1).nullable(),
});
export type GameSideRecord = z.infer<typeof GameSideRecord>;

export const GameRecord = z.object({
  id: Id, // uuid, like insidelacrosse.com/ncaa/game/{uuid}
  season: z.int(),
  week: z.int().min(0),
  startTime: IsoDateTime,
  gameType: GameType,
  /** Event label shown above the matchup, e.g. "NCAA Championship", "ACC Semifinal". */
  label: z.string().nullable(),
  neutralSite: z.boolean(),
  attendance: Count.nullable(),
  /** Status as of the DB snapshot. Live games carry their plays up to `snapshotElapsedSeconds`. */
  status: GameStatus,
  snapshotElapsedSeconds: Count.nullable(),
  home: GameSideRecord,
  away: GameSideRecord,
  venue: Venue,
  weather: Weather.nullable(),
  broadcasts: z.array(Broadcast),
  isConferenceGame: z.boolean(),
  stakes: z.string().nullable(),
  pregameWinProbabilityHome: Fraction.nullable(),
  previewArticleId: Id.nullable(),
  recapArticleId: Id.nullable(),
});
export type GameRecord = z.infer<typeof GameRecord>;

// ---------------------------------------------------------------------------
// Play-by-play (the event log every stat is derived from)
// ---------------------------------------------------------------------------

export const PlayType = z.enum([
  'period_start',
  'period_end',
  'faceoff',
  'goal',
  'shot', // non-goal shot; see details.shotResult
  'ground_ball',
  'turnover',
  'clear',
  'penalty',
  'timeout',
]);
export type PlayType = z.infer<typeof PlayType>;

export const PlayRecord = z.object({
  id: Id,
  seq: Count,
  period: z.int().min(1), // 1–4 regulation, 5+ = OT
  /** Seconds remaining in the period on the game clock. */
  clockSeconds: Count,
  /** Seconds since opening faceoff across all periods (drives charts + live simulation). */
  elapsedSeconds: Count,
  type: PlayType,
  teamId: Id.nullable(),
  /** Shooter, faceoff winner, ground-ball winner, player committing turnover/penalty. */
  playerId: Id.nullable(),
  assistPlayerId: Id.nullable(),
  /** Defending goalie on shots/goals. */
  goalieId: Id.nullable(),
  /** Opponent who caused a turnover or lost a faceoff. */
  opponentPlayerId: Id.nullable(),
  details: z
    .object({
      shotResult: z.enum(['goal', 'saved', 'wide', 'pipe', 'blocked']).optional(),
      extraMan: z.boolean().optional(),
      emptyNet: z.boolean().optional(),
      cleared: z.boolean().optional(),
      penaltyName: z.string().optional(),
      penaltySeconds: Count.optional(),
      causedTurnover: z.boolean().optional(),
    })
    .default({}),
});
export type PlayRecord = z.infer<typeof PlayRecord>;

// ---------------------------------------------------------------------------
// Editorial & media
// ---------------------------------------------------------------------------

export const Person = z.object({ id: Id, name: z.string(), photoUrl: z.string().nullable(), title: z.string().nullable() });
export type Person = z.infer<typeof Person>;

export const Article = z.object({
  id: Id,
  gameId: Id.nullable(),
  kind: z.enum(['preview', 'recap', 'news']),
  title: z.string(),
  keySentence: z.string(),
  excerpt: z.string(),
  authorId: Id,
  imageUrl: z.string().nullable(),
  url: z.string(),
  publishedAt: IsoDateTime,
});
export type Article = z.infer<typeof Article>;

export const Video = z.object({
  id: Id,
  gameId: Id.nullable(),
  kind: z.enum(['preview', 'highlight', 'postgame', 'other']),
  title: z.string(),
  thumbnailUrl: z.string(),
  src: z.string(), // mp4/HLS url
  durationSeconds: Count,
  publishedAt: IsoDateTime,
});
export type Video = z.infer<typeof Video>;

export const StaffPick = z.object({ gameId: Id, staffId: Id, pickTeamId: Id });
export type StaffPick = z.infer<typeof StaffPick>;

/** Editorial live insight. Generated insights (streaks, lead changes) come from derive.ts. */
export const InsightKind = z.enum(['milestone', 'streak', 'drought', 'lead_change', 'run', 'record', 'note']);
export type InsightKind = z.infer<typeof InsightKind>;

export const InsightRecord = z.object({
  id: Id,
  gameId: Id,
  elapsedSeconds: Count,
  kind: InsightKind,
  title: z.string(),
  body: z.string(),
  teamId: Id.nullable(),
  playerId: Id.nullable(),
});
export type InsightRecord = z.infer<typeof InsightRecord>;
