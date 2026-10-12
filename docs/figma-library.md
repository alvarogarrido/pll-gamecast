# Figma library: PLL Gamecast — Library

Figma mirror of the code tokens and icons (phase 1). Components come in phase 2.

- **File URL:** https://www.figma.com/design/iQNyjRz7KgcQmSDtw8kYSf
- **File key:** `iQNyjRz7KgcQmSDtw8kYSf`
- **Team:** Alvaro Javier Garrido Zambrano's team (Pro, `team::1302547626148469133`), account alvarogarridoz@gmail.com
- **Created:** 2026-10-13

Source of truth is the code: `packages/tokens/src/*.json` (resolved values in `packages/tokens/dist/tokens.ts`, CSS names in `dist/tokens.css`), `docs/design-decisions.md`, `packages/icons/src/svg/**`. Figma never leads; changes designed on the canvas are implemented in code first.

## Pages

| Page | Content |
|---|---|
| Cover | Title, subtitle, date, how-to-use note, page index |
| Foundations | Documented sheet (auto-layout): semantic + primitive swatches bound to the variables, type specimen, spacing, radius, elevation, "Team colors on dark" note |
| Icons | 91 `icon/*` components, 10 `logo/network/*` components, 7 `icon/weather/*` placeholders, in labelled grids |
| Atoms, Molecules, Organisms, Screens | Empty (phase 2) |
| Canvas (Alvaro) | Free design space |
| Archive | Retired work |

## Variables

Two collections, 59 variables. Every variable has explicit scopes and a WEB code syntax (`var(--pll-...)`, the real CSS name from `tokens.css`), so Dev Mode shows the code names.

### Primitives (mode `Value`, 34 variables)

| Code token (DTCG path) | Figma variable | CSS variable (codeSyntax WEB) | Scopes |
|---|---|---|---|
| `palette.white` / `black` / `coal` | `palette/white`, `palette/black`, `palette/coal` | `--pll-palette-white` / `-black` / `-coal` | none (hidden) |
| `palette.gray.{300,400,600,700,800,850,900}` | `palette/gray/<n>` | `--pll-palette-gray-<n>` | none (hidden) |
| `palette.gray.950` (alias of coal) | `palette/gray/950` (alias of `palette/coal`) | `--pll-palette-gray-950` | none (hidden) |
| `palette.gold`, `goldSubtle` | `palette/gold`, `palette/goldSubtle` | `--pll-palette-gold`, `--pll-palette-gold-subtle` | none (hidden) |
| `palette.green` / `red` / `blue` / `border` | `palette/green`, `palette/red`, `palette/blue`, `palette/border` | `--pll-palette-<name>` | none (hidden) |
| `spacing.{2,4,8,10,12,16,20,24,32,40}` | `space/<n>` | `--pll-spacing-<n>` | GAP, WIDTH_HEIGHT |
| `radius.{xs,sm,md,lg,pill}` | `radius/<name>` | `--pll-radius-<name>` | CORNER_RADIUS |
| `layout.gutter` | `layout/gutter` | `--pll-layout-gutter` | WIDTH_HEIGHT, GAP |
| `layout.pageMax` | `layout/pageMax` | `--pll-layout-page-max` | WIDTH_HEIGHT |

The palette has empty scopes on purpose: components go through Semantic, never the raw palette.

### Semantic (mode `Dark`, 25 variables)

Names are the code token path without the `color.` prefix, camelCase kept. Each aliases a Primitives variable unless noted.

