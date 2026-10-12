import type { CSSProperties } from 'react';

/**
 * Team color helpers.
 *
 * Team colors are API data and many primaries are navy (#0C2340, #003087, #041E42). On the dark card surface they vanish,
 * and two navy teams (Duke, Notre Dame) look identical. Everything that draws a team color on a dark surface (rings,
 * bars, strips, chart fills) therefore reads the **on-dark** variant of the color, never the raw one:
 *
 *   - {@link teamColorOnDark}: one color, lightened (hue and saturation kept) until it has at least 3:1 contrast with
 *     `surface.card`, the WCAG minimum for graphical objects.
 *   - {@link teamPairColors}: both teams of a game, with look-alikes separated.
 *   - {@link teamColorVars}: sets `--team-primary`, `--team-secondary` and `--team-primary-on-dark` for a subtree;
 *     `bg-team-primary-on-dark` / `border-team-primary-on-dark` / `fill-team-primary-on-dark`... read the last one
 *     (utility defined in `styles.css`).
 */

// ---------------------------------------------------------------------------
// Color math (pure, hex only; anything else passes through untouched)
// ---------------------------------------------------------------------------

type Rgb = [number, number, number];
type Hsl = [number, number, number];

/** `surface.card` (`#1F1F1F`), the surface team colors sit on. A unit test checks it against `@pll/tokens`. */
export const SURFACE_CARD_HEX = '#1F1F1F';
/** WCAG 1.4.11 minimum contrast for graphical objects. */
export const MIN_ON_DARK_CONTRAST = 3;
/** Perceptual distance (CIE76 delta E) under which two team colors read as the same team. */
export const MIN_TEAM_DELTA_E = 30;
/** Same-hue test of {@link teamPairColors}: Lab chroma that counts as "a color" (not gray), hue gap and lightness gap. */
const MIN_CHROMA = 20;
const SAME_HUE_DEGREES = 30;
const SAME_LIGHTNESS = 22;

