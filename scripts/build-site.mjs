#!/usr/bin/env node
/**
 * Assembles the deployable site (Vercel `outputDirectory`) into ./site:
 *
 *   site/                 the prototype (apps/web static export), exactly as `npm run build` produces it
 *   site/lab/             the Scenario Lab (Vite, base /lab/)
 *   site/lab/db.json      the whole DB as one JSON object (the service worker and the Lab read it)
 *   site/lab-sw.js        the Lab's service worker, at the ROOT because its scope is "/"
 *   site/storybook/       the component library
 *
 * Usage: npm run build:site [-- --skip=web,storybook]   (skip steps while iterating; the missing parts are then not rebuilt)
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRawDb } from './lib/raw-db.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');
const skip = new Set(
  (process.argv.find((a) => a.startsWith('--skip=')) ?? '').replace('--skip=', '').split(',').filter(Boolean),
);

function npm(...args) {
  console.log(`\n> npm ${args.join(' ')}`);
  const result = spawnSync('npm', args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`\nbuild:site failed in: npm ${args.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

function copy(from, to) {
  const source = join(root, from);
  if (!existsSync(source)) {
    console.error(`Missing build output: ${from}`);
    process.exit(1);
  }
  mkdirSync(dirname(join(site, to)), { recursive: true });
  cpSync(source, join(site, to), { recursive: true });
  console.log(`  ${from}  ->  site/${to || '.'}`);
}

// 1. Build everything (each step writes into its own workspace).
if (!skip.has('web')) npm('run', 'build', '-w', '@pll/web'); // prebuild regenerates the static API from packages/data
if (!skip.has('storybook')) npm('run', 'build-storybook', '-w', '@pll/ui');
if (!skip.has('lab')) {
  npm('run', 'build', '-w', '@pll/lab');
  npm('run', 'build:sw', '-w', '@pll/lab');
}

// 2. Assemble.
console.log('\nAssembling site/');
rmSync(site, { recursive: true, force: true });
mkdirSync(site, { recursive: true });
copy('apps/web/out', '');
copy('apps/lab/dist', 'lab');
copy('packages/ui/storybook-static', 'storybook');
copy('apps/lab/dist-sw/lab-sw.js', 'lab-sw.js');

const db = loadRawDb();
writeFileSync(join(site, 'lab', 'db.json'), JSON.stringify(db));
console.log(`  packages/data/db  ->  site/lab/db.json (${db.games.length} games, ${Object.keys(db.plays).length} play logs)`);

console.log('\nDone: ./site  (preview it with: npm run preview:site)');
