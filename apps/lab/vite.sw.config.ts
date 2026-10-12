import { defineConfig } from 'vite';

/**
 * Bundles the service worker into ONE self-contained classic script. It must be served from the site root (/lab-sw.js)
 * because the scope is "/": see scripts/build-site.mjs (production) and vite.config.ts (dev middleware).
 */
export default defineConfig({
  publicDir: false,
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: 'dist-sw',
    emptyOutDir: true,
    target: 'es2022',
    minify: true,
    sourcemap: false,
    lib: { entry: 'src/sw/index.ts', formats: ['iife'], name: 'PllLabSw', fileName: () => 'lab-sw.js' },
  },
});
