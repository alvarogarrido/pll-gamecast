# AGENTS.md

Guide for developers and AI agents working in this monorepo (npm workspaces).

## Architecture

```
packages/tokens   DTCG JSON -> dist/tokens.css (:root vars), dist/theme.css (Tailwind @theme), dist/tokens.ts
packages/ui       @pll/ui: atoms / molecules / organisms, plain props, Storybook. Depends on tokens only.
packages/data     THE data contract (zod schemas, API types), text-file DB, static API builder.
apps/web          @pll/web: product code. Next.js App Router, `output: 'export'`. Uses ui, tokens and data types.
packages/scenarios + apps/lab   Scenario Lab (tooling). Fakes the API with a service worker, runs apps/web in an iframe.
```

Rules that define the project:

1. **`apps/web` is production-shaped product code.** No scenario, mock, settings or "demo mode" code in it, ever. It fetches
   through the typed client in `apps/web/src/api` and nothing else.
2. **`apps/lab` and `packages/scenarios` are tooling. Never import them from product code** (`apps/web`, `packages/ui`,
   `packages/tokens`). The Lab drives the app from the outside by intercepting HTTP, so the app must "just fetch normally".
3. **The data contract lives in `packages/data`** (`src/api.ts` for responses, `src/schema.ts` for domain types). Import types from
   `@pll/data/api`. Do not redeclare or edit response shapes in the app or in the UI package.
4. **Server time, not device time.** Every response has `meta.serverTime`. Use `useServerNow()` (`apps/web/src/api/queries.ts`)
   for countdowns, "x ago" and live state. `Date.now()` and `new Date()` are blocked by ESLint in `apps/web`.
5. **API URLs are built in one place**: `apps/web/src/api/config.ts` (`apiUrl(path) = API_BASE + path + API_SUFFIX`).
   Static files live at `apps/web/public/api/v1/<path>.json`; a real backend would set `NEXT_PUBLIC_API_SUFFIX=''`.

### apps/web layout

- `src/api/` `config.ts` (URLs), `client.ts` (typed `ApiError`: `offline | network | http | parse | schema`, optional zod validation in dev),
  `queries.ts` (one TanStack Query hook per endpoint, `useServerNow`), `server-clock.ts`.
- `src/features/<feature>/` screens and PRD modules (`OtherGamesBar`, `HeaderBar`, `SectionSelector`, Gamecast body).
- `src/components/` app-level building blocks, including the loading / error / offline / empty states (`QueryBoundary`, `components/states/*`).
  Every data-driven module must render through `QueryBoundary` so all four states exist.
- `src/lib/static-params.ts` build-time game ids for `generateStaticParams` (reads `packages/data/db/games.json`).
- Polling: the game, scoreboard and per-game endpoints refetch every 15 s only while the game is `live`.
- Tab state lives in the query string (`?tab=`), read client-side with `useSearchParams` inside `<Suspense>` (static export).

## Component conventions (`packages/ui`)

- Atomic design: `src/atoms` -> `src/molecules` -> `src/organisms`. Compose upward only; export everything from `src/index.ts`.
- **Plain props only.** No data fetching, no `next/*` imports, no app imports. Data comes in as props (types from `@pll/data/api` are fine).
  Components that need hooks start with `'use client'`; that is the only framework-specific line allowed.
- Style with Tailwind utilities that resolve to **tokens** (`bg-surface-card`, `text-text-secondary`, `rounded-md`, `text-team-name`).
  No raw hex values or arbitrary colors. Need something new? Add it to `packages/tokens/src/*.json` and run `npm run tokens`.
- Write complete class strings (variant maps), never build class names by concatenation, so Tailwind can see them. Join with `cn()`.
- Accessibility is part of done: semantic elements, visible focus (global `:focus-visible` ring), roles and keyboard support
  (see `Tabs`), `motion-safe:` for animation, decorative elements `aria-hidden`.
- Every component has a `*.stories.tsx` covering all variants, titled `Atoms/…`, `Molecules/…` or `Organisms/…`.
  Controlled components keep their state inside the story.
- Mobile-first: design for 375px, then add `sm:` / `lg:`. Desktop gamecast body is 2 columns (40% / 60%) from `lg`.

## Tokens (`packages/tokens`)

- Source of truth: DTCG JSON in `src/`. Provisional values from the PLL web gamecast until the Figma audit replaces them.
- `npm run tokens` regenerates `dist/` (committed on purpose). Never edit `dist/` by hand.
- CSS variables are `--pll-<path>`; `theme.css` aliases them to Tailwind namespaces 1:1, e.g. `color.text.secondary` -> `text-text-secondary`,
  `color.surface.page` -> `bg-surface-page`, `text.teamName` -> `text-team-name`. Tailwind's default palette and radii are disabled.

## Commands

`npm run dev | build | storybook | build-storybook | tokens | typecheck` from the root (see README).
Before finishing a change: `npm run typecheck`, and for UI work `npm run build-storybook`.
