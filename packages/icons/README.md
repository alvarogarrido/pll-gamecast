# @pll/icons

Gamecast icon set and broadcast network logos, exported from Figma and generated into typed React components.

```tsx
import { Icon, GoalIcon, NetworkLogo, type IconName } from '@pll/icons';

<GoalIcon size={20} title="Goal" className="text-accent" />   // role="img" + <title>
<Icon name="trophy-filled" />                                  // by name, decorative (aria-hidden)
<NetworkLogo network="espn" variant="white" height={20} title="ESPN" />
```

- **Icons**: 24x24 viewBox, glyph colour is `currentColor` (follows text colour). Props: `size` (default 24), `title` (sets `role="img"` + `<title>`; otherwise `aria-hidden="true"`), plus any `<svg>` prop.
- **`IconName`** is a union of all kebab-case names; `icons` maps name to component; `iconNames` is the list; `multicolorIcons` lists the glyphs that ignore `currentColor`.
- **`NetworkLogo`**: `network` (`abc | espn | espn-plus | espn2 | espn-app`), `variant` (`'white' | 'color'`, default `color`), `height` (px, default 16, width follows the real aspect ratio). Colours are baked in. `white` is for dark surfaces.
- Naming: file/name is the Figma name in kebab-case; the **Filled** style gets a `-filled` suffix (`trophy-filled`); Regular and single-style icons have none.

## Source of truth (Figma)

| | |
|---|---|
| File | "PLL v2 - Library (Copy)(Copy)", fileKey `zVmzXfi3vTia4o8Apl1aoQ` (never use the quota-capped keys `a2ZkCVwyae2DcSj1sQOm1V` / `kTBZXPbB653kbEm0rHC5wa`) |
| Icons | component set `18:4038` (0:1 > Icons), 24x24 variants, `Theme=Light|Color`, `Style=Filled|Regular` |
| Network Logos | component set `18:7733`, 12-43 x 16 variants, `Color=White|Color|Grayscale|...` |

Every icon below was exported from its `Theme=Light` variant (Fire* are `Theme=Color`, the only multi-colour glyphs). The node ids are COMPONENT variant ids inside the sets above and are listed in `scripts/manifest.json`.

## Re-export from Figma

Figma access is read-only. The exports run in a single `use_figma` call per ~20KB batch (it only calls `node.exportAsync({format: 'SVG_STRING'})`).

1. Edit `scripts/manifest.json` (node id, kebab-case name, Figma name). Look ids up in the set children list (`figma.getNodeByIdAsync('18:4038')` then `.children`).
2. Run `scripts/figma-export.snippet.js` through the Figma MCP `use_figma` tool against fileKey `zVmzXfi3vTia4o8Apl1aoQ`. Repeat with `START = next` until all ids are exported. The glyphs come out as `fill="white"`; the snippet strips it so the `<svg fill="currentColor">` shell colours them.
3. Write each result to `src/svg/<name>.svg` wrapped in `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">…</svg>`. Exceptions: strokes (`stroke="white"` -> `currentColor` plus `fill="none"`, see `calendar`), gradient stops (`stop-color="white"` -> `currentColor`, see `loading`), a useless 24x24 clip-path wrapper (`fullscreen`) and multi-colour glyphs (keep their hex fills).
4. Network logos go to `src/svg/network/<network>-<white|color>.svg`, real colours kept (no `currentColor`), `viewBox` kept (e.g. `0 0 32 16`), no width/height.
5. Normalise: `npm run optimize -w @pll/icons` (= `npx svgo -f src/svg -r --config svgo.config.mjs`; keeps the viewBox, strips ids/metadata, 2-decimal precision).
6. Regenerate components: `npm run generate -w @pll/icons` (writes `src/generated/*.tsx`; never edit those by hand). Then `npm run typecheck -w @pll/icons && npm test -w @pll/icons`.

`scripts/generate.mjs` has no dependencies: it parses the svgo-normalised SVGs, converts them to JSX, and detects multi-colour icons automatically (any literal colour other than `currentColor`/`none`/`url()`).

