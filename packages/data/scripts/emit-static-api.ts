/**
 * Compile the text DB into the static JSON API: `npm run build -w @pll/data`.
 * Writes apps/web/public/api/v1{path}.json for every API path and copies media placeholders to
 * apps/web/public/media/. Cleans the API folder first, so it is idempotent.
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { buildApi, validateApi } from '../src/build-api';
import { loadDbFromDisk, PACKAGE_DIR } from './load-db';

const WEB_PUBLIC = resolve(PACKAGE_DIR, '../../apps/web/public');
const API_DIR = join(WEB_PUBLIC, 'api', 'v1');
const MEDIA_SRC = join(PACKAGE_DIR, 'media');
const MEDIA_DEST = join(WEB_PUBLIC, 'media');

function main(): void {
  const started = Date.now();
  const db = loadDbFromDisk();
  const api = buildApi(db);

  const issues = validateApi(api);
  if (issues.length > 0) {
    console.error(`API validation failed (${issues.length} issues):\n- ${issues.slice(0, 20).join('\n- ')}`);
    process.exit(1);
  }

  rmSync(API_DIR, { recursive: true, force: true });
  for (const [path, value] of api) {
    const file = join(API_DIR, `${path}.json`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(value));
  }

  if (existsSync(MEDIA_SRC)) {
    mkdirSync(MEDIA_DEST, { recursive: true });
    cpSync(MEDIA_SRC, MEDIA_DEST, { recursive: true });
  }
  console.log(`Wrote ${api.size} API files to ${API_DIR} in ${Date.now() - started} ms`);
}

main();
