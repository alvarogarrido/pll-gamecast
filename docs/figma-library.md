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
