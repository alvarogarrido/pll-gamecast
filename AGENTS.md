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
- Polling (all decisions use server time): `/games/{id}` and the per-game endpoints refetch every 15 s while `live`. A scheduled/delayed game refetches `/games/{id}` every 60 s within 2 h of start and every 5 min before that, so it flips to live by itself. The scoreboard refetches every 60 s while any game is live or starts within 2 h.
- Tab state lives in the query string (`?tab=`), read client-side with `useSearchParams` inside `<Suspense>` (static export).

## Component conventions (`packages/ui`)

- Atomic design: `src/atoms` -> `src/molecules` -> `src/organisms`. Compose upward only; export everything from `src/index.ts`.
- **Plain props only.** No data fetching, no `next/*` imports, no app imports. Data comes in as props (types from `@pll/data/api` are fine).
  Components that need hooks start with `'use client'`; that is the only framework-specific line allowed.
- Style with Tailwind utilities that resolve to **tokens** (`bg-surface-card`, `text-text-secondary`, `border-border-default`, `rounded-md`,
  `text-footnote`, `font-display`, `gap-2.5`). No raw hex values or arbitrary colors. Spacing uses only the approved scale (see Tokens).
  Need something new? Add it to `packages/tokens/src/*.json` and run `npm run tokens`.
- Write complete class strings (variant maps), never build class names by concatenation, so Tailwind can see them. Join with `cn()`.
- Accessibility is part of done: semantic elements, visible focus (global `:focus-visible` ring), roles and keyboard support
  (see `Tabs`), `motion-safe:` for animation, decorative elements `aria-hidden`.
- Every component has a `*.stories.tsx` covering all variants, titled `Atoms/…`, `Molecules/…` or `Organisms/…` (see the folder and stories rules below).
  Controlled components keep their state inside the story.
- Mobile-first: design for 375px, then add `sm:` / `lg:`. Desktop gamecast body is 2 columns (40% / 60%) from `lg`.

### Folders, props and stories (read before adding a component)

- **One folder per component**: `src/<atoms|molecules|organisms>/<Name>/<Name>.tsx` + `<Name>.stories.tsx` + `index.ts` (`export * from './<Name>'`).
  Add the export (component and its prop types) to the layer barrel (`src/atoms/index.ts`, `molecules/index.ts`, `organisms/index.ts`); `src/index.ts`
  re-exports the layers. Import other components through their folder (`'../../atoms/Chip'`), never from the package root.
- **Props philosophy.**
  - Atoms take **primitives** (`string`, `number`, `boolean`, `ReactNode`); molecules and organisms may take the API ref types from `@pll/data/api`
    (`TeamRef`, `PlayerRef`, `GameSummary`...).
  - Prefer a few well-named props over a `variant` explosion: `size`, `tone`, `layout`, `side` (`'away' | 'home'`) and a `className` escape hatch. Spread
    native element props on the root where it makes sense (`ComponentPropsWithoutRef<'div'>`).
  - Away is always left, home always right. Components that mirror take `side`.
  - Components never format inline: call `lib/format.ts` (`pct`, `clock`, `statusLine`, `record`, `playerShortName`, `formatStat`...). Missing data renders `NO_VALUE` (an en dash),
    never `NaN%` or blank. Time helpers take `nowMs` (server time) and an optional `timeZone` (default `America/New_York`); `lib/format.ts` never reads the device clock.
  - Team color: wrap in `TeamScope` or pass `style={teamColorVars(primary, secondary)}` from `lib/team-style.ts`, then use `bg-team-primary` / `border-team-primary`.
    **On a dark surface (cards, the page) use `bg-team-primary-on-dark` / `border-team-primary-on-dark` / `fill-team-primary-on-dark` instead**: navy primaries
    (#0C2340, #003087) vanish on #1F1F1F. `teamColorVars` / `TeamScope` also set `--team-primary-on-dark` (the primary lightened, hue kept, to 3:1 contrast with
    `surface.card`, see `teamColorOnDark`). Where both teams of a game appear together, resolve them with `teamPairColors(away, home)` (look-alikes such as Duke and
    Notre Dame fall back to a secondary color) and pass the result as the third argument of `teamColorVars` / `TeamScope`'s `primaryOnDark` / a component's `color`.
    The `*-team-primary-on-dark` utility is defined in `packages/ui/src/styles.css` (derived from runtime data, so it is not a token).
