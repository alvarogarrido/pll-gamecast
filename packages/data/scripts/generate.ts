/**
 * Generate the text-file database: `npm run generate -w @pll/data`.
 * Deterministic (seeded) and re-runnable: the db/ folder is rebuilt from scratch on every run.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDb, type Db } from '../src/db';
import { DEFAULT_SEED, generateDb } from './gen';
import { DEFAULT_DB_DIR } from './load-db';

const pretty = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

/** One element per line keeps the big play logs diffable without pretty-printing every field. */
const linePerItem = (items: readonly unknown[]) => `[\n${items.map((i) => JSON.stringify(i)).join(',\n')}\n]\n`;

/** Validates first (which also puts keys in canonical schema order), then writes the folder from scratch. */
export function writeDb(input: Db, dir: string = DEFAULT_DB_DIR): Db {
  const db = validateDb(input);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, 'plays'), { recursive: true });
  const put = (name: string, content: string) => writeFileSync(join(dir, name), content);

  put('meta.json', pretty(db.meta));
  put('conferences.json', pretty(db.conferences));
  put('teams.json', pretty(db.teams));
  put('players.json', linePerItem(db.players));
  put('games.json', pretty(db.games));
  put('articles.json', pretty(db.articles));
  put('videos.json', pretty(db.videos));
  put('staff.json', pretty(db.staff));
  put('staff-picks.json', linePerItem(db.staffPicks));
  put('injuries.json', pretty(db.injuries));
  put('insights.json', pretty(db.insights));
  for (const game of db.games) put(join('plays', `${game.id}.json`), linePerItem(db.plays[game.id] ?? []));
  return db;
}

function main(): void {
  const seed = process.argv[2] ?? DEFAULT_SEED;
  const db = writeDb(generateDb(seed));
  console.log(`Wrote ${db.games.length} games, ${db.players.length} players, ${db.articles.length} articles to ${DEFAULT_DB_DIR} (seed "${seed}")`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