| Code token | Figma variable | Aliases | CSS variable | Scopes |
|---|---|---|---|---|
| `color.surface.page` | `surface/page` | `palette/coal` | `--pll-color-surface-page` | FRAME_FILL, SHAPE_FILL |
| `color.surface.card` | `surface/card` | `palette/gray/900` | `--pll-color-surface-card` | FRAME_FILL, SHAPE_FILL |
| `color.surface.track` | `surface/track` | `palette/gray/850` | `--pll-color-surface-track` | FRAME_FILL, SHAPE_FILL |
| `color.surface.raised` | `surface/raised` | `palette/gray/800` | `--pll-color-surface-raised` | FRAME_FILL, SHAPE_FILL |
| `color.surface.chip` | `surface/chip` | `palette/gray/700` | `--pll-color-surface-chip` | FRAME_FILL, SHAPE_FILL |
| `color.surface.selected` | `surface/selected` | `palette/gray/600` | `--pll-color-surface-selected` | FRAME_FILL, SHAPE_FILL |
| `color.border.default` | `border/default` | `palette/border` | `--pll-color-border-default` | STROKE_COLOR |
| `color.border.hairline` | `border/hairline` | raw white, alpha 0.08 | `--pll-color-border-hairline` | STROKE_COLOR |
| `color.text.primary` | `text/primary` | `palette/white` | `--pll-color-text-primary` | TEXT_FILL, SHAPE_FILL |
| `color.text.secondary` | `text/secondary` | `palette/gray/300` | `--pll-color-text-secondary` | TEXT_FILL, SHAPE_FILL |
| `color.text.tertiary` | `text/tertiary` | `palette/gray/400` | `--pll-color-text-tertiary` | TEXT_FILL, SHAPE_FILL |
| `color.text.disabled` | `text/disabled` | `palette/gray/600` | `--pll-color-text-disabled` | TEXT_FILL, SHAPE_FILL |
| `color.text.onAccent` | `text/onAccent` | `palette/coal` | `--pll-color-text-on-accent` | TEXT_FILL, SHAPE_FILL |
| `color.accent.gold` | `accent/gold` | `palette/gold` | `--pll-color-accent-gold` | FRAME_FILL, SHAPE_FILL, TEXT_FILL |
| `color.accent.goldSubtle` | `accent/goldSubtle` | `palette/goldSubtle` | `--pll-color-accent-gold-subtle` | FRAME_FILL, SHAPE_FILL, TEXT_FILL |
| `color.status.live` | `status/live` | `palette/green` | `--pll-color-status-live` | FRAME_FILL, SHAPE_FILL, TEXT_FILL |
| `color.status.positive` | `status/positive` | `palette/green` | `--pll-color-status-positive` | FRAME_FILL, SHAPE_FILL, TEXT_FILL |
| `color.status.negative` | `status/negative` | `palette/red` | `--pll-color-status-negative` | FRAME_FILL, SHAPE_FILL, TEXT_FILL |
| `color.status.info` | `status/info` | `palette/blue` | `--pll-color-status-info` | FRAME_FILL, SHAPE_FILL, TEXT_FILL |
| `color.link` | `link` | `palette/blue` | `--pll-color-link` | TEXT_FILL, SHAPE_FILL |
| `color.live.tint` | `live/tint` | raw `#00CB83`, alpha 0.1 | `--pll-color-live-tint` | FRAME_FILL, SHAPE_FILL |
| `color.gold.tint` | `gold/tint` | raw `#FFCB06`, alpha 0.1 | `--pll-color-gold-tint` | FRAME_FILL, SHAPE_FILL |
| `color.negative.tint` | `negative/tint` | raw `#FA5050`, alpha 0.1 | `--pll-color-negative-tint` | FRAME_FILL, SHAPE_FILL |
| `color.team.primary` | `team/primary` | `palette/gray/600` | `--pll-color-team-primary` | FRAME_FILL, SHAPE_FILL, TEXT_FILL |
| `color.team.secondary` | `team/secondary` | `palette/gray/700` | `--pll-color-team-secondary` | FRAME_FILL, SHAPE_FILL, TEXT_FILL |

Notes on fidelity:

