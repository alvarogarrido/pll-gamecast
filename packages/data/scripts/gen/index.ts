/** Pure DB generator (no file system access): `generateDb(seed)` always returns the same database. */
import type { Db } from '../../src/db';
import { buildEditorial } from './editorial';
import { CONFERENCES } from './league';
import { createRng } from './rng';
import { buildSeason } from './season';
import { SEASON, SNAPSHOT_TIME, SNAPSHOT_WEEK } from './time';

export const DEFAULT_SEED = 'il-2027-d';

export function generateDb(seed = DEFAULT_SEED): Db {
  const season = buildSeason(seed);
  const editorial = buildEditorial(createRng(seed), season, SNAPSHOT_TIME);
  return {
    meta: { snapshotTime: SNAPSHOT_TIME, season: SEASON, currentWeek: SNAPSHOT_WEEK },
    conferences: CONFERENCES,
    teams: season.teams,
    players: season.players,
    games: editorial.games,
    plays: season.plays,
    articles: editorial.articles,
    videos: editorial.videos,
    staff: editorial.staff,
    staffPicks: editorial.staffPicks,
    injuries: season.injuries,
    insights: editorial.insights,
  };
}
