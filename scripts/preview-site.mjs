#!/usr/bin/env node
/**
 * Serves ./site the way vercel.json configures Vercel (trailing slashes, / -> /lab/, no-cache headers),
 * for local verification of the production build.  Usage: npm run preview:site [-- --port=4173]
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');
const arg = process.argv.find((a) => a.startsWith('--port='));
const port = Number(arg?.split('=')[1] ?? process.env.PORT ?? 4173);

if (!existsSync(site)) {
  console.error('No ./site folder. Run `npm run build:site` first.');
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
  '.mp4': 'video/mp4',
};

const NO_CACHE = new Set(['/lab-sw.js', '/lab/db.json']);

const isFile = (p) => existsSync(p) && statSync(p).isFile();
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();

function send(res, status, headers, file) {
  res.writeHead(status, headers);
  if (file) createReadStream(file).pipe(res);
  else res.end();
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return send(res, 400, {});
  }
  const log = (status) => console.log(`${status} ${req.method} ${req.url}`);

  if (pathname === '/') {
    log(307);
    return send(res, 307, { Location: '/lab/' });
  }

  const target = normalize(join(site, pathname));
  if (target !== site && !target.startsWith(site + sep)) return send(res, 403, {});

  const headers = (file) => {
    const h = { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' };
    if (NO_CACHE.has(pathname)) h['Cache-Control'] = 'no-cache';
    if (pathname === '/lab-sw.js') h['Service-Worker-Allowed'] = '/';
    return h;
  };

  // A directory: trailingSlash -> redirect, then serve its index.html.
  if (isDir(target)) {
    if (!pathname.endsWith('/')) {
      log(308);
      return send(res, 308, { Location: `${pathname}/${url.search}` });
    }
    const index = join(target, 'index.html');
    if (isFile(index)) {
      log(200);
      return send(res, 200, headers(index), index);
    }
  }
  if (isFile(target)) {
    log(200);
    return send(res, 200, headers(target), target);
  }
  const notFound = join(site, '404.html');
  log(404);
  if (isFile(notFound)) return send(res, 404, headers(notFound), notFound);
  return send(res, 404, { 'Content-Type': 'text/plain' });
});

server.listen(port, () => console.log(`Serving ./site at http://localhost:${port}  (Lab: http://localhost:${port}/lab/)`));
