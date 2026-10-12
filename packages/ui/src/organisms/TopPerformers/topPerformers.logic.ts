/**
 * Pure selection + formatting logic for "Top Performers" (live/post, game stats) and "Players to Watch" (pre, season
 * stats). Both modules share the selectors: a `Tally` is the counting stats of either one game or one season.
 */
import type { GameDetail, GamePreview, GameStats, PlayerRef } from '@pll/data/api';
import { formatStat, pct, perGame } from '../../lib/format';

export type Side = 'away' | 'home';
export type PerformerCategory = 'scoring' | 'goalie' | 'faceoff';

/** Counting stats both `PlayerGameStats` and `PlayerSeasonTotals` satisfy. `points` is optional (season has none). */
export interface Tally {
  goals: number;
  assists: number;
  points?: number;
  /** Season tallies only: games played, the denominator of the per-game rates. */
  gamesPlayed?: number;
  shots: number;
  turnovers?: number;
  saves: number;
  goalsAgainst: number;
  faceoffsWon: number;
  faceoffsTaken: number;
}

export interface Candidate<T extends Tally = Tally> {
  player: PlayerRef;
  tally: T;
}

/** A formatted stat: big number plus its label ("6", "Goals"). */
export interface PerformerStat {
  value: string;
  label: string;
}

export interface Performer {
  player: PlayerRef;
  /** Team primary color for the avatar ring. */
  teamColor: string;
  primary: PerformerStat;
  /** Small supporting stats, already formatted: `["3/7 SH", "2 A", "5 PTS"]`. */
  secondary: string[];
}

export interface PerformerSection {
  category: PerformerCategory;
  /** Chip text in the middle. */
  title: string;
  /** Shown on a side with no qualifying player. */
  emptyLabel: string;
  away: Performer | null;
  home: Performer | null;
}

/** `n / d`, or `null` when the denominator is zero (so formatters print an en dash, never `NaN%`). */
export function ratio(n: number, d: number): number | null {
  return d > 0 ? n / d : null;
}

export const pointsOf = (t: Tally): number => t.points ?? t.goals + t.assists;

function best<C>(items: readonly C[], compare: (a: C, b: C) => number): C | null {
  let top: C | null = null;
  for (const item of items) if (top === null || compare(item, top) < 0) top = item;
  return top;
}

// Stable last-resort order so a full tie is deterministic: lower jersey number, then id.
const byIdentity = (a: Candidate, b: Candidate) =>
  a.player.jerseyNumber - b.player.jerseyNumber || a.player.id.localeCompare(b.player.id);

/**
 * Top scorer: most points, tie-break most goals, then FEWER shots (more efficient). Needs at least one point;
 * `null` when nobody has scored or assisted.
 */
export function selectTopScorer<C extends Candidate>(candidates: readonly C[]): C | null {
  return best(
    candidates.filter((c) => pointsOf(c.tally) > 0),
    (a, b) =>
      pointsOf(b.tally) - pointsOf(a.tally) ||
      b.tally.goals - a.tally.goals ||
      a.tally.shots - b.tally.shots ||
      byIdentity(a, b),
  );
}

/** Games a player needs to qualify as a Players to Watch top scorer (D9). */
export const MIN_GAMES_TO_WATCH = 3;

/**
 * Players to Watch top scorer (D9): highest points per game among players with at least {@link MIN_GAMES_TO_WATCH}
 * games played and a point. Tie-break: more goals per game, then more total points, then FEWER shots.
 */
export function selectTopScorerPerGame<C extends Candidate>(candidates: readonly C[], minGames = MIN_GAMES_TO_WATCH): C | null {
  const rate = (n: number, c: C) => n / (c.tally.gamesPlayed ?? 1);
  return best(
    candidates.filter((c) => (c.tally.gamesPlayed ?? 0) >= minGames && pointsOf(c.tally) > 0),
    (a, b) =>
      rate(pointsOf(b.tally), b) - rate(pointsOf(a.tally), a) ||
      rate(b.tally.goals, b) - rate(a.tally.goals, a) ||
      pointsOf(b.tally) - pointsOf(a.tally) ||
      a.tally.shots - b.tally.shots ||
      byIdentity(a, b),
  );
}

