# Brief: Gamecast component batch (shared rules for every batch agent)

You build ORGANISMS of the Gamecast atomic library in `packages/ui`. Several batch agents run in parallel, so these rules exist to prevent collisions and drift.

## Read first
- `AGENTS.md`, especially "Component conventions".
- `docs/design-decisions.md` (approved tokens) and `packages/tokens/README.md` (utility names).
- `packages/ui/src/index.ts`: the existing atoms and molecules. **Reuse them; do not re-create equivalents.** If something reusable is missing, build it inside your own organism folder as a private sub-component and mention it in your report. Do not add new atoms or molecules to the shared folders.
- `packages/ui/src/lib/format.ts`: all formatting. Never format percentages, clocks or records by hand.
- `packages/ui/src/fixtures/index.ts`: stories MUST use `fixtures` and `GAMES` (real simulated data). Use `fixtures.at(GAMES.liveQ4, seconds)` to freeze a game at a moment.
- `packages/data/src/api.ts`: the API types. Organisms take these response types (or slices of them) as props.
- The PRD module spec: `docs/prd-gamecast.md`.

## Visual sources
- Screenshots of the designer's Figma, viewable with Read, in `/Users/alvaro.garrido/PLL/reference/figma-audit/a2ZkCVwyae2DcSj1sQOm1V/shot-*.png` and `/Users/alvaro.garrido/PLL/reference/figma-audit/Thl48WrAIIpauLCx7GUZjY/*.png` (the App "Gamehub Components" strip spec is `scores_gamehub-components.png`).
- Figma (optional, **max 8 calls per batch**): only fileKey `zVmzXfi3vTia4o8Apl1aoQ`. Load the `figma:figma-design-to-code` skill before calling `mcp__plugin_figma_figma__get_design_context`. You may also use `get_screenshot` (maxDimension ≤ 1024). Never use any other file key.
- Where your module has no Figma design, design it in the same visual language: dark cards, `surface.card` with a 1px `border.default` and `rounded-md`, `title3` uppercase section headers, `footnote` and `subhead` body text, Barlow Condensed for big numbers, gold for selection, green for live. The PLL web gamecast (stats.premierlacrosseleague.com) is the reference for layout and density.

## Rules
- Folders: `packages/ui/src/organisms/<Name>/<Name>.tsx` + `<Name>.stories.tsx` + `index.ts`. **Do NOT edit any barrel** (`src/index.ts`, `src/organisms/index.ts`, `src/atoms/index.ts`, `src/molecules/index.ts`). List your exports in the report and the coordinator wires them.
- Import shared pieces via relative paths to their folders (e.g. `../../molecules/ComparisonRow`), not via the root barrel, to avoid circular imports.
- Token utilities only: no raw hex, no arbitrary values unless unavoidable (then comment why). Team colors go through `TeamScope` / `teamColorVars`.
- Mobile-first, from 320px up. Each organism must also look right inside a desktop column of about 380px (40%) or about 580px (60%).
- Pure presentational React: no fetching, no Next imports, no `Date.now()`. Time arrives as a `nowMs` prop derived from `meta.serverTime`.
- States: each organism handles its own pregame / live / final differences and an empty/no-data state (use `EmptyState`). Provide a `Skeleton` loading variant via a `loading` prop or an exported `<Name>Skeleton`.
- Accessibility: semantic headings (organisms start at h2 via `SectionHeader`), labelled regions, keyboard-operable controls, `aria-live="polite"` only where content updates live (scores, latest play).
- Stories: one per meaningful state, using real fixture games: pregame (`GAMES.scheduled`), live (`GAMES.liveQ4`, `GAMES.liveQ2`), final (`GAMES.final`), plus edge cases (`GAMES.ncaa`, `GAMES.scheduledIndoor`, `GAMES.finalBlowout`). Add a `Mobile` story with the viewport set to 375px.
- Pure logic (selectors such as "top performer", "filter plays", "order games") lives in `packages/ui/src/organisms/<Name>/<name>.logic.ts` with vitest tests.
- Do NOT touch `apps/*`, `packages/data`, `packages/scenarios`, `packages/tokens` or `packages/icons`. No git commands, no `npm install`, and no broad `pkill`: stop only the PID you started.

## Verify before reporting
1. `npm run typecheck -w @pll/ui` and `npm test -w @pll/ui` pass. Ignore type errors that come from another batch's in-progress folder, but mention them.
2. Run Storybook on your assigned port (`npx storybook dev -p <port> --no-open` inside packages/ui). Open your stories in the built-in browser pane (`mcp__Claude_Browser__*`, loaded via ToolSearch) in YOUR OWN tab. Check them at 375px and desktop widths, fix what looks wrong, take one or two screenshots, then close your tab and kill your Storybook PID.
3. Report: the organisms with a one-line props API each, exports for the barrel, any private sub-components that probably belong in the shared folders, the Figma calls used, the screenshots checked, and open design questions for the designer.
