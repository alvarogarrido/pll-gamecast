import { describe, expect, it } from 'vitest';
import { tokens } from '@pll/tokens';
import {
  contrastRatio,
  parseHex,
  relativeLuminance,
  SURFACE_CARD_HEX,
  teamColorOnDark,
  teamColorVars,
  teamPairColors,
} from './team-style';

const card = parseHex(SURFACE_CARD_HEX)!;
const contrast = (hex: string) => contrastRatio(parseHex(hex)!, card);

// Real team colors from packages/data/db/teams.json.
const NOTRE_DAME = { primary: '#0C2340', secondary: '#C99700' };
const DUKE = { primary: '#003087', secondary: '#FFFFFF' };
const MARYLAND = { primary: '#E03A3E', secondary: '#FFD520' };
const NORTH_CAROLINA = { primary: '#7BAFD4', secondary: '#13294B' };
const PENN_STATE = { primary: '#041E42', secondary: '#96BEE6' };
const GEORGETOWN = { primary: '#041E42', secondary: '#8D817B' };

describe('contrast helpers', () => {
  it('matches the WCAG reference values', () => {
    expect(relativeLuminance([0, 0, 0])).toBe(0);
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 5);
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
  });
  it('parses short and long hex, with or without #, and rejects the rest', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255]);
    expect(parseHex('0C2340')).toEqual([12, 35, 64]);
    expect(parseHex('red')).toBeNull();
    expect(parseHex('rgb(1,2,3)')).toBeNull();
  });
  it('keeps SURFACE_CARD_HEX in sync with the surface.card token', () => {
    expect(SURFACE_CARD_HEX.toLowerCase()).toBe(tokens.color.surface.card.toLowerCase());
  });
});

describe('teamColorOnDark', () => {
  it('lightens navy teams to at least 3:1 against surface.card', () => {
    for (const hex of ['#0C2340', '#003087', '#041E42', '#011F5B', '#00274C', '#232D4B', '#000000']) {
      expect(contrast(hex), hex).toBeLessThan(3);
      expect(contrast(teamColorOnDark(hex)), hex).toBeGreaterThanOrEqual(3);
    }
  });
  it('is minimal: the result sits right at the threshold, not near white', () => {
    expect(contrast(teamColorOnDark('#0C2340'))).toBeLessThan(3.2);
  });
  it('keeps the hue of the color it lightens', () => {
    const [r, g, b] = parseHex(teamColorOnDark('#003087'))!;
    expect(b).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(r);
  });
  it('leaves colors that already pass alone (normalized to lowercase)', () => {
    expect(teamColorOnDark('#E03A3E')).toBe('#e03a3e');
    expect(teamColorOnDark('#7BAFD4')).toBe('#7bafd4');
    expect(teamColorOnDark('#FFF')).toBe('#ffffff');
  });
  it('is idempotent', () => {
    for (const hex of ['#0C2340', '#003087', '#E03A3E', '#000000']) {
      const once = teamColorOnDark(hex);
      expect(teamColorOnDark(once)).toBe(once);
    }
  });
  it('passes through what it cannot parse', () => {
    expect(teamColorOnDark('red')).toBe('red');
    expect(teamColorOnDark('var(--x)')).toBe('var(--x)');
  });
});

describe('teamPairColors', () => {
  it('keeps both primaries (made visible) when the teams look different', () => {
    expect(teamPairColors(MARYLAND, NORTH_CAROLINA)).toEqual({ away: '#e03a3e', home: '#7bafd4' });
    const out = teamPairColors(MARYLAND, NOTRE_DAME);
    expect(out.away).toBe('#e03a3e');
    expect(out.home).toBe(teamColorOnDark(NOTRE_DAME.primary));
  });
  it('separates Duke and Notre Dame: the home team falls back to its (visible) secondary', () => {
    const out = teamPairColors(DUKE, NOTRE_DAME);
    expect(out.away).toBe(teamColorOnDark(DUKE.primary));
    expect(out.home).toBe('#c99700');
    expect(contrast(out.home)).toBeGreaterThanOrEqual(3);
  });
  it('uses the away secondary when the home secondary does not help', () => {
    // Home secondary is the same navy family as the away primary; the away team's own secondary is a different color.
    const out = teamPairColors({ primary: '#003087', secondary: '#F84C1E' }, { primary: '#0C2340', secondary: '#13294B' });
    expect(out.away).toBe('#f84c1e');
    expect(out.home).toBe(teamColorOnDark('#0C2340'));
  });
  it('lightens a secondary that is itself too dark', () => {
    const out = teamPairColors({ primary: '#003087' }, { primary: '#0C2340', secondary: '#7B0000' });
    expect(contrast(out.home)).toBeGreaterThanOrEqual(3);
    expect(out.home).not.toBe('#7b0000');
  });
  it('lightens the home primary as a last resort (same navy, no secondaries)', () => {
    const out = teamPairColors({ primary: '#041E42' }, { primary: '#041E42' });
    expect(out.away).toBe(teamColorOnDark('#041E42'));
    expect(out.home).not.toBe(out.away);
    expect(contrast(out.home)).toBeGreaterThanOrEqual(3);
  });
  it('separates teams with the identical primary through the secondary', () => {
    const out = teamPairColors(PENN_STATE, GEORGETOWN);
    expect(out.away).toBe(teamColorOnDark('#041E42'));
    expect(out.home).toBe('#8d817b');
  });
  it('treats light blue and dark blue as different teams', () => {
    expect(teamPairColors(DUKE, NORTH_CAROLINA)).toEqual({ away: teamColorOnDark(DUKE.primary), home: '#7bafd4' });
  });
  it('always returns colors with 3:1 contrast', () => {
    const teams = [NOTRE_DAME, DUKE, MARYLAND, NORTH_CAROLINA, PENN_STATE, GEORGETOWN];
    for (const a of teams) for (const h of teams) {
      const out = teamPairColors(a, h);
      expect(contrast(out.away)).toBeGreaterThanOrEqual(3);
      expect(contrast(out.home)).toBeGreaterThanOrEqual(3);
    }
  });
  it('passes through invalid colors', () => {
    expect(teamPairColors({ primary: 'red' }, { primary: '#fff' })).toEqual({ away: 'red', home: '#fff' });
  });
});

describe('teamColorVars', () => {
  it('sets primary, secondary and the on-dark variant', () => {
    const style = teamColorVars('#0C2340', '#C99700') as Record<string, string>;
    expect(style['--team-primary']).toBe('#0C2340');
    expect(style['--team-secondary']).toBe('#C99700');
    expect(style['--team-primary-on-dark']).toBe(teamColorOnDark('#0C2340'));
  });
  it('takes a pre-resolved on-dark color (a half of teamPairColors)', () => {
    const style = teamColorVars('#0C2340', null, '#c99700') as Record<string, string>;
    expect(style['--team-primary-on-dark']).toBe('#c99700');
    expect(style['--team-secondary']).toBeUndefined();
  });
  it('sets nothing without colors, so the neutral fallback applies', () => {
    expect(teamColorVars()).toEqual({});
    expect(teamColorVars(null, undefined)).toEqual({});
  });
});