- **Alpha tokens are not aliases.** A Figma variable alias cannot carry alpha, so `border/hairline` and the three tints hold an rgba value (the same rgb as their source token). If `status/live`, `accent/gold`, `status/negative` or `palette/white` change, update these four by hand.
- **Text scopes include SHAPE_FILL** (the brief said TEXT_FILL only). Icons bind their fills to `text/primary`; without SHAPE_FILL, designers could not rebind an icon fill to a `text/*` color from the picker.
- **Team colors are runtime data**, not tokens. `team/primary` and `team/secondary` are only the neutral fallbacks, as in `semantic.json`.

## Text styles (14)

Fonts: Inter (`Regular`, `Medium`, `Semi Bold`, `Bold`) and Barlow Condensed (`SemiBold`, `ExtraBold`). Both are available in Figma; Barlow Condensed style names have no spaces, Inter's do. Letter spacing 0 everywhere. Style descriptions carry the code token and spec.

| Code token | Figma style | Font | Size / line height |
|---|---|---|---|
| `text.scoreHero` (score.hero) | `score/hero` | Barlow Condensed ExtraBold (800) | 48 / 48 |
| `text.score` | `score/default` | Barlow Condensed ExtraBold (800) | 32 / 32 |
| `text.scoreSm` (score.sm, D14) | `score/sm` | Barlow Condensed ExtraBold (800) | 24 / 24 |
| `text.clock` | `clock` | Barlow Condensed SemiBold (600) | 13 / 16 |
| `text.title1` | `title/title1` | Inter Semi Bold (600) | 28 / 34 |
| `text.title3` | `title/title3` | Inter Bold (700) | 20 / 25 |
| `text.headline` | `body/headline` | Inter Semi Bold (600) | 17 / 22 |
| `text.callout` | `body/callout` | Inter Regular (400) | 16 / 21 |
| `text.subhead` | `body/subhead` | Inter Regular (400) | 15 / 20 |
| `text.subhead` (fontWeightStrong) | `body/subhead-strong` | Inter Semi Bold (600) | 15 / 20 |
| `text.footnote` | `body/footnote` | Inter Regular (400) | 13 / 18 |
| `text.footnote` (fontWeightStrong) | `body/footnote-strong` | Inter Semi Bold (600) | 13 / 18 |
| `text.caption` | `body/caption` | Inter Medium (500) | 12 / 16 |
| `text.caption2` | `body/caption2` | Inter Medium (500) | 11 / 13 |

Not expressible in Figma: `clock` uses `tabular-nums` in code (Figma text styles cannot set OpenType numeric features via the API); `title3` is uppercased in code (`uppercase` utility), the Figma style is not. `fontFamily` fallbacks (`Arial Narrow`, `system-ui`, ...) have no Figma equivalent.

## Effect styles (2)

| Code token | Figma style | Value |
|---|---|---|
| `elevation.1` | `elevation/1` | drop shadow 0 0 12 0, #000 100% |
| `elevation.2` | `elevation/2` | drop shadow 0 2 12 0, #000 80% |

## Icons page

- `icon/<name>`: 91 components, 24x24, one per `packages/icons/src/svg/<name>.svg`. Every fill/stroke is bound to `text/primary` (rebind to recolor). Created with `figma.createNodeFromSvg`, then converted to components.
- Kept as exported (not bound): `icon/fire`, `icon/fire-frozen`, `icon/fire-frozen-empty` (multicolor). `icon/loading` is a gradient: its stops are white (alpha 1 to 0), not bound to a variable (Figma cannot bind a gradient stop with alpha 0 to a solid-color variable).
- `logo/network/<name>`: 10 components (abc/espn variants, `-color` and `-white`), native size (12x16, 32x16, 41x16, 43x16), kept as exported.
- `icon/weather/{clear,partly-cloudy,cloudy,rain,snow,wind,indoor}`: placeholders requested by the designer. 24x24 dashed outline, condition name in `body/caption2` in `text/tertiary` (rendered below the box, as 11px text does not fit inside 24px), description "Placeholder — designer will replace; code currently uses private glyphs in VenueInfo". Names match `Weather.condition` in `packages/data`.

## Re-sync when tokens change

