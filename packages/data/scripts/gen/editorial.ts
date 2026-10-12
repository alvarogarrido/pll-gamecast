/**
 * Editorial layer: stakes text, previews and recaps, videos, Inside Lacrosse staff and picks, editorial insights.
 * All copy is generated from the simulated games so it always agrees with the numbers.
 */
import { wallClockAt } from '../../src/clock';
import { scoreFromPlays, shortName, type BoxScore } from '../../src/derive';
import type {
  Article,
  GameRecord,
  InsightRecord,
  Person,
  PlayRecord,
  Player,
  StaffPick,
  Team,
  Video,
} from '../../src/schema';
import { CONFERENCES, TEAM_SEEDS } from './league';
import type { Rng } from './rng';
import type { SeasonOutput } from './season';
import { addMinutes, formatLocalTime } from './time';

/** TODO: replace with real Inside Lacrosse video URLs. Public sample clip for the prototype. */
export const SAMPLE_VIDEO_SRC = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
export const PLACEHOLDER_THUMB = '/media/placeholder-thumb.svg';

export const STAFF: Person[] = [
  { id: 'staff-hale', name: 'Marcus Hale', photoUrl: null, title: 'Senior Writer' },
  { id: 'staff-lindqvist', name: 'Maya Lindqvist', photoUrl: null, title: 'Lacrosse Analyst' },
  { id: 'staff-marchetti', name: 'Theo Marchetti', photoUrl: null, title: 'Managing Editor' },
  { id: 'staff-delgado', name: 'Rosa Delgado', photoUrl: null, title: 'Staff Writer' },
];

export interface Editorial {
  games: GameRecord[];
  articles: Article[];
  videos: Video[];
  staff: Person[];
  staffPicks: StaffPick[];
  insights: InsightRecord[];
}

interface Ctx {
  rng: Rng;
  teams: ReadonlyMap<string, Team>;
  players: ReadonlyMap<string, Player>;
  season: SeasonOutput;
  conferenceName: ReadonlyMap<string, string>;
  zone: ReadonlyMap<string, 'ET' | 'MT'>;
}

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
const record = (r: { wins: number; losses: number }) => `${r.wins}-${r.losses}`;
const ranked = (team: Team, rank: number | null) => (rank ? `No. ${rank} ${team.school}` : team.school);
const gameDay = (g: GameRecord) => g.startTime.slice(0, 10);

// ---------------------------------------------------------------------------
// Stakes
// ---------------------------------------------------------------------------

function stakesFor(ctx: Ctx, g: GameRecord): string {
  const home = ctx.teams.get(g.home.teamId) as Team;
  const away = ctx.teams.get(g.away.teamId) as Team;
  const rng = ctx.rng.fork(`stakes:${g.id}`);
  const hr = g.home.rankBefore;
  const ar = g.away.rankBefore;
  const sentences: string[] = [];

  if (g.gameType === 'ncaa_tournament') {
    sentences.push(
      `No. ${g.home.seed} seed ${home.school} meets No. ${g.away.seed} seed ${away.school} at ${g.venue.name} for a spot in the NCAA semifinals.`,
    );
  } else if (hr && ar) {
    sentences.push(
      rng.pick([
        `${ranked(away, ar)} visits ${ranked(home, hr)} in a matchup of ranked teams.`,
        `${ranked(home, hr)} hosts ${ranked(away, ar)} with both programs eyeing a top-five finish.`,
      ]),
    );
  } else if (hr || ar) {
    const [favorite, underdog] = hr ? [ranked(home, hr), away.school] : [ranked(away, ar), home.school];
    sentences.push(
      hr
        ? `${favorite} hosts ${underdog}, which is looking for a signature win to climb into the polls.`
        : `${underdog} hosts ${favorite}, a chance for a home upset over a ranked opponent.`,
    );
  } else {
    sentences.push(`${away.school} and ${home.school} meet with both teams trying to climb toward the national rankings.`);
  }

  if (g.gameType === 'ncaa_tournament') {
    sentences.push(`The winner advances to Championship Weekend; the loser's season ends here.`);
  } else if (g.isConferenceGame) {
    const conf = ctx.conferenceName.get(home.conferenceId) ?? 'conference';
    sentences.push(
      `The ${conf} standings are in play, with ${away.school} coming in at ${record(g.away.recordBefore)} and ${home.school} at ${record(g.home.recordBefore)}.`,
    );
  } else {
    sentences.push(
      `It is a non-conference test that feeds the RPI race, where ${home.school} sits at No. ${g.home.rpiBefore ?? '?'} and ${away.school} at No. ${g.away.rpiBefore ?? '?'}.`,
    );
  }

  if (g.gameType !== 'ncaa_tournament') {
    sentences.push(
      hr || ar
        ? 'The winner is likely to move up in next week’s poll.'
        : `A win would give either side a boost heading into the heart of the schedule.`,
    );
  }
  return sentences.join(' ');
}