- **Reuse the shared building blocks** instead of re-making them (organisms must not keep private copies of these). Icons and network logos come from
  `@pll/icons` (`<Icon name>`, `NetworkLogo`). Need a variation? Add a prop to the shared component rather than forking it. Before writing a sub-component
  inside an organism, check this list; if you build one that a second organism could use, put it in `atoms/` or `molecules/` (with a story) right away.
  - **Atoms**: `Card`, `Chip`, `StatusPill`, `TeamLogo`, `RankBadge`, `Skeleton`, `Tabs`, `LiveDot`, `PlayerAvatar`, `StatValue`, `NetworkBadge`, `TrendIndicator`,
    `MediaImage` (16:9 image with placeholder fallback), `FilterChip` + `FilterChipGroup` (single-choice pills, gold when selected; `pressed` or `radio` semantics),
    `ScoreChip` (running score "12–11").
  - **Molecules**: `SectionHeader`, `ComparisonRow`, `ComparisonBar`, `TeamIdentity`, `PlayerIdentity` (`trailing` slot for a stat beside it), `GameStatusLabel`,
    `TeamScope`, `Disclosure`, `DataTable*`, `EmptyState`, `PlayerCompare` (head-to-head of two players), `StatComparisonCard` (team logos either side of a title, then
    `ComparisonRow`s), `Carousel` / `CarouselRail` / `CarouselControls` / `useCarousel` (scroll-snap rail with prev/next), `TeamPercent` (team + percentage; `inline` or
    `tile`), `Linescore` (period box score), `WhereToWatch` (broadcast logos), `GameChip` (game as a link chip; `renderLink` for router links).
  - **`lib/`**: `format.ts` (`pct`, `clock`, `statusLine`, `relativeTimeLabel`...), `team-style.ts` (`teamColorVars`, `teamColorOnDark`, `teamPairColors`), `cn`.
- **Stories use real data.** Import `fixtures` and `GAMES` from `src/fixtures` (Storybook only, **never** import it from a component or the barrels):
  `fixtures.game(GAMES.liveQ4)`, `fixtures.stats(...)`, `fixtures.plays(...)`, `fixtures.at(id, elapsedSeconds)`. Cover every state (default, live, final,
  scheduled, missing/empty data, mirrored sides, sizes) and at least one story built from fixtures. Fixtures have no player photos and remote logos can fail offline: that is
  the fallback path, not a bug.
- **Token-only styling is enforced by review.** Utilities must resolve to tokens and the approved spacing scale (`gap-2.5` = 10px; no `p-1.5`, `p-7`...). No raw hex or
  arbitrary values (`bg-[#...]`, `w-[37px]`). If one is unavoidable (e.g. an inline `width: 43%` for a proportional bar), keep it in `style` and comment why.
  Hex colors in stories are fine as demo data.
- Tests: pure logic lives in `src/lib/*.ts` with a sibling `*.test.ts` (vitest, `npm run test -w @pll/ui`). Components are verified in Storybook.

## Tokens (`packages/tokens`)

- Source of truth: the approved decisions in `docs/design-decisions.md`, encoded as DTCG JSON in `src/`: `primitives.json` (`palette.*`, raw
  values) and `semantic.json` (`color.*`, aliases of primitives), plus type, radius, spacing, elevation and layout. Components use semantic tokens only.
- `npm run tokens` regenerates `dist/` (committed on purpose). Never edit `dist/` by hand. Naming, the Tailwind mapping, spacing and the team-color
  pattern are documented in `packages/tokens/README.md`; the Storybook page `Foundations/Tokens` renders every token from `dist/tokens.ts`.
- CSS variables are `--pll-<path>`; `theme.css` maps them to Tailwind namespaces, e.g. `color.text.secondary` -> `text-text-secondary`,
  `color.surface.page` -> `bg-surface-page`, `text.footnote` -> `text-footnote`, `radius.md` -> `rounded-md`. Tailwind's default palette, type scale,
  radii, shadows and font families are disabled.
- Fonts: Inter (UI) and Barlow Condensed (scores, clock, big numerals). `apps/web` loads them with `next/font/google`; Storybook via `preview-head.html`.
- Team colors are runtime data: set `style={{ '--team-primary': team.colors.primary }}` on a team scope and use `bg-team-primary` / `text-team-secondary`;
  on dark surfaces use the `*-team-primary-on-dark` utilities (see Component conventions): prefer `TeamScope` / `teamColorVars`, which set both variables.

## Scenario Lab (tooling, not product)

The Lab (`apps/lab` + `packages/scenarios`, see `apps/lab/README.md`) shows `apps/web` in an iframe and fakes `/api/v1/*.json` with a
service worker (served at `/lab-sw.js`), so designers can view start of season, pregame, any live moment, final, offline, slow or
failing API and missing data.

- It is **detached**: no lab, scenario or "demo mode" code in `apps/web`, `packages/ui`, `packages/tokens` or `packages/data`'s product
  surface, and never an import of `@pll/lab` / `@pll/scenarios` from them. The app must keep behaving correctly against any HTTP response
  (that is what the Lab exploits). If something truly cannot be simulated from outside, raise it instead of adding a hook to the app.
- Add a scenario in `packages/scenarios/src/presets.ts` (with a test); how-to in `apps/lab/README.md`.
- `npm run dev:lab` (next dev :3000 + Lab :5173, open `/lab/`), `npm run build:site` (prototype + `/lab/` + `/lab-sw.js` + `/storybook/`
  into `site/`, deployed by the root `vercel.json`), `npm run preview:site` (serve `site/` locally on :4173).
- Only nested iframes are faked; opening `/ncaa/game/<id>/` in a normal tab always shows the plain prototype.

## Commands

`npm run dev | build | storybook | build-storybook | tokens | typecheck | test` from the root, plus `dev:lab | build:site | preview:site` for the Lab (see README).
Before finishing a change: `npm run typecheck`, and for UI work `npm run build-storybook`.
