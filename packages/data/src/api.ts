/**
 * API contract — what the prototype (apps/web) fetches.
 *
 * Every endpoint returns `{ data, meta }`. `meta.serverTime` is the authoritative "now":
 * the client must use it (not the device clock) for countdowns, "x min ago" and live state,
 * which is what lets the Scenario Lab time-travel without the app knowing.
 *
 * Endpoints (relative to API_BASE, e.g. `/api/v1`):
 *   GET /scoreboard                 -> ScoreboardResponse   (Other Games Bar)
 *   GET /games/{id}                 -> GameDetail            (Header Bar, venue, broadcasts, win prob)
 *   GET /games/{id}/stats           -> GameStats             (box score, key team stats, top performers)
 *   GET /games/{id}/plays           -> GamePlays             (play-by-play, latest scores)
 *   GET /games/{id}/win-probability -> WinProbabilitySeries  (line chart)
 *   GET /games/{id}/insights        -> GameInsights          (live insights)
 *   GET /games/{id}/preview         -> GamePreview           (pregame modules)
 *   GET /games/{id}/media           -> GameMedia             (videos + articles)
 */
import { z } from 'zod';
import {
  Article,
  Broadcast,
  ClassYear,
  Count,
  Fraction,
  GameStatus,
  GameType,
  Id,
  Injury,
  InsightKind,
  IsoDateTime,
  LivePhase,
  Person,
  PlayType,
  Player,
  Position,
  Record,
  Team,
  Venue,
  Video,
  Weather,
} from './schema';

export const Meta = z.object({ serverTime: IsoDateTime });
export type Meta = z.infer<typeof Meta>;

export const envelope = <T extends z.ZodType>(data: T) => z.object({ data, meta: Meta });

// ---------------------------------------------------------------------------
// Shared refs (denormalized for the UI)
// ---------------------------------------------------------------------------

export const TeamRef = Team.pick({
  id: true,
  slug: true,
  school: true,
  mascot: true,
  abbreviation: true,
  colors: true,
  logoUrl: true,
});
export type TeamRef = z.infer<typeof TeamRef>;

export const PlayerRef = Player.pick({
  id: true,
  teamId: true,
  firstName: true,
  lastName: true,
  jerseyNumber: true,
  position: true,
  classYear: true,
  photoUrl: true,
});
export type PlayerRef = z.infer<typeof PlayerRef>;

export const LiveClock = z.object({
  period: z.int().min(1),
  clockSeconds: Count,
  phase: LivePhase,
});
export type LiveClock = z.infer<typeof LiveClock>;

export const GameSide = z.object({
  team: TeamRef,
  score: Count.nullable(), // null before the game
  periodScores: z.array(Count), // only started periods
  record: Record, // current record (updates after final)
  conferenceShortName: z.string(),
  rank: z.int().min(1).max(20).nullable(),
  rpi: z.int().min(1).nullable(),
  /** Post-game poll/RPI movement; null until published. Positive = moved up. */
  rankChange: z.int().nullable(),
  rpiChange: z.int().nullable(),
  seed: z.int().min(1).nullable(),
});
export type GameSide = z.infer<typeof GameSide>;

export const GameSummary = z.object({
  id: Id,
  startTime: IsoDateTime,
  status: GameStatus,
  clock: LiveClock.nullable(), // set while live
  home: GameSide,
  away: GameSide,
  broadcasts: z.array(Broadcast),
});
export type GameSummary = z.infer<typeof GameSummary>;

// ---------------------------------------------------------------------------
// Endpoint payloads
// ---------------------------------------------------------------------------

export const ScoreboardResponse = envelope(
  z.object({ season: z.int(), week: z.int(), games: z.array(GameSummary) }),
);
export type ScoreboardResponse = z.infer<typeof ScoreboardResponse>;

export const GameDetail = envelope(
  GameSummary.extend({
    season: z.int(),
    week: z.int(),
    gameType: GameType,
    label: z.string().nullable(),
    neutralSite: z.boolean(),
    attendance: Count.nullable(),
    headCoaches: z.object({ home: z.string().nullable(), away: z.string().nullable() }),
    venue: Venue,
    weather: Weather.nullable(),
    isConferenceGame: z.boolean(),
    stakes: z.string().nullable(),
    /** Current win probability for the home team (pregame value before kickoff). */
    winProbabilityHome: Fraction.nullable(),
    lastPlayAt: IsoDateTime.nullable(),
  }),
);
export type GameDetail = z.infer<typeof GameDetail>;

export const TeamGameStats = z.object({
  teamId: Id,
  goals: Count,
  assists: Count,
  shots: Count,
  shotsOnGoal: Count,
  shotPct: Fraction,
  groundBalls: Count,
  turnovers: Count,
  causedTurnovers: Count,
  faceoffsWon: Count,
  faceoffsTaken: Count,
  faceoffPct: Fraction,
  saves: Count,
  goalsAgainst: Count,
  savePct: Fraction,
  clears: Count,
  clearAttempts: Count,
  clearPct: Fraction,
  extraManGoals: Count,
  extraManOpportunities: Count,
  penalties: Count,
  penaltySeconds: Count,
});
export type TeamGameStats = z.infer<typeof TeamGameStats>;