/** Top goalie: most saves among goalies who faced a shot; tie-break fewer goals against. */
export function selectTopGoalie<C extends Candidate>(candidates: readonly C[]): C | null {
  return best(
    candidates.filter((c) => c.player.position === 'G' && c.tally.saves + c.tally.goalsAgainst > 0),
    (a, b) => b.tally.saves - a.tally.saves || a.tally.goalsAgainst - b.tally.goalsAgainst || byIdentity(a, b),
  );
}

/** Top faceoff man: most faceoffs won among players who took at least one; tie-break higher FO%, then more taken. */
export function selectTopFaceoff<C extends Candidate>(candidates: readonly C[]): C | null {
  return best(
    candidates.filter((c) => c.tally.faceoffsTaken > 0),
    (a, b) =>
      b.tally.faceoffsWon - a.tally.faceoffsWon ||
      (ratio(b.tally.faceoffsWon, b.tally.faceoffsTaken) ?? 0) - (ratio(a.tally.faceoffsWon, a.tally.faceoffsTaken) ?? 0) ||
      b.tally.faceoffsTaken - a.tally.faceoffsTaken ||
      byIdentity(a, b),
  );
}

type Colors = Record<Side, string>;

export const teamColors = (game: GameDetail['data']): Colors => ({
  away: game.away.team.colors.primary,
  home: game.home.team.colors.primary,
});

// ---------------------------------------------------------------------------
// Live / post: this game
// ---------------------------------------------------------------------------

/** Pairs each stat line with its player ref (players without a ref are dropped: nothing to show). */
export function gameCandidates(stats: GameStats['data']): (Candidate & { teamId: string })[] {
  const refs = new Map(stats.playerRefs.map((p) => [p.id, p]));
  return stats.players.flatMap((s) => {
    const player = refs.get(s.playerId);
    return player ? [{ player, tally: s, teamId: s.teamId }] : [];
  });
}

const gameScorer = (c: Candidate, color: string): Performer => {
  const t = c.tally;
  return {
    player: c.player,
    teamColor: color,
    primary: { value: formatStat(t.goals), label: 'Goals' },
    secondary: [`${formatStat(t.goals)}/${formatStat(t.shots)} SH`, `${formatStat(t.assists)} A`, `${formatStat(pointsOf(t))} PTS`],
  };
};

const gameGoalie = (c: Candidate, color: string): Performer => ({
  player: c.player,
  teamColor: color,
  primary: { value: formatStat(c.tally.saves), label: 'Saves' },
  secondary: [`${pct(ratio(c.tally.saves, c.tally.saves + c.tally.goalsAgainst))} SV%`],
});

const gameFaceoff = (c: Candidate, color: string): Performer => ({
  player: c.player,
  teamColor: color,
  primary: { value: formatStat(c.tally.faceoffsWon), label: 'Won' },
  secondary: [`${pct(ratio(c.tally.faceoffsWon, c.tally.faceoffsTaken))} FO%`, `${formatStat(c.tally.turnovers ?? 0)} TO`],
});

/** The three Top Performers sections for a live or finished game. */
export function buildTopPerformers(stats: GameStats['data'], game: GameDetail['data']): PerformerSection[] {
  const all = gameCandidates(stats);
  const colors = teamColors(game);
  const ids: Record<Side, string> = { away: game.away.team.id, home: game.home.team.id };
  const pick = <C extends Candidate>(
    select: (cs: readonly C[]) => C | null,
    view: (c: C, color: string) => Performer,
    side: Side,
  ) => {
    const top = select(all.filter((c) => c.teamId === ids[side]) as unknown as C[]);
    return top ? view(top, colors[side]) : null;
  };
  return [
    {
      category: 'scoring',
      title: 'Goals',
      emptyLabel: 'No points yet',
      away: pick(selectTopScorer, gameScorer, 'away'),
      home: pick(selectTopScorer, gameScorer, 'home'),
    },
    {
      category: 'goalie',
      title: 'Saves',
      emptyLabel: 'No saves yet',
      away: pick(selectTopGoalie, gameGoalie, 'away'),
      home: pick(selectTopGoalie, gameGoalie, 'home'),
    },
    {
      category: 'faceoff',
      title: 'Faceoff Wins',
      emptyLabel: 'No faceoffs yet',
      away: pick(selectTopFaceoff, gameFaceoff, 'away'),
      home: pick(selectTopFaceoff, gameFaceoff, 'home'),
    },
  ];
}

