import path from 'node:path';
import type { NextConfig } from 'next';

const config: NextConfig = {
  // Static site: every /ncaa/game/<id>/ page is pre-rendered from generateStaticParams.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  // Workspace packages ship TypeScript sources.
  transpilePackages: ['@pll/ui', '@pll/tokens', '@pll/data'],
  // The monorepo root holds the lockfile and hoisted node_modules.
  turbopack: { root: path.resolve(__dirname, '../..') },
};

export default config;
