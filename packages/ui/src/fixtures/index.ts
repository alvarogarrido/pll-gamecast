/// <reference types="vite/client" />
/**
 * Story fixtures — STORYBOOK ONLY (never exported from the package barrel).
 *
 * Builds API responses from the real simulated dataset in packages/data/db with the same pure
 * `buildApi` the static site uses, so every story renders genuine, internally consistent games.
 *
 *   const game = fixtures.game(GAMES.liveQ4);                 // GameDetail['data']
 *   const stats = fixtures.stats(GAMES.final);                // GameStats['data']
 *   const mid = fixtures.at(GAMES.liveQ4, 1800).game();       // same game frozen at 30:00 elapsed
 */
import { createApi, type BuildApiOptions } from '@pll/data/build-api';
import { validateDb, type Db } from '@pll/data/db';
import type {
  GameDetail,
  GameInsights,
  GameMedia,
  GamePlays,
  GamePreview,
  GameStats,
  ScoreboardResponse,
  WinProbabilitySeries,
} from '@pll/data/api';

import meta from '../../../data/db/meta.json';
import conferences from '../../../data/db/conferences.json';
import teams from '../../../data/db/teams.json';
import players from '../../../data/db/players.json';
import games from '../../../data/db/games.json';
import articles from '../../../data/db/articles.json';
import videos from '../../../data/db/videos.json';
import staff from '../../../data/db/staff.json';
import staffPicks from '../../../data/db/staff-picks.json';
import injuries from '../../../data/db/injuries.json';
import insights from '../../../data/db/insights.json';

const playFiles = import.meta.glob<unknown>('../../../data/db/plays/*.json', { eager: true, import: 'default' });
const plays = Object.fromEntries(
  Object.entries(playFiles).map(([path, log]) => [path.split('/').pop()!.replace(/\.json$/, ''), log]),
);

export const db: Db = validateDb({
  meta,
  conferences,
  teams,
  players,
  games,
  plays,
  articles,
  videos,
  staff,
  staffPicks,
  injuries,
  insights,
});

/** Hand-picked games from the snapshot slate (Sat 13 Mar 2027) covering every state. */
export const GAMES = {
  /** Duke (#2) at Notre Dame (#4), live, tied 12–12, Q4 2:23. Ranked vs ranked, ACC. */
  liveQ4: 'da8f8b81-2201-47b1-b0a3-94aa63f19948',
  /** Maryland (#1) at Johns Hopkins (#5), live, 3–3, Q2 7:09. */
  liveQ2: 'a20de66f-92a8-4d43-a72d-f3efa4f3d0d1',
  /** Penn (#17) at Cornell (#3), final 8–11. Ivy. */
  final: '531c71d4-db8a-4f11-9d1b-db4eea1dea85',
  /** Georgetown at Virginia (#11), final 8–17, cross-conference blowout. */
  finalBlowout: 'b892f6a8-93a4-43b5-a31c-10612db2f2c7',
  /** Yale (#7) at Princeton (#10), scheduled later that day. */
  scheduled: '5490a6eb-2cf6-4841-94ff-f7d2384c0d7e',
  /** UNC at Syracuse, scheduled, indoor (JMA Wireless Dome, no weather). */
  scheduledIndoor: '5a80179e-949b-4eea-a9f9-300233d1a3cb',
  /** Penn State vs Duke, NCAA Quarterfinal in May, neutral site, seeded. */
  ncaa: 'ab6e3fd1-15ec-4dae-9b79-15ca4aa32201',
  /** An earlier-week game that went to overtime (final). */
  finalOvertime: '8d07bac4-b313-4fd4-ab59-cb4ac3753693',
} as const;

/** Server "now" of the snapshot — pass as `nowMs` in stories (the app derives it from meta.serverTime). */
export const nowMs: number = Date.parse(db.meta.snapshotTime);

function client(opts: BuildApiOptions = {}) {
  const api = createApi(db, opts);
  const get = <T extends { data: unknown }>(path: string): T['data'] => {
    const res = api.resolve(path) as T | undefined;
    if (!res) throw new Error(`fixtures: no API response for ${path}`);
    return res.data;
  };
  return {
    scoreboard: () => get<ScoreboardResponse>('/scoreboard'),
    game: (id: string) => get<GameDetail>(`/games/${id}`),
    stats: (id: string) => get<GameStats>(`/games/${id}/stats`),
    plays: (id: string) => get<GamePlays>(`/games/${id}/plays`),
    winProbability: (id: string) => get<WinProbabilitySeries>(`/games/${id}/win-probability`),
    insights: (id: string) => get<GameInsights>(`/games/${id}/insights`),
    preview: (id: string) => get<GamePreview>(`/games/${id}/preview`),
    media: (id: string) => get<GameMedia>(`/games/${id}/media`),
  };
}

/** Snapshot-time responses, plus `at(id, elapsedSeconds)` to freeze one game at another moment. */
export const fixtures = {
  ...client(),
  at: (gameId: string, elapsedSeconds: number) => {
    const c = client({ elapsedOverrides: { [gameId]: elapsedSeconds } });
    return {
      game: () => c.game(gameId),
      stats: () => c.stats(gameId),
      plays: () => c.plays(gameId),
      winProbability: () => c.winProbability(gameId),
      insights: () => c.insights(gameId),
    };
  },
};