// ---------------------------------------------------------------------------
// Pre: season
// ---------------------------------------------------------------------------

type Season = GamePreview['data']['rosters']['home'][number]['season'];
type SeasonCandidate = Candidate<Season>;

const seasonCandidates = (roster: GamePreview['data']['rosters']['home']): SeasonCandidate[] =>
  roster.map(({ season, ...player }) => ({ player, tally: season }));

const seasonScorer = (c: SeasonCandidate, color: string): Performer => {
  const t = c.tally;
  return {
    player: c.player,
    teamColor: color,
    primary: { value: perGame(pointsOf(t), t.gamesPlayed), label: 'Pts/G' },
    secondary: [`${perGame(t.goals, t.gamesPlayed)} G/G`, `${perGame(t.assists, t.gamesPlayed)} A/G`, `${formatStat(t.gamesPlayed)} GP`],
  };
};

const seasonGoalie = (c: SeasonCandidate, color: string): Performer => ({
  player: c.player,
  teamColor: color,
  primary: { value: perGame(c.tally.saves, c.tally.gamesPlayed), label: 'Saves/G' },
  secondary: [`${pct(ratio(c.tally.saves, c.tally.saves + c.tally.goalsAgainst))} SV%`],
});

const seasonFaceoff = (c: SeasonCandidate, color: string): Performer => ({
  player: c.player,
  teamColor: color,
  primary: { value: pct(ratio(c.tally.faceoffsWon, c.tally.faceoffsTaken)).replace('%', ''), label: 'FO%' }, // sign lives in the label: keeps the big number narrow
  secondary: [],
});

/** The three Players to Watch sections from season stats (`preview.rosters`). Top scorer = points per game (min. 3 GP, D9). Everything to 1 decimal. */
export function buildPlayersToWatch(preview: GamePreview['data'], game: GameDetail['data']): PerformerSection[] {
  const colors = teamColors(game);
  const rosters: Record<Side, SeasonCandidate[]> = {
    away: seasonCandidates(preview.rosters.away),
    home: seasonCandidates(preview.rosters.home),
  };
  const pick = (
    select: (cs: readonly SeasonCandidate[]) => SeasonCandidate | null,
    view: (c: SeasonCandidate, color: string) => Performer,
    side: Side,
  ) => {
    const top = select(rosters[side]);
    return top ? view(top, colors[side]) : null;
  };
  return [
    {
      category: 'scoring',
      title: 'Top Scorer',
      emptyLabel: `Min. ${MIN_GAMES_TO_WATCH} games played`,
      away: pick(selectTopScorerPerGame, seasonScorer, 'away'),
      home: pick(selectTopScorerPerGame, seasonScorer, 'home'),
    },
    {
      category: 'goalie',
      title: 'Goalie',
      emptyLabel: 'No season stats yet',
      away: pick(selectTopGoalie, seasonGoalie, 'away'),
      home: pick(selectTopGoalie, seasonGoalie, 'home'),
    },
    {
      category: 'faceoff',
      title: 'Faceoff',
      emptyLabel: 'No season stats yet',
      away: pick(selectTopFaceoff, seasonFaceoff, 'away'),
      home: pick(selectTopFaceoff, seasonFaceoff, 'home'),
    },
  ];
}

/** True when no side of any section has a performer (render the empty state). */
export const isEmptySections = (sections: readonly PerformerSection[]): boolean =>
  sections.every((s) => s.away === null && s.home === null);
