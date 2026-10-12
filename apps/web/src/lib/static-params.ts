import fs from 'node:fs';
import path from 'node:path';

/**
 * Build-time list of game ids for generateStaticParams().
 *
 * TEMPORARY: reads the text-file DB directly. packages/data will export a loader
 * (`@pll/data/db`); switch to it when it lands. Build-time only (uses fs): never import from client code.
 *
 * `next build` runs with cwd = apps/web.
 */
export const GAMES_JSON_PATH = path.resolve(process.cwd(), '../../packages/data/db/games.json');

export function getGameIds(): string[] {
  let raw: string;
  try {
    raw = fs.readFileSync(GAMES_JSON_PATH, 'utf8');
  } catch {
    console.warn(`[static-params] ${GAMES_JSON_PATH} not found: no game pages will be pre-rendered. Run \`npm run data:build\`.`);
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    // Accept either `[{ id }, ...]` or `{ games: [{ id }, ...] }`.
    const list = Array.isArray(parsed) ? parsed : (parsed as { games?: unknown })?.games;
    if (!Array.isArray(list)) throw new Error('expected an array of games');
    return list
      .map((g) => (g as { id?: unknown })?.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch (error) {
    console.warn(`[static-params] could not read game ids from ${GAMES_JSON_PATH}:`, error);
    return [];
  }
}

/**
 * Id used when the DB has no games. `output: 'export'` refuses an empty generateStaticParams(), so the
 * build still emits one page; it simply shows the "Not found" state because the API has no such game.
 */
export const PLACEHOLDER_GAME_ID = '_placeholder';

export function getGameIdParams(): { gameId: string }[] {
  const ids = getGameIds();
  if (ids.length === 0) {
    console.warn(`[static-params] no game ids found: emitting a single "${PLACEHOLDER_GAME_ID}" page so the static export can build.`);
    return [{ gameId: PLACEHOLDER_GAME_ID }];
  }
  return ids.map((gameId) => ({ gameId }));
}
