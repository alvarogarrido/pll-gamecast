# @pll/tokens

Design tokens for the Gamecast, in [DTCG](https://www.designtokens.org/) JSON. Values are the approved set in
[`docs/design-decisions.md`](../../docs/design-decisions.md); change the doc and the JSON together.

```
npm run tokens        # (root) = npm run build -w @pll/tokens, regenerates dist/ (committed on purpose)
```

| Source (`src/`) | Layer | Contents |
|---|---|---|
| `primitives.json` | 1 raw | `palette.*`: gray ramp (300, 400, 600, 700, 800, 850, 900, 950), white, black, coal, gold, goldSubtle, green, red, blue, border |
| `semantic.json` | 2 semantic | `color.*`: surface, border, text, accent, status, link, tints, team. Every value is a `{palette.*}` alias |
| `typography.json` | | `font.family.{sans,display}` and the `text.*` scale |
| `radius.json`, `spacing.json`, `elevation.json`, `layout.json` | | the rest |

Components use **semantic** tokens only. Primitives exist so the semantic layer has something to point at (and to retheme later).

| Output (`dist/`) | What |
|---|---|
| `tokens.css` | every token as `--pll-<path>` on `:root`. Aliases stay linked: `--pll-color-surface-card: var(--pll-palette-gray-900)` |
| `theme.css` | Tailwind v4 `@theme` mapping + resets (below) |
| `tokens.ts` | resolved `tokens` tree, `cssVars`, `cssVar(path)` and the flat `tokenList` (used by the Storybook docs page) |

## Tailwind utilities

Tailwind's default palette, type scale, radii, shadows and font families are reset (`--color-*: initial` and so on): only tokens exist.

| Token | Utility |
|---|---|
| `color.surface.card` | `bg-surface-card` |
| `color.text.secondary` | `text-text-secondary` |
| `color.border.default`, `color.border.hairline` | `border-border-default`, `border-border-hairline` |
| `color.accent.gold`, `color.text.onAccent` | `bg-accent-gold`, `text-text-on-accent` |
| `color.status.live` / `positive` / `negative` / `info`, `color.link` | `text-status-live`, `bg-status-negative`, `text-link` ... |
| `color.live.tint`, `color.gold.tint`, `color.negative.tint` | `bg-live-tint`, `bg-gold-tint`, `bg-negative-tint` (10% alpha) |
| `radius.xs` 4, `sm` 8, `md` 10, `lg` 20, `pill` 999 | `rounded-xs` ... `rounded-pill` (`rounded-full` still exists for true circles) |
| `text.footnote` | `text-footnote` (size, line-height, weight, letter-spacing together) |
| `font.family.display` | `font-display` (`font-sans` for Inter) |
| `elevation.1`, `elevation.2` | `shadow-elevation-1`, `shadow-elevation-2` |
| `spacing.*` | `p-*`, `m-*`, `gap-*`, `space-*`... see below |
| `color.team.primary`, `color.team.secondary` | `bg-team-primary`, `text-team-secondary`, `border-team-primary` |

Token names map 1:1 (camelCase becomes kebab-case): `accent.goldSubtle` is `bg-accent-gold-subtle`, `text.scoreHero` is `text-score-hero`.

### Type

Each `text.<style>` carries `fontFamily`, `fontSize`, `lineHeight`, `fontWeight`, `letterSpacing`. The style utility (`text-footnote`) sets size, line
height, weight and letter spacing. The display styles (`scoreHero`, `score`, `scoreSm`, `clock`) also set the Barlow Condensed family, and `clock` sets
`tabular-nums`, through zero-specificity rules in `theme.css`, so `text-score` alone is enough and an explicit `font-*` utility still wins.
`subhead` and `footnote` have a regular (400) default and a `fontWeightStrong` (600) variant: add `font-semibold`. `title3` is for section headers;
add `uppercase`.

### Spacing

The scale is 2, 4, 8, 10, 12, 16, 20, 24, 32, 40 px (decision D5). **We keep Tailwind's 4px multiplier** (`--spacing: 0.25rem`) instead of defining
named steps, so every spacing utility keeps its familiar meaning and a scale step is simply `px / 4`:

| px | 2 | 4 | 8 | 10 | 12 | 16 | 20 | 24 | 32 | 40 |
|---|---|---|---|---|---|---|---|---|---|---|
| utility suffix | `0.5` | `1` | `2` | `2.5` | `3` | `4` | `5` | `6` | `8` | `10` |

So `gap-2.5` is the 10px step, `p-4` is 16px. Every approved step is a valid Tailwind step, which is why named steps (a `--spacing-*` override where
`gap-10` would mean 10px, not 40px) were rejected: they would silently invert what every Tailwind user expects. The trade-off is that Tailwind
still accepts off-scale values (`p-1.5` = 6px, `p-7`, `gap-12`...). Do not use them; sizing utilities (`size-14`, `min-h-11`, `max-w-page`) are not
spacing and are unaffected. The tokens themselves are also available as `--pll-spacing-<px>` variables and in `tokens.spacing`.

## Team colors

Team colors come from API data, not from the tokens. Set them inline on a team scope:

```tsx
<section style={{ '--team-primary': team.colors.primary, '--team-secondary': team.colors.secondary } as React.CSSProperties}>
  <div className="border-team-primary bg-team-secondary" />   {/* team.primary / team.secondary utilities */}
</section>
```

`bg-team-primary` / `text-team-primary` / `border-team-primary` (and the `secondary` equivalents) read `var(--team-primary, <fallback>)`. The
fallback is the neutral `color.team.primary` / `color.team.secondary` token (gray 600 / gray 700), used wherever no scope sets the variables. They are
declared with `@theme inline` so the variable is resolved on the element and a nested scope can override its parent. Scopes can nest (a game card
inside a team page). `TeamLogo` already follows this pattern for its ring.

## Fonts

Inter (400, 500, 600, 700) for UI text, Barlow Condensed (600, 800) for scores, the clock and big numerals. The tokens only name the families; loading is
the app's job. The font token carries the host variable as an extension (`$extensions["com.pll"].hostVar`), so `tokens.css` emits
`--pll-font-family-sans: var(--font-inter, Inter), ui-sans-serif, ...`:

- `apps/web` loads both with `next/font/google` and the variable names `--font-inter` / `--font-barlow-condensed` (`src/app/layout.tsx`).
- Storybook loads them from Google Fonts in `packages/ui/.storybook/preview-head.html`; the variables are unset there, so the plain family names apply.

## Token extensions (`$extensions["com.pll"]`)

| Key | Meaning |
|---|---|
| `alpha` | the token is its alias target at this alpha. CSS: `color-mix(in srgb, var(--target) 10%, transparent)`, TS: `rgba(...)` |
| `runtimeVar` | runtime CSS variable that overrides the token (team colors); the token value is the fallback |
| `hostVar` | variable provided by the app's font loader; becomes `var(<hostVar>, <first family>)` |

## Adding or changing a token

1. Edit the DTCG JSON in `src/` (semantic tokens alias a primitive with `"{palette.gray.900}"`; add a primitive only if the value is new).
2. `npm run tokens`, then commit `dist/` with the change.
3. The Storybook page `Foundations/Tokens` updates by itself; check it.