// ---------------------------------------------------------------------------
// Season-to-date lookups (finals strictly before a game)
// ---------------------------------------------------------------------------

interface PriorRow {
  game: GameRecord;
  box: BoxScore;
}

function priorFinals(ctx: Ctx, before: string): PriorRow[] {
  return ctx.season.games
    .filter((x) => x.status === 'final' && x.startTime < before)
    .map((game) => ({ game, box: ctx.season.boxes.get(game.id) as BoxScore }));
}

function topScorerBefore(ctx: Ctx, rows: readonly PriorRow[], teamId: string) {
  const totals = new Map<string, { goals: number; assists: number }>();
  for (const { box } of rows) {
    for (const p of box.players) {
      if (p.teamId !== teamId) continue;
      const t = totals.get(p.playerId) ?? { goals: 0, assists: 0 };
      t.goals += p.goals;
      t.assists += p.assists;
      totals.set(p.playerId, t);
    }
  }
  const best = [...totals].sort(([, a], [, b]) => b.goals + b.assists - (a.goals + a.assists) || b.goals - a.goals)[0];
  if (!best) return null;
  return { player: ctx.players.get(best[0]) as Player, ...best[1] };
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

function previewArticle(ctx: Ctx, g: GameRecord, author: Person, stakes: string): Article {
  const home = ctx.teams.get(g.home.teamId) as Team;
  const away = ctx.teams.get(g.away.teamId) as Team;
  const rows = priorFinals(ctx, g.startTime);
  const topHome = topScorerBefore(ctx, rows, home.id);
  const topAway = topScorerBefore(ctx, rows, away.id);
  const rng = ctx.rng.fork(`preview:${g.id}`);

  const title =
    g.gameType === 'ncaa_tournament'
      ? `NCAA quarterfinal preview: ${away.school} vs. ${home.school}`
      : g.home.rankBefore && g.away.rankBefore
        ? rng.pick([
            `${away.school} and ${home.school} collide in a battle of ranked teams`,
            `Preview: ${ranked(away, g.away.rankBefore)} at ${ranked(home, g.home.rankBefore)}`,
          ])
        : rng.pick([`Preview: ${away.school} at ${home.school}`, `What to watch: ${away.school} vs. ${home.school}`]);

  const zone = ctx.zone.get(home.id) ?? 'ET';
  const where = `${formatLocalTime(g.startTime, g.neutralSite ? 'ET' : zone)} at ${g.venue.name} in ${g.venue.city}, ${g.venue.state}`;
  const leaders =
    topHome && topAway
      ? ` ${shortName(topHome.player)} leads ${home.school} with ${topHome.goals + topHome.assists} points, while ${shortName(topAway.player)} paces ${away.school} with ${topAway.goals + topAway.assists}.`
      : '';

  return {
    id: `art-${g.id.slice(0, 8)}-preview`,
    gameId: g.id,
    kind: 'preview',
    title,
    keySentence: firstSentence(stakes),
    excerpt: `${stakes}${leaders} Opening faceoff is at ${where}.`,
    authorId: author.id,
    imageUrl: null,
    url: `/news/${gameDay(g)}-${away.slug}-at-${home.slug}-preview`,
    publishedAt: addMinutes(g.startTime, -20 * 60),
  };
}

function recapVerb(margin: number, overtime: boolean, comeback: number): string {
  if (overtime) return 'outlasts';
  if (comeback >= 4) return 'rallies past';
  if (margin >= 7) return 'routs';
  if (margin >= 4) return 'beats';
  if (margin === 1) return 'edges';
  return 'holds off';
}

function recapArticle(ctx: Ctx, g: GameRecord, author: Person, plays: readonly PlayRecord[], box: BoxScore): Article {
  const score = scoreFromPlays(plays, g.home.teamId);
  const homeWon = score.home > score.away;
  const winner = ctx.teams.get(homeWon ? g.home.teamId : g.away.teamId) as Team;
  const loser = ctx.teams.get(homeWon ? g.away.teamId : g.home.teamId) as Team;
  const [ws, ls] = homeWon ? [score.home, score.away] : [score.away, score.home];
  const overtime = plays.some((p) => p.period > 4);

  let margin = 0;
  let worstDeficit = 0;
  for (const p of plays) {
    if (p.type !== 'goal') continue;
    margin += (p.teamId === winner.id ? 1 : -1);
    worstDeficit = Math.max(worstDeficit, -margin);
  }

  const winnerRows = box.players.filter((p) => p.teamId === winner.id);
  const star = [...winnerRows].sort((a, b) => b.points - a.points || b.goals - a.goals)[0];
  const goalie = [...box.players.filter((p) => p.teamId === loser.id || p.teamId === winner.id)]
    .sort((a, b) => b.saves - a.saves)[0];
  const winnerBox = box.teams.find((t) => t.teamId === winner.id);
  const half = score.periodScores;
  const halfW = (homeWon ? half.home : half.away).slice(0, 2).reduce((a, b) => a + b, 0);
  const halfL = (homeWon ? half.away : half.home).slice(0, 2).reduce((a, b) => a + b, 0);

  const verb = recapVerb(ws - ls, overtime, worstDeficit);
  const title = `${winner.school} ${verb} ${loser.school}, ${ws}-${ls}${overtime ? ' in overtime' : ''}`;
  const starName = star ? ctx.players.get(star.playerId) : undefined;
  const keySentence = star
    ? `${shortName(starName)} had ${star.goals} ${star.goals === 1 ? 'goal' : 'goals'} and ${star.assists} ${star.assists === 1 ? 'assist' : 'assists'} in ${winner.school}'s ${ws}-${ls} win over ${loser.school}.`
    : `${winner.school} beat ${loser.school}.`;

  const parts: string[] = [];
  parts.push(
    overtime
      ? `${winner.school} needed overtime to finish off ${loser.school}, ${ws}-${ls}, after the teams were level through regulation.`
      : worstDeficit >= 4
        ? `${winner.school} trailed by ${worstDeficit} goals before storming back to beat ${loser.school}, ${ws}-${ls}.`
        : halfW > halfL
          ? `${winner.school} led ${halfW}-${halfL} at the half and went on to beat ${loser.school}, ${ws}-${ls}.`
          : halfW === halfL
            ? `${winner.school} and ${loser.school} were tied ${halfW}-${halfL} at the half before ${winner.school} pulled away, ${ws}-${ls}.`
            : `${winner.school} trailed ${halfL}-${halfW} at the half but won the second half to beat ${loser.school}, ${ws}-${ls}.`,
  );
  if (star) {
    parts.push(`${shortName(starName)} finished with ${star.goals + star.assists} points (${star.goals}G, ${star.assists}A) to pace the ${winner.mascot}.`);
  }
  if (goalie && goalie.saves >= 8) {
    const goalieTeam = ctx.teams.get(goalie.teamId);
    parts.push(`${goalieTeam?.school ?? ''}'s ${shortName(ctx.players.get(goalie.playerId))} made ${goalie.saves} saves in goal.`.trim());
  } else if (winnerBox) {
    parts.push(`${winner.school} won ${winnerBox.faceoffsWon} of ${winnerBox.faceoffsTaken} faceoffs (${pct(winnerBox.faceoffsWon, winnerBox.faceoffsTaken)}%).`);
  }

  const end = wallClockAt(g.startTime, plays[plays.length - 1]?.elapsedSeconds ?? 0);
  return {
    id: `art-${g.id.slice(0, 8)}-recap`,
    gameId: g.id,
    kind: 'recap',
    title,
    keySentence,
    excerpt: parts.join(' '),
    authorId: author.id,
    imageUrl: null,
    url: `/news/${gameDay(g)}-${winner.slug}-${loser.slug}-recap`,
    publishedAt: addMinutes(end, 45),
  };
}

// ---------------------------------------------------------------------------
// Videos, picks, insights
// ---------------------------------------------------------------------------

function videosFor(ctx: Ctx, g: GameRecord, snapshotTime: string, scoreText: string | null): Video[] {
  const home = ctx.teams.get(g.home.teamId) as Team;
  const away = ctx.teams.get(g.away.teamId) as Team;
  const rng = ctx.rng.fork(`video:${g.id}`);
  const base = { gameId: g.id, thumbnailUrl: PLACEHOLDER_THUMB, src: SAMPLE_VIDEO_SRC };
  const id = (kind: string) => `vid-${g.id.slice(0, 8)}-${kind}`;
  const videos: Video[] = [
    {
      ...base,
      id: id('preview'),
      kind: 'preview',
      title: `${away.school} at ${home.school}: Game Preview`,
      durationSeconds: rng.int(85, 160),
      publishedAt: addMinutes(g.startTime, -18 * 60),
    },
  ];
  if (g.status === 'final' || g.status === 'live') {
    videos.push({
      ...base,
      id: id('highlight'),
      kind: 'highlight',
      title: g.status === 'live' ? `Live clips: ${away.school} at ${home.school}` : `Highlights: ${scoreText ?? `${away.school} at ${home.school}`}`,
      durationSeconds: rng.int(120, 260),
      publishedAt: g.status === 'live' ? addMinutes(snapshotTime, -12) : addMinutes(g.startTime, 3 * 60 + 15),
    });
  }
  if (g.status === 'final' && g.week >= 5) {
    videos.push({
      ...base,
      id: id('postgame'),
      kind: 'postgame',
      title: `Postgame reaction: ${home.school} and ${away.school}`,
      durationSeconds: rng.int(150, 300),
      publishedAt: addMinutes(g.startTime, 3 * 60 + 40),
    });
  }
  return videos;
}

function picksFor(ctx: Ctx, g: GameRecord, index: number): StaffPick[] {
  const include = g.week >= 5 || index % 2 === 0;
  if (!include) return [];
  const rng = ctx.rng.fork(`picks:${g.id}`);
  const prior = g.pregameWinProbabilityHome ?? 0.5;
  // Staff lean slightly differently so the module shows some disagreement.
  const lean = [0, -0.06, 0.04, -0.1];
  return STAFF.map((staff, i) => ({
    gameId: g.id,
    staffId: staff.id,
    pickTeamId: rng.chance(Math.min(0.92, Math.max(0.08, prior + (lean[i] ?? 0)))) ? g.home.teamId : g.away.teamId,
  }));
}

function editorialInsights(ctx: Ctx, g: GameRecord): InsightRecord[] {
  const rows = priorFinals(ctx, g.startTime);
  const out: InsightRecord[] = [];
  const add = (n: number, elapsedSeconds: number, kind: InsightRecord['kind'], title: string, body: string, teamId: string, playerId: string | null) =>
    out.push({ id: `ins-${g.id.slice(0, 8)}-${n}`, gameId: g.id, elapsedSeconds, kind, title, body, teamId, playerId });

  // Faceoff specialist's season rate.
  const homeFo = new Map<string, { won: number; taken: number }>();
  const goalies = new Map<string, { saves: number; against: number }>();
  for (const { box } of rows) {
    for (const p of box.players) {
      if (p.faceoffsTaken > 0) {
        const t = homeFo.get(p.playerId) ?? { won: 0, taken: 0 };
        t.won += p.faceoffsWon;
        t.taken += p.faceoffsTaken;
        homeFo.set(p.playerId, t);
      }
      if (p.saves + p.goalsAgainst > 0) {
        const t = goalies.get(p.playerId) ?? { saves: 0, against: 0 };
        t.saves += p.saves;
        t.against += p.goalsAgainst;
        goalies.set(p.playerId, t);
      }
    }
  }

  const sides = [g.home.teamId, g.away.teamId];
  sides.forEach((teamId, i) => {
    const team = ctx.teams.get(teamId) as Team;
    const bestFo = [...homeFo]
      .filter(([id, v]) => ctx.players.get(id)?.teamId === teamId && v.taken >= 12)
      .sort(([, a], [, b]) => b.taken - a.taken)[0];
    if (bestFo) {
      const [id, v] = bestFo;
      add(i * 3 + 1, 180 + i * 60, 'note', `${shortName(ctx.players.get(id))} owns the draw`, `${shortName(ctx.players.get(id))} enters winning ${pct(v.won, v.taken)}% of faceoffs for ${team.school} this season (${v.won}-for-${v.taken}).`, teamId, id);
    }
    const bestG = [...goalies]
      .filter(([id, v]) => ctx.players.get(id)?.teamId === teamId && v.saves + v.against >= 30)
      .sort(([, a], [, b]) => b.saves + b.against - (a.saves + a.against))[0];
    if (bestG) {
      const [id, v] = bestG;
      add(i * 3 + 2, 1500 + i * 120, 'milestone', `${shortName(ctx.players.get(id))} between the pipes`, `${shortName(ctx.players.get(id))} brings a .${String(Math.round((v.saves / (v.saves + v.against)) * 1000)).padStart(3, '0')} save percentage into the game for ${team.school}.`, teamId, id);
    }
    const games = rows.filter((r) => r.game.home.teamId === teamId || r.game.away.teamId === teamId);
    const high = games.filter((r) => (r.box.teams.find((t) => t.teamId === teamId)?.goals ?? 0) >= 12).length;
    if (games.length >= 3) {
      add(i * 3 + 3, 2400 + i * 180, 'record', `${team.school} at 12 or more`, `${team.school} has scored 12 or more goals in ${high} of its ${games.length} games this season.`, teamId, null);
    }
  });
  return out;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/** Nothing can have been published after the snapshot. */
const clampTo = (snapshotTime: string) => (iso: string) => {
  const latest = addMinutes(snapshotTime, -8);
  return iso > latest ? latest : iso;
};

export function buildEditorial(root: Rng, season: SeasonOutput, snapshotTime: string): Editorial {
  const clamp = clampTo(snapshotTime);
  const teams = new Map(season.teams.map((t) => [t.id, t]));
  const ctx: Ctx = {
    rng: root.fork('editorial'),
    teams,
    players: new Map(season.players.map((p) => [p.id, p])),
    season,
    conferenceName: new Map(CONFERENCES.map((c) => [c.id, c.shortName])),
    zone: new Map(TEAM_SEEDS.map((s) => [s.id, s.timeZone])),
  };

  const articles: Article[] = [];
  const videos: Video[] = [];
  const staffPicks: StaffPick[] = [];
  const insights: InsightRecord[] = [];

  const games = season.games.map((original, index) => {
    const g: GameRecord = { ...original, home: { ...original.home }, away: { ...original.away } };
    const plays = season.plays[g.id] as PlayRecord[];
    const box = season.boxes.get(g.id) as BoxScore;
    const author = STAFF[index % STAFF.length] as Person;

    g.stakes = stakesFor(ctx, g);
    const preview = previewArticle(ctx, g, author, g.stakes);
    articles.push({ ...preview, publishedAt: clamp(preview.publishedAt) });
    g.previewArticleId = preview.id;

    let scoreText: string | null = null;
    if (g.status === 'final') {
      const recap = recapArticle(ctx, g, STAFF[(index + 1) % STAFF.length] as Person, plays, box);
      articles.push({ ...recap, publishedAt: clamp(recap.publishedAt) });
      g.recapArticleId = recap.id;
      const s = scoreFromPlays(plays, g.home.teamId);
      const homeWon = s.home > s.away;
      const w = ctx.teams.get(homeWon ? g.home.teamId : g.away.teamId) as Team;
      const l = ctx.teams.get(homeWon ? g.away.teamId : g.home.teamId) as Team;
      scoreText = `${w.school} ${Math.max(s.home, s.away)}, ${l.school} ${Math.min(s.home, s.away)}`;
    }
    for (const video of videosFor(ctx, g, snapshotTime, scoreText)) videos.push({ ...video, publishedAt: clamp(video.publishedAt) });
    staffPicks.push(...picksFor(ctx, g, index));
    if (g.week >= 6) insights.push(...editorialInsights(ctx, g));
    return g;
  });

  return { games, articles, videos, staff: STAFF, staffPicks, insights };
}

/** First sentence of `text`, ignoring the period in poll abbreviations like "No. 2". */
function firstSentence(text: string): string {
  const match = /^.*?[.!?](?=\s+[A-Z])(?<!\bNo\.)/s.exec(text);
  return (match ? match[0] : text).trim();
}