export const PlayerGameStats = z.object({
  playerId: Id,
  teamId: Id,
  goals: Count,
  assists: Count,
  points: Count,
  shots: Count,
  shotsOnGoal: Count,
  groundBalls: Count,
  turnovers: Count,
  causedTurnovers: Count,
  faceoffsWon: Count,
  faceoffsTaken: Count,
  saves: Count,
  goalsAgainst: Count,
  penalties: Count,
  penaltySeconds: Count,
});
export type PlayerGameStats = z.infer<typeof PlayerGameStats>;

export const GameStats = envelope(
  z.object({
    teams: z.array(TeamGameStats).length(2),
    players: z.array(PlayerGameStats),
    playerRefs: z.array(PlayerRef),
  }),
);
export type GameStats = z.infer<typeof GameStats>;

export const Play = z.object({
  id: Id,
  seq: Count,
  period: z.int().min(1),
  clockSeconds: Count,
  elapsedSeconds: Count,
  type: PlayType,
  teamId: Id.nullable(),
  playerId: Id.nullable(),
  assistPlayerId: Id.nullable(),
  goalieId: Id.nullable(),
  opponentPlayerId: Id.nullable(),
  description: z.string(), // server-rendered, e.g. "GOAL by B. Dowd (Duke), assisted by A. Smith"
  homeScore: Count,
  awayScore: Count,
  winProbabilityHome: Fraction.nullable(),
  details: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});
export type Play = z.infer<typeof Play>;

export const GamePlays = envelope(z.object({ plays: z.array(Play), playerRefs: z.array(PlayerRef) }));
export type GamePlays = z.infer<typeof GamePlays>;

export const WinProbabilityPoint = z.object({ elapsedSeconds: Count, home: Fraction });
export const WinProbabilitySeries = envelope(
  z.object({ regulationSeconds: Count, points: z.array(WinProbabilityPoint) }),
);
export type WinProbabilitySeries = z.infer<typeof WinProbabilitySeries>;

export const Insight = z.object({
  id: Id,
  elapsedSeconds: Count,
  period: z.int().min(1),
  clockSeconds: Count,
  kind: InsightKind,
  title: z.string(),
  body: z.string(),
  teamId: Id.nullable(),
  playerId: Id.nullable(),
});
export type Insight = z.infer<typeof Insight>;

export const GameInsights = envelope(z.object({ insights: z.array(Insight) }));
export type GameInsights = z.infer<typeof GameInsights>;

export const RosterPlayer = PlayerRef.extend({ season: Player.shape.season });
export type RosterPlayer = z.infer<typeof RosterPlayer>;

export const SeasonAverages = z.object({
  teamId: Id,
  gamesPlayed: Count,
  scoresPerGame: z.number(),
  shotsPerGame: z.number(),
  shootingPct: Fraction,
  turnoversPerGame: z.number(),
  faceoffPct: Fraction,
  savePct: Fraction,
});
export type SeasonAverages = z.infer<typeof SeasonAverages>;

export const PreviousResult = z.object({
  gameId: Id,
  startTime: IsoDateTime,
  opponent: TeamRef,
  isHome: z.boolean(),
  teamScore: Count,
  opponentScore: Count,
  result: z.enum(['W', 'L']),
});
export type PreviousResult = z.infer<typeof PreviousResult>;

export const StandingsRow = z.object({
  team: TeamRef,
  rank: z.int().min(1).max(20).nullable(),
  conferenceRecord: Record,
  record: Record,
});
export const ConferenceStandings = z.object({
  conferenceId: Id,
  name: z.string(),
  shortName: z.string(),
  rows: z.array(StandingsRow),
});
export type ConferenceStandings = z.infer<typeof ConferenceStandings>;

export const GamePreview = envelope(
  z.object({
    rosters: z.object({ home: z.array(RosterPlayer), away: z.array(RosterPlayer) }),
    injuries: z.array(Injury.extend({ player: PlayerRef })),
    seasonAverages: z.object({ home: SeasonAverages, away: SeasonAverages }),
    previousResults: z.object({ home: z.array(PreviousResult), away: z.array(PreviousResult) }),
    standings: z.array(ConferenceStandings), // 1 table if same conference, else 2
    staffPicks: z.array(z.object({ staff: Person, pickTeamId: Id })),
  }),
);
export type GamePreview = z.infer<typeof GamePreview>;

export const GameMedia = envelope(
  z.object({
    videos: z.array(Video),
    articles: z.array(Article.extend({ author: Person })),
  }),
);
export type GameMedia = z.infer<typeof GameMedia>;

/** Re-exported so consumers can import everything from '@pll/data/api'. */
export { ClassYear, Position, GameStatus, GameType, PlayType, LivePhase, InsightKind };
