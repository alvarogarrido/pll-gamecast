/** Node-only: read the text-file DB from disk into the in-memory `Db` shape (and validate it). */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDb, type Db } from '../src/db';

export const PACKAGE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_DB_DIR = join(PACKAGE_DIR, 'db');

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));

/** Loads and validates `dir` (defaults to packages/data/db). Throws `DbValidationError` if invalid. */
export function loadDbFromDisk(dir: string = DEFAULT_DB_DIR): Db {
  const file = (name: string) => readJson(join(dir, `${name}.json`));
  const plays: Record<string, unknown> = {};
  for (const name of readdirSync(join(dir, 'plays')).sort()) {
    if (name.endsWith('.json')) plays[name.slice(0, -'.json'.length)] = readJson(join(dir, 'plays', name));
  }
  return validateDb({
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
  });
}