## Notes and gaps

- **Multi-colour (ignore `currentColor`)**: `fire`, `fire-frozen`, `fire-frozen-empty` (`fire-frozen-empty` is drawn in white at 10% opacity plus light blue, meant for dark surfaces). `loading` uses a `currentColor` gradient, so it still follows the text colour.
- **ESPN+ and ESPN2 have no `Color` variant in Figma** (only White and Grayscale). `espn-plus-color.svg` and `espn2-color.svg` are the White artwork recoloured to ESPN red `#F51825` (same value as the real ESPN Color variant). Replace them if design adds the variants.
- ESPN App `color` is a white tile with a red monogram, as in Figma, so it needs a non-white background to read as a tile.
- Not in the Figma Icons set: wifi-off/offline, refresh (`loading` is the closest spinner), weather, a dedicated injury glyph (`plaster` and `cross-filled` are the medical candidates). `location-arrow` is the Figma "Locatio[sic]" variant (a navigation/locate icon).
- Several Figma variants carry only `Theme` (no `Style`); those are exported as single-style names.

## Icons (91)

| Name | Figma variant | Node id |
|---|---|---|
| `goal` | Goal | `18:4108` |
| `whistle` | Whistle (Regular) | `18:4104` |
| `helmet-filled` | Helmet (Filled) | `18:4098` |
| `jersey` | Jersey | `18:4112` |
| `lacrosse-head` | Lacrosse Head | `18:4143` |
| `lacrosse-field` | Lacrosse Field | `18:4163` |
| `highlights` | Highlights | `18:4088` |
| `standings` | Standings | `18:4225` |
| `stats` | Stats | `18:4051` |
| `leaderboard-filled` | Leaderboard (Filled) | `1453:39973` |
| `trend-up` | Trend Up | `18:4072` |
| `trend-down` | Trend Down | `2225:46724` |
| `trend-equal` | Trend Equal | `2225:46934` |
| `pos-attack` | Pos Attack (Regular) | `397:17774` |
| `pos-attack-filled` | Pos Attack (Filled) | `397:18004` |
| `pos-midfield` | Pos Midfield (Regular) | `397:18247` |
| `pos-midfield-filled` | Pos Midfield (Filled) | `397:18249` |
| `pos-defense` | Pos Defense (Regular) | `401:18258` |
| `pos-defense-filled` | Pos Defense (Filled) | `401:18263` |
| `pos-goalie` | Pos Goalie (Regular) | `401:18269` |
| `pos-goalie-filled` | Pos Goalie (Filled) | `401:18272` |
| `pos-fo` | Pos FO (Regular) | `402:18283` |
| `pos-fo-filled` | Pos FO (Filled) | `402:18298` |
| `pos-all` | Pos All (Regular) | `630:17942` |
| `pos-all-filled` | Pos All (Filled) | `630:22466` |
| `play-filled` | Play (Filled) | `18:4177` |
| `play-next-filled` | Play Next (Filled) | `11704:136561` |
| `play-next` | Play Next (Regular) | `11704:136574` |
| `play-prev` | Play Prev (Regular) | `11704:136583` |
| `play-prev-filled` | Play Prev (Filled) | `11704:136568` |
| `pause-filled` | Pause (Filled) | `11704:19291` |
| `cc` | CC (Regular) | `11704:136843` |
| `fullscreen` | Fullscreen (Regular) | `2265:50737` |
| `clock` | Clock | `18:4437` |
| `location` | Location | `18:4433` |
| `location-arrow` | Locatio[sic] (Regular) | `2268:52294` |
| `map` | Map (Regular) | `2805:42681` |
| `seat` | Seat | `18:4408` |
| `ticket-filled` | Ticket (Filled) | `18:4274` |
| `ticket` | Ticket (Regular) | `18:4278` |
| `vote` | Vote | `18:4414` |
| `thumbs-up` | Thumbs Up | `5476:3796` |
| `thumbs-down` | Thumbs Down | `5476:3797` |
| `chat` | Chat | `18:4426` |
| `espn` | ESPN | `18:4419` |
| `chevron-right` | Chevron Right (Regular) | `18:4341` |
| `chevron-right-double` | Chevron Right x2 (Regular) | `49:2681` |
| `chevron-left` | Chevron Left (Regular) | `18:4345` |
| `chevron-down` | Chevron Down | `18:4349` |
| `chevron-up` | Chevron Up | `18:4353` |
| `arrow-right` | Arrow Right (Regular) | `18:4282` |
| `arrow-left` | Arrow Left (Regular) | `18:4286` |
| `arrow-up` | Arrow Up | `18:4323` |
| `arrow-down` | Arrow Down | `18:4327` |
| `arrow-open` | Arrow Open (Regular) | `18:4290` |
| `arrow-up-right` | Arrow Up Right (Regular) | `3264:20756` |
| `close` | Close (Regular) | `18:4253` |
| `menu` | Menu | `18:4257` |
| `info` | Info | `18:4449` |
| `circle-info` | Circle-Info (Regular) | `1070:28072` |
| `check` | Check (Regular) | `18:4314` |
| `circle-check` | Circle-Check (Regular) | `18:4318` |
| `circle-check-filled` | Circle-Check (Filled) | `2576:42325` |
| `circle-x` | Circle-X (Regular) | `3922:42005` |
| `circle-x-filled` | Circle-X (Filled) | `3922:65651` |
| `circle-error` | Circle-Error (Regular) | `18:4362` |
| `circle-help` | Circle-? (Regular) | `4066:5301` |
| `circle-help-filled` | Circle-? (Filled) | `4066:51580` |
| `circle-empty` | Circle-Empty (Regular) | `2576:33021` |
| `lock` | Locked | `18:4384` |
| `fire` | Fire (Color, Filled) | `18:4471` |
| `fire-frozen` | Fire Frozen (Color, Filled) | `18:4476` |
| `fire-frozen-empty` | Fire Frozen Empty (Color, Filled) | `18:4482` |
| `trophy-filled` | Trophy (Filled) | `18:4331` |
| `trophy` | Trophy (Regular) | `18:4335` |
| `share` | Share | `18:4298` |
| `search` | Search | `18:4249` |
| `settings` | Gear | `18:4261` |
| `bell` | Bell | `18:4294` |
| `calendar-filled` | Calendar (Filled) | `18:4191` |
| `calendar` | Calendar (Regular) | `2265:49961` |
| `calendar-week` | Calendar-Week (Regular) | `2265:49965` |
| `plaster` | Plaster (Regular) | `830:17492` |
| `cross-filled` | Cross (Filled) | `830:17633` |
| `loading` | Loading (Regular) | `1251:34464` |
| `filters` | Filters (Regular) | `246:8715` |
| `sort` | Sort (Regular) | `246:8708` |
| `swap` | Swap (Regular) | `18:4441` |
| `ellipsis` | Ellipsis | `18:4310` |
| `star` | Star (Regular) | `18:4269` |
| `star-filled` | Star (Filled) | `2084:34890` |

## Network logos (8)

| Network | Variant | Figma variant | Node id |
|---|---|---|---|
| `abc` | `white` | ABC / White | `18:7734` |
| `abc` | `color` | ABC / Color | `2703:40907` |
| `espn-plus` | `white` | ESPN+ / White | `18:7750` |
| `espn2` | `white` | ESPN 2 / White | `18:7760` |
| `espn` | `white` | ESPN / White | `18:7768` |
| `espn` | `color` | ESPN / Color | `2703:40791` |
| `espn-app` | `white` | ESPN_App / White | `18:7776` |
| `espn-app` | `color` | ESPN_App / Color | `18:7779` |
| `espn-plus` | `color` | derived (no Figma variant) | |
| `espn2` | `color` | derived (no Figma variant) | |
