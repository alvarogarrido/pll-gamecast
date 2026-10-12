/**
 * Reads packages/data/db/** into one plain object with the shape of `Db` (@pll/data/db): all collections plus
 * `plays` keyed by game id. No validation (npm run build -w @pll/data validates the DB); no dependencies.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_DB_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../packages/data/db');

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

/** @param {string} [dir] */
export function loadRawDb(dir = DEFAULT_DB_DIR) {
  const file = (name) => readJson(join(dir, `${name}.json`));
  const plays = {};
  for (const name of readdirSync(join(dir, 'plays')).sort()) {
    if (name.endsWith('.json')) plays[name.slice(0, -'.json'.length)] = readJson(join(dir, 'plays', name));
  }
  return {
    meta: file('meta'),
    conferences: file('conferences'),
    teams: file('teams'),
    players: file('players'),
    games: file('games'),
    plays,
    articles: file('articles'),
    videos: file('videos'),
    staff: file('staff'),
    staffPicks: file('staff-picks'),
    injuries: file('injuries'),
    insights: file('insights'),
  };
}