The code is the source. After editing `packages/tokens/src/*.json` and running the tokens build (`packages/tokens/dist/tokens.ts` and `tokens.css` regenerate):

1. Diff `dist/tokens.css` against the tables above (new, renamed, removed or changed values).
2. In the Figma file, run a `use_figma` script that **updates by name**, never recreates:
   - find the variable with `figma.variables.getLocalVariablesAsync()` and match on `name`; change the value with `setValueForMode` (primitives) or re-alias (semantic); create missing ones with explicit `scopes` and `setVariableCodeSyntax('WEB', 'var(--pll-...)')`;
   - for text styles, match on `getLocalTextStylesAsync()` name and update `fontName`, `fontSize`, `lineHeight` (load the font first, check the exact style string with `listAvailableFontsAsync`);
   - for effect styles, match on `getLocalEffectStylesAsync()` name.
3. A removed token: delete the variable/style only after checking nothing in the file still uses it (Archive page first).
4. Re-check the alpha tokens (`border/hairline`, `live/tint`, `gold/tint`, `negative/tint`): they are raw rgba, not aliases.
5. Icons: when an SVG in `packages/icons/src/svg` changes or is added, rebuild only that component (`createNodeFromSvg`, `createComponentFromNode`, bind fills to `text/primary`, same name) and swap it into the grid. Keep the name identical so instances keep their link.
6. Update the Foundations swatch labels for any changed hex.
7. Run the `get_screenshot` check on Foundations and Icons.

Account guard: use alvarogarridoz@gmail.com and the Pro team above only (see `.claude/skills/pll-account-guard`). Starter teams and drafts are capped at 6 MCP calls per month.

## Build log

- Figma MCP calls used for phase 1: **20** = 2 `whoami` (start and resume) + 1 `create_new_file` + 13 `use_figma` (inspect, pages + variables, text/effect styles, Foundations x2, Icons x3, resume inventory, Cover, white-fill fix, weather fix, verification screenshots) + 4 `get_screenshot`.
- Counts: 9 pages, 2 collections, 59 variables (34 primitives, 25 semantic), 14 text styles, 2 effect styles, 108 components (91 icons, 10 logos, 7 weather placeholders).

## Screens

