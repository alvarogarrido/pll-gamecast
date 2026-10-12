import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { build, defineConfig, type Plugin } from 'vite';
import { loadRawDb } from '../../scripts/lib/raw-db.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const WEB_ORIGIN = process.env.LAB_WEB_ORIGIN ?? 'http://localhost:3000';

/**
 * Dev only. Serves the two things the production site gets from scripts/build-site.mjs:
 *   /lab-sw.js      the service worker, bundled on demand (vite.sw.config.ts) and rebuilt when its sources change
 *   /lab/db.json    the DB as one JSON object, read from packages/data/db
 * Production never uses this plugin's server hooks.
 */
function labDevAssets(): Plugin {
  let swCode: string | null = null;
  return {
    name: 'lab-dev-assets',
    apply: 'serve',
    configureServer(server) {
      const watched = [path.resolve(here, 'src/sw'), path.resolve(here, '../../packages/scenarios/src'), path.resolve(here, '../../packages/data/src')];
      server.watcher.on('change', (file) => {
        if (watched.some((dir) => file.startsWith(dir))) swCode = null;
      });
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url ?? '').split('?')[0];
        try {
          if (url === '/lab-sw.js') {
            swCode ??= await bundleServiceWorker();
            res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Service-Worker-Allowed', '/');
            res.end(swCode);
            return;
          }
          if (url === '/lab/db.json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-cache');
            res.end(JSON.stringify(loadRawDb()));
            return;
          }
        } catch (error) {
          res.statusCode = 500;
          res.end(String(error));
          return;
        }
        next();
      });
    },
  };
}

async function bundleServiceWorker(): Promise<string> {
  const result = await build({
    root: here,
    configFile: path.resolve(here, 'vite.sw.config.ts'),
    logLevel: 'warn',
    build: { write: false },
  });
  const output = Array.isArray(result) ? result[0] : result;
  if (!output || !('output' in output)) throw new Error('service worker build produced no output');
  const chunk = output.output.find((o) => o.type === 'chunk');
  if (!chunk || chunk.type !== 'chunk') throw new Error('service worker build produced no chunk');
  return chunk.code;
}

export default defineConfig({
  base: '/lab/',
  plugins: [react(), tailwindcss(), labDevAssets()],
  server: {
    port: 5173,
    strictPort: true,
    // Same-origin iframe: everything that is not the Lab's own (/lab/*, /lab-sw.js) goes to `next dev` (apps/web).
    proxy: {
      '^/(?!lab(/|$)|lab-sw\\.js$)': { target: WEB_ORIGIN, changeOrigin: false, ws: true },
    },
  },
  preview: { port: 5174 },
  build: { outDir: 'dist', emptyOutDir: true, target: 'es2022' },
});
