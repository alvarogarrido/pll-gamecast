# PLL Gamecast

Redesign of the Inside Lacrosse NCAA Gamecast page with Premier Lacrosse League branding: dark theme, Inter + Barlow Condensed, mobile-first.

## What's in the repo

| Path | What | Kind |
| --- | --- | --- |
| `apps/web` | Gamecast prototype: Next.js 16 (App Router, static export), React 19, Tailwind v4, TanStack Query | product |
| `packages/ui` | Atomic component library (atoms / molecules / organisms) + Storybook 10 | product |
| `packages/tokens` | Design tokens (DTCG JSON) -> CSS variables, Tailwind `@theme`, TS | product |
| `packages/data` | Data contract (zod), text-file DB, static API builder | product |
| `packages/scenarios`, `apps/lab` | Scenario Lab: fakes the API for the app running in an iframe | tooling only |

See [AGENTS.md](./AGENTS.md) for the architecture rules.

## Run it

Node >= 22 (`.nvmrc`), then `npm install` once.

```bash
npm run dev               # apps/web at http://localhost:3000 (builds the static API from packages/data first)
npm run build             # static export to apps/web/out
npm run storybook         # component library at http://localhost:6006
npm run build-storybook   # static Storybook to packages/ui/storybook-static
npm run tokens            # rebuild packages/tokens/dist from src/*.json
npm run typecheck         # all workspaces
```

Game pages live at `/ncaa/game/<gameId>/?tab=gamecast|stats|plays|highlights`.

The app reads its data from `NEXT_PUBLIC_API_BASE` (default `/api/v1`) + path + `NEXT_PUBLIC_API_SUFFIX`
(default `.json`, because the static API lives in `apps/web/public/api/v1/<path>.json`). See `apps/web/.env.example`.