Reference captures of the deployed prototype (https://pll-gamecast.vercel.app, plain Gamecast pages, not the Lab) on the **Screens** page (`2:7`), captured 2026-10-13. They are raw frames from the capture tool: **not linked to components or variables**, meant for the designer to annotate and redesign on. Re-capture after code changes.

### Method

`generate_figma_design` (live-URL capture) worked for all pages. The tool only documents a Playwright route for external URLs, and Playwright MCP is not installed here, so the capture script was injected by hand through the built-in browser pane (`mcp__Claude_Browser__*`):

1. `generate_figma_design` with `fileKey` and `nodeId` = board `11:2` returns a single-use `captureId` (one call per page; several can be generated up front).
2. In a pane tab: `resize_window` to 375x812 (mobile) or 1440x900 (desktop), `navigate` to the page, then `javascript_tool` loads `https://mcp.figma.com/mcp/html-to-design/capture.js` as a `<script>` and calls `window.figma.captureForDesign({ captureId, endpoint: 'https://mcp.figma.com/mcp/capture/<captureId>/submit?bindVariables=true', selector: 'body' })` **without awaiting it** (the promise never settles in a hidden pane and a blocking call hits the 45 s tool timeout).
3. Poll `generate_figma_design` with the same `captureId` until it reports completed. It stays `pending` for a minute or more; keep polling.
4. Gotchas: the pane resets its emulated viewport after a while (check `innerWidth` is 375 or 1440 right before firing; the capture is serialized with whatever the width is at that time). The pane allows only a few tabs, so captures run about three at a time. Captured frames land at page level (not inside the board); a `use_figma` call then `appendChild`s them into the board, positions them and adds the labels. Set `clipsContent = true` on each frame (captures leave it off and carousels spill outside).

### Layout

Board `11:2` "Screens board", fill bound to `surface/page`. Note frame `11:3` at the top. Labels are text nodes above each frame (state, width, source URL, capture date), bound to `text/primary` and `text/secondary`.

| Row | Pregame (Yale at Princeton) | Live Q4 (Duke at Notre Dame) | Final (Penn at Cornell) |
|---|---|---|---|
| Mobile 375 | `12:2` | `14:2` | `15:2` |
| Desktop 1440 | `23:2` (captured at 1297 px, see note) | `20:2` | `21:2` |

Tabs (mobile), row 3: Live `?tab=stats` `16:2`, Live `?tab=plays` `18:2`, Final `?tab=highlights` `19:2` (378 px wide: the page overflows 3 px horizontally in the capture).

Sources: pregame `/ncaa/game/5490a6eb-2cf6-4841-94ff-f7d2384c0d7e/`, live `/ncaa/game/da8f8b81-2201-47b1-b0a3-94aa63f19948/`, final `/ncaa/game/531c71d4-db8a-4f11-9d1b-db4eea1dea85/`.

### Re-capture

Replace a frame, do not duplicate: capture (steps above), move the new frame into the board at the old frame's x/y, copy the old name, delete the old frame, update the node ids in this table. Pages are fixture data, so a re-capture of a "live" game will show the game state at that moment.

Note: the Pregame desktop frame `23:2` is 1297 px wide, not 1440. The pane's emulated viewport reset before that capture was serialized, and the 1440 re-captures stayed `pending`. Re-capture it at 1440 (see steps above) and replace `23:2`.

## Components (phase 2)

The Atoms, Molecules and Organisms pages each hold one documented sheet (`Atoms — sheet` 1200 wide, `Molecules — sheet` 1200, `Organisms — sheet` 1400): a page header, then one section per component with the code path, a description (props <-> code) and the component set. Every component and set carries a description (Dev Mode shows it), the variant property names equal the code props (`tone`, `size`, `side`, `layout`, `selected`, ...), and the layer names are stable (`label`, `value`, `name`, `abbreviation`...) so instances can be overridden by name.

Rules followed: auto-layout on every container (the chart canvas and the avatar silhouette are the only fixed-geometry frames); fills, strokes, radius, padding and gap are bound to the Primitives/Semantic variables (`surface/*`, `border/*`, `text/*`, `radius/*`, `space/*`); text always uses a file text style; molecules are built from instances of atoms, organisms from instances of atoms and molecules; icons and network logos are instances of the Icons page components.

Node ids (file `iQNyjRz7KgcQmSDtw8kYSf`, page ids Atoms `2:4`, Molecules `2:5`, Organisms `2:6`):

### Atoms (15 entries: 13 component sets + 2 components, 88 variants, sheet `17:2`)

| Component | Node id | Variant properties | Code path |
|---|---|---|---|
| Chip | `17:59` | tone (8), size (sm, md); text `label` | `packages/ui/src/atoms/Chip` |
| LiveDot | `17:69` | size (sm, md) | `atoms/LiveDot` |
| StatusPill | `17:88` | status (scheduled, live, halftime, final) | `atoms/StatusPill` |
| RankBadge | `17:145` | kind (rank, seed, rpi), change (none, up, down) | `atoms/RankBadge` |
| TrendIndicator | `22:36` | direction (up, down, equal), size (sm, md); text `value` | `atoms/TrendIndicator` |
| ScoreChip | `17:200` | emphasis (none, away, home); texts `away`, `home` | `atoms/ScoreChip` |
| TeamLogo | `22:72` | size (xs, sm, md, lg, xl), ring (team, neutral) | `atoms/TeamLogo` |
| PlayerAvatar | `22:108` | size (sm, md, lg), state (photo, silhouette, initials) | `atoms/PlayerAvatar` |
| StatValue | `22:126` | highlighted (false, true), size (sm, md); text `value` | `atoms/StatValue` |
| FilterChip | `22:146` | selected (false, true), count (false, true); texts `label`, `count` | `atoms/FilterChip` |
| Tabs/Item | `22:164` | look (segmented, underline), selected (false, true); text `label` | `atoms/Tabs` |
| Tabs | `22:174` | single component (track + 4 Tabs/Item instances) | `atoms/Tabs` |
| NetworkBadge | `22:227` | network (espn, espn2, espn-plus, abc, espn-app, text), variant (white, color); logos are instances of `logo/network/*` | `atoms/NetworkBadge` |
| Card | `22:251` | tone (card, raised, track), bordered (true, false) | `atoms/Card` |
| MediaImage | `22:260` | single component (16:9 placeholder) | `atoms/MediaImage` |

### Molecules (13 component sets, 64 variants, sheet `25:2`)

| Component | Node id | Variant properties | Code path |
|---|---|---|---|
| SectionHeader | `25:24` | action (none, chevron, link); text `title` | `packages/ui/src/molecules/SectionHeader` |
| ComparisonRow | `25:62` | leader (away, home, none) | `molecules/ComparisonRow` |
| ComparisonBar | `25:85` | showLabel (true, false) | `molecules/ComparisonBar` |
| TeamIdentity | `25:223` | layout (inline, stacked), side (away, home), size (sm, md, lg) | `molecules/TeamIdentity` |
| PlayerIdentity | `25:301` | layout (inline, stacked), side (away, home), size (sm, md) | `molecules/PlayerIdentity` |
| Linescore | `26:361` | periods (4, OT) | `molecules/Linescore` |
| GameStatusLabel | `26:419` | variant (pill, stacked, text), status (scheduled, live, halftime, final) | `molecules/GameStatusLabel` |
| GameChip | `26:555` | state (pre, live, final), current (false, true) | `molecules/GameChip` |
| WhereToWatch | `26:591` | size (md, sm) | `molecules/WhereToWatch` |
| TeamPercent | `26:665` | layout (inline, tile), side (away, home), highlighted (false, true) | `molecules/TeamPercent` |
| StatComparisonCard | `28:240` | footer (false, true); text `title` | `molecules/StatComparisonCard` |
| PlayerCompare | `28:323` | state (both, home-empty) | `molecules/PlayerCompare` |
| Disclosure | `28:345` | open (false, true); text `title` | `molecules/Disclosure` |

### Organisms (23 entries: 12 component sets + 11 components, 40 variants, sheet `30:2`; mobile 375 wide, desktop band 1200)

| Component | Node id | Variant properties | Code path |
|---|---|---|---|
| HeaderBar | `30:712` | variant (full, minimized, desktop-band) x phase (pre, live, final) = 9 | `packages/ui/src/organisms/HeaderBar` |
| OtherGamesBar | `32:475` | single (3 GameChip instances) | `organisms/OtherGamesBar` |
| SectionSelector | `32:506` | phase (pre, live) | `organisms/SectionSelector` |
| TopPerformers | `32:643` | single | `organisms/TopPerformers` |
| KeyTeamStats | `32:899` | phase (pre, game) | `organisms/KeyTeamStats` |
| PlayRow | `33:780` | type (goal, micro), density (card, flat) | `organisms/PlayByPlay/PlayRow` |
| LatestPlays | `33:954` | single (5 flat PlayRow instances) | `organisms/LatestPlays` |
| LiveInsights/Card | `33:1022` | kind (latest, older), subject (player, team) | `organisms/LiveInsights` |
| LiveInsights | `33:1068` | single (section card) | `organisms/LiveInsights` |
| WinProbabilityChart | `34:910` | single, static vector, illustrative | `organisms/WinProbabilityChart` |
| InjuryReport/Row | `34:976` | status (out, doubtful, questionable, day_to_day) | `organisms/InjuryReport` |
| InjuryReport | `34:1026` | single | `organisms/InjuryReport` |
| PreviousResults/Row | `34:1058` | result (W, L) | `organisms/PreviousResults` |
| PreviousResults | `34:1152` | single | `organisms/PreviousResults` |
| ConferenceStandings | `36:1097` | single | `organisms/ConferenceStandings` |
| WinPredictions | `36:1206` | single | `organisms/WinPredictions` |
| VenueInfo | `36:1273` | variant (card, inline), weather (outdoor, indoor) | `organisms/VenueInfo` |
| ArticleExcerpt | `37:1089` | kind (preview, recap) | `organisms/ArticleExcerpt` |
| HighlightsCarousel/Item | `37:1124` | selected (false, true) | `organisms/HighlightsCarousel` |
| HighlightsCarousel | `37:1165` | single | `organisms/HighlightsCarousel` |
| GameFlow/Row | `37:1218` | inProgress (false, true) | `organisms/GameFlow` |
| GameFlow | `37:1324` | single (4 rows + Score Info) | `organisms/GameFlow` |
| AdSlot | `37:1341` | size (skyscraper, rectangle, mobile-bar) | `organisms/AdSlot` |

Sample content: Duke at Notre Dame (live, Q4 2:23, 12-12), Penn at Cornell (final 8-11), Yale at Princeton (pregame). Names, ranks, records, venues, weather, articles, videos, insights, injuries and staff picks come from `packages/data/db`; stat numbers (comparison rows, secondary player stats, win-probability series, Yale/Princeton last-3 scores, OT linescore) are illustrative.

### Simplifications and known gaps

- **Team colors are runtime data.** Components bind rings/segments to the neutral `team/primary` / `team/secondary` fallbacks; instances in the organisms carry literal on-dark team colors (Duke `#2A62E8`, Notre Dame `#C99700`, Yale `#3F86D6`, Princeton `#FF8F00`, Penn `#4A6FD8`, Cornell `#E04A4A`: approximations of `teamColorOnDark`, not computed). The desktop band wash and strip are literal gradients/fills (gradients cannot bind variables).
- **Logos and photos** are monogram/silhouette placeholders (`createImageAsync` is not available): replace the circle fill with an image fill. NetworkBadge uses the real `logo/network/*` components; weather uses the `icon/weather/*` placeholders.
- **Charts are static vectors**: WinProbabilityChart is an illustrative drawing (no scrub tooltip, no overtime/final header variants); GameFlow lanes are fixed cells (hide/show to change counts).
- **Type tokens missing from Figma:** `score.display` (84) and `clock.lg` (34) are not text styles yet; the desktop band uses `score/hero` and `clock` with a size override. Chip, RankBadge and similar semibold captions use `body/caption` (Medium). `GameChip`, `PreviousResults/Row` scores use `score/sm` (code: Barlow 17-18 bold, no token).
- **Not drawn:** skeleton/loading states, empty states, hover/focus, animation (LiveDot pulse), the pinned AdSlot flag, period dividers in PlayRow, carousel scroll behavior. Responsive variants beyond 375 and 1200 are not built (the code switches on container width).
- Hidden layers (`visible=false`) are used for optional parts (second WhereToWatch box, hidden TeamIdentity record/rank, GameFlow cells).

### Re-sync

Same rule as tokens: code leads. When a component changes, update the matching component set by name/id (keep names so instances survive); add new props as variant properties with the code prop name; note the change here. Layer names to keep: `label`, `value`, `name`, `meta`, `abbreviation`, `title`, `clock`, `score`.

### Build log (phase 2)

Figma MCP calls: **33** = 1 `whoami` + 20 `use_figma` (1 inspect, 1 re-inspect, 2 Atoms, 5 Molecules, 8 Organisms, 3 fix/count passes; 4 of them failed on a script error and were retried, the failed runs left no partial nodes) + 12 `get_screenshot`. Counts: Atoms 15 entries (13 sets, 2 components, 88 variants), Molecules 13 sets (64 variants), Organisms 23 entries (12 sets, 11 components, 40 variants): 51 component entries (192 variants inside the sets + 13 single components).