/** `#abc` / `#aabbcc` (with or without `#`) to RGB, or `null` for anything else (named colors, `rgb()`...). */
export function parseHex(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const h = m[1]!.length === 3 ? [...m[1]!].map((c) => c + c).join('') : m[1]!;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** RGB to lowercase `#rrggbb`. */
export function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance([r, g, b]: Rgb): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two colors (1 to 21). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function rgbToHsl([r, g, b]: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function hslToRgb([h, s, l]: Hsl): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/** sRGB to CIE Lab (D65): lightness L*, then the two color axes (green-red, blue-yellow). */
function toLab(rgb: Rgb): Rgb {
  const [r, g, bl] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as Rgb;
  const xyz = [
    (0.4124564 * r + 0.3575761 * g + 0.1804375 * bl) / 0.95047,
    0.2126729 * r + 0.7151522 * g + 0.072175 * bl,
    (0.0193339 * r + 0.119192 * g + 0.9503041 * bl) / 1.08883,
  ];
  const [fx, fy, fz] = xyz.map((t) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116)) as Rgb;
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/**
 * Do two (on-dark) team colors read as the same team at a glance? Either they are close in Lab (delta E), or they are
 * both chromatic, in the same hue family and equally light: Duke's vivid blue and Notre Dame's steel blue are far apart in
 * delta E (chroma differs) yet nobody tells those two marks apart on a small ring. Light-blue UNC vs dark-blue Duke
 * differ in lightness, so they stay apart.
 */
function lookAlike(a: Rgb, b: Rgb): boolean {
  const x = toLab(a);
  const y = toLab(b);
  if (Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < MIN_TEAM_DELTA_E) return true;
  const chromaA = Math.hypot(x[1], x[2]);
  const chromaB = Math.hypot(y[1], y[2]);
  if (chromaA < MIN_CHROMA || chromaB < MIN_CHROMA) return false;
  const hueGap = Math.abs((((Math.atan2(x[2], x[1]) - Math.atan2(y[2], y[1])) * 180) / Math.PI + 540) % 360 - 180);
  return hueGap < SAME_HUE_DEGREES && Math.abs(x[0] - y[0]) < SAME_LIGHTNESS;
}

const SURFACE_RGB = parseHex(SURFACE_CARD_HEX)!;

/**
 * Lighten in HSL (hue and saturation fixed) just enough to reach `min` contrast with the surface. Bisection on lightness:
 * contrast grows monotonically with it. Colors that already pass are returned as they are.
 */
function lightenToContrast(rgb: Rgb, min: number): Rgb {
  if (contrastRatio(rgb, SURFACE_RGB) >= min) return rgb;
  const [h, s, l] = rgbToHsl(rgb);
  // Evaluate the rounded color: that is what ends up in the hex string, and rounding can cost a hundredth of contrast.
  const at = (light: number): Rgb => hslToRgb([h, s, light]).map(Math.round) as Rgb;
  let lo = l;
  let hi = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (contrastRatio(at(mid), SURFACE_RGB) >= min) hi = mid;
    else lo = mid;
  }
  return at(hi);
}

/** Push lightness up by `step` (0..1), for look-alikes that still collide after the contrast fix. */
const lighter = (rgb: Rgb, step: number): Rgb => {
  const [h, s, l] = rgbToHsl(rgb);
  return hslToRgb([h, s, Math.min(0.92, l + step)]).map(Math.round) as Rgb;
};

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * A team color made visible on the dark card: lightened, keeping its hue, until its contrast with `surface.card`
 * (#1F1F1F) is at least 3:1. Colors that already pass keep their look (returned as lowercase `#rrggbb`). Anything that
 * is not a hex color (`red`, `rgb()`, `var(...)`) is returned as given.
 */
export function teamColorOnDark(hex: string): string {
  const rgb = parseHex(hex);
  return rgb ? toHex(lightenToContrast(rgb, MIN_ON_DARK_CONTRAST)) : hex;
}

export interface TeamColorPair {
  primary: string;
  secondary?: string;
}

/**
 * The on-dark colors of the two teams of one game. Both primaries go through {@link teamColorOnDark}; when they still
 * look alike (Duke vs Notre Dame: two blues) one team falls back to its secondary color, lightened if needed — the home
 * team first, then the away team — and as a last resort the home primary is lightened step by step.
 * Unparseable colors are returned as given. Argument order follows the layout: away first, home second.
 */
export function teamPairColors(away: TeamColorPair, home: TeamColorPair): { away: string; home: string } {
  // Called once per play row: remember the answer for a game's two teams.
  const key = `${away.primary}|${away.secondary ?? ''}|${home.primary}|${home.secondary ?? ''}`;
  let hit = pairCache.get(key);
  if (!hit) {
    if (pairCache.size >= PAIR_CACHE_SIZE) pairCache.clear();
    hit = resolvePair(away, home);
    pairCache.set(key, hit);
  }
  return { ...hit };
}

const PAIR_CACHE_SIZE = 64;
const pairCache = new Map<string, { away: string; home: string }>();

function resolvePair(away: TeamColorPair, home: TeamColorPair): { away: string; home: string } {
  const a = parseHex(away.primary);
  const h = parseHex(home.primary);
  if (!a || !h) return { away: away.primary, home: home.primary };

  const aFill = lightenToContrast(a, MIN_ON_DARK_CONTRAST);
  const hFill = lightenToContrast(h, MIN_ON_DARK_CONTRAST);
  const apart = (x: Rgb, y: Rgb) => !lookAlike(x, y);
  if (apart(aFill, hFill)) return { away: toHex(aFill), home: toHex(hFill) };

  const secondary = (c: TeamColorPair) => {
    const rgb = c.secondary ? parseHex(c.secondary) : null;
    return rgb ? lightenToContrast(rgb, MIN_ON_DARK_CONTRAST) : null;
  };
  const homeAlt = secondary(home);
  if (homeAlt && apart(aFill, homeAlt)) return { away: toHex(aFill), home: toHex(homeAlt) };
  const awayAlt = secondary(away);
  if (awayAlt && apart(awayAlt, hFill)) return { away: toHex(awayAlt), home: toHex(hFill) };

  // No usable secondary: lighten the home primary until the two are apart (or the cap is reached).
  let hLight = hFill;
  for (let step = 0.08; step <= 0.4 && !apart(aFill, hLight); step += 0.08) hLight = lighter(hFill, step);
  return { away: toHex(aFill), home: toHex(hLight) };
}

/**
 * Inline style that makes `bg-team-primary` / `text-team-secondary` / `border-team-primary`... resolve to a team's colors
 * for the element and its subtree. Pass `team.colors.primary` (and `.secondary`) from the API.
 * Undefined colors are skipped so the neutral token fallback applies.
 *
 * It also sets `--team-primary-on-dark` (see {@link teamColorOnDark}) for the `*-team-primary-on-dark` utilities, which
 * is what to use when the color is drawn on a dark surface. `primaryOnDark` overrides it with a color you already
 * resolved, e.g. one half of {@link teamPairColors}.
 */
export function teamColorVars(primary?: string | null, secondary?: string | null, primaryOnDark?: string | null): CSSProperties {
  const vars: Record<string, string> = {};
  if (primary) vars['--team-primary'] = primary;
  if (secondary) vars['--team-secondary'] = secondary;
  const onDark = primaryOnDark ?? (primary ? teamColorOnDark(primary) : null);
  if (onDark) vars['--team-primary-on-dark'] = onDark;
  return vars as CSSProperties;
}
