/**
 * Pure display formatters for the Gamecast UI. No `Date.now()`, no `new Date()` without an argument, no globals:
 * "now" and the time zone are always passed in (server time comes from `meta.serverTime`, see AGENTS.md).
 *
 * Missing values (`null`, `undefined`, `NaN`) render as {@link NO_VALUE} so tables never show "NaN%".
 */
import type { ClassYear, GameStatus, LivePhase, Position } from '@pll/data/api';

/** Shown instead of a number we do not have. En dash, same glyph as {@link signedChange} for "no change". */
export const NO_VALUE = '–';
/** True minus sign (not a hyphen) for negative changes. */
export const MINUS = '−';

/** Default display zone. Lacrosse schedules are published in Eastern time. */
export const DEFAULT_TIME_ZONE = 'America/New_York';

const isNum = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n);

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

/** Fraction (0..1) to a percentage string: `pct(0.4333)` is `"43.3%"`. */
export function pct(fraction: number | null | undefined, digits = 1): string {
  return isNum(fraction) ? `${(fraction * 100).toFixed(digits)}%` : NO_VALUE;
}

/** Per-game rate: `perGame(93, 8)` is `"11.6"`. Zero games gives {@link NO_VALUE}. */
export function perGame(total: number | null | undefined, games: number | null | undefined, digits = 1): string {
  return isNum(total) && isNum(games) && games > 0 ? (total / games).toFixed(digits) : NO_VALUE;
}

/** Whole numbers with thousands separators (`1,234`). */
export function count(n: number | null | undefined): string {
  return isNum(n) ? Math.round(n).toLocaleString('en-US') : NO_VALUE;
}

/** How a stat number is rendered: see {@link formatStat}. */
export type StatFormat = 'number' | 'pct' | 'decimal' | ((value: number) => string);

/**
 * One entry point for stat cells. `number` keeps integers whole and gives other values 1 digit, `pct` expects a
 * fraction (0..1), `decimal` fixes `digits` (default 2). A function formats the value itself.
 */
export function formatStat(value: number | null | undefined, format: StatFormat = 'number', digits?: number): string {
  if (!isNum(value)) return NO_VALUE;
  if (typeof format === 'function') return format(value);
  if (format === 'pct') return pct(value, digits ?? 1);
  if (format === 'decimal') return value.toFixed(digits ?? 2);
  return Number.isInteger(value) ? count(value) : value.toFixed(digits ?? 1);
}

/** Rank/RPI movement: `+2`, `−1`, and an en dash for no change or unknown. */
export function signedChange(change: number | null | undefined): string {
  if (!isNum(change) || change === 0) return NO_VALUE;
  return change > 0 ? `+${change}` : `${MINUS}${Math.abs(change)}`;
}

// ---------------------------------------------------------------------------
// Game clock and periods
// ---------------------------------------------------------------------------

/** Seconds left in a period as `m:ss`: `clock(491)` is `"8:11"`. */
export function clock(seconds: number | null | undefined): string {
  if (!isNum(seconds)) return NO_VALUE;
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Four regulation quarters, then overtimes: 1-4 are `Q1`..`Q4`, 5 is `OT`, 6 is `2OT`, 7 is `3OT`. */
export function periodLabel(period: number): string {
  if (period <= 4) return `Q${Math.max(1, period)}`;
  const ot = period - 4;
  return ot === 1 ? 'OT' : `${ot}OT`;
}

// ---------------------------------------------------------------------------
// Dates (always with an explicit time zone)
// ---------------------------------------------------------------------------

const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(timeZone: string, key: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const id = `${timeZone}|${key}`;
  let f = formatters.get(id);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone, ...options });
    formatters.set(id, f);
  }
  return f;
}

function parts(ms: number, timeZone: string, key: string, options: Intl.DateTimeFormatOptions) {
  const out: Record<string, string> = {};
  for (const p of formatter(timeZone, key, options).formatToParts(ms)) out[p.type] = p.value;
  return out;
}

/** `"3:30 PM ET"`. */
export function timeLabel(iso: string, timeZone = DEFAULT_TIME_ZONE): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return NO_VALUE;
  const t = parts(ms, timeZone, 'time', { hour: 'numeric', minute: '2-digit', timeZoneName: 'shortGeneric' });
  return `${t.hour}:${t.minute} ${t.dayPeriod} ${t.timeZoneName}`;
}

/** `"Mar 13"`. */
export function dateLabel(iso: string, timeZone = DEFAULT_TIME_ZONE): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return NO_VALUE;
  const d = parts(ms, timeZone, 'date', { month: 'short', day: 'numeric' });
  return `${d.month} ${d.day}`;
}

/** Calendar day key (`2027-03-13`) in a zone, to compare "same day" without time arithmetic. */
function dayKey(ms: number, timeZone: string): string {
  const d = parts(ms, timeZone, 'day', { year: 'numeric', month: '2-digit', day: '2-digit' });
  return `${d.year}-${d.month}-${d.day}`;
}

const DAY_MS = 86_400_000;

/**
 * Kickoff text: `"Sat 3:30 PM ET"` within the coming week, `"Mar 13 · 3:30 PM ET"` further out (or in the past),
 * with `nowMs` deciding which. Pass server time as `nowMs`.
 */
export function kickoffLabel(iso: string, nowMs: number, timeZone = DEFAULT_TIME_ZONE): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return NO_VALUE;
  const ahead = ms - nowMs;
  if (ahead >= 0 && ahead < 6 * DAY_MS) {
    const weekday = parts(ms, timeZone, 'weekday', { weekday: 'short' }).weekday;
    return `${weekday} ${timeLabel(iso, timeZone)}`;
  }
  return `${dateLabel(iso, timeZone)} · ${timeLabel(iso, timeZone)}`;
}

/** `"2h 5m"`, `"35m"`; under one minute gives `"<1m"`. */
export function countdownLabel(ms: number): string {
  const minutes = Math.floor(Math.max(0, ms) / 60_000);
  if (minutes < 1) return '<1m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ---------------------------------------------------------------------------
// Game status
// ---------------------------------------------------------------------------

/** The pieces of a `GameSummary` (`@pll/data/api`) that status text needs. A real `GameSummary` fits. */
export interface StatusGame {
  status: GameStatus;
  startTime: string;
  clock?: { period: number; clockSeconds: number; phase: LivePhase } | null;
  /** Used to spot overtime on a final game (more than four periods played). */
  home?: { periodScores: readonly number[] };
  away?: { periodScores: readonly number[] };
}

export type StatusKind = 'scheduled' | 'live' | 'halftime' | 'final';

export interface StatusOptions {
  timeZone?: string;
  /** Scheduled games starting within this window show a countdown ("Starts in 2h 5m"). Default 12 hours. */
  countdownWithinMs?: number;
}

export interface StatusParts {
  /** Maps onto the `StatusPill` status. Delayed/postponed/canceled games read as `scheduled`. */
  kind: StatusKind;
  /** Headline: `LIVE`, `HALF`, `END Q1`, `FINAL`, `FINAL/OT`, `Starts in 2h 5m`, `Sat 3:30 PM ET`, `Delayed`. */
  label: string;
  /** Live clock, `Q3 8:11`. Empty unless the game is in progress. */
  detail: string;
  /** `label` and `detail` joined: `LIVE · Q3 8:11`. */
  line: string;
}

const periodsPlayed = (game: StatusGame) =>
  Math.max(game.home?.periodScores.length ?? 0, game.away?.periodScores.length ?? 0);

/** Structured status text. See {@link statusLine} for the one-string version. */
export function statusParts(game: StatusGame, nowMs: number, options: StatusOptions = {}): StatusParts {
  const { timeZone = DEFAULT_TIME_ZONE, countdownWithinMs = 12 * 3_600_000 } = options;
  const make = (kind: StatusKind, label: string, detail = ''): StatusParts => ({
    kind,
    label,
    detail,
    line: detail ? `${label} · ${detail}` : label,
  });

  switch (game.status) {
    case 'live': {
      const c = game.clock;
      if (!c) return make('live', 'LIVE');
      if (c.phase === 'halftime') return make('halftime', 'HALF');
      if (c.phase === 'break') return make('live', `END ${periodLabel(c.period)}`);
      return make('live', 'LIVE', `${periodLabel(c.period)} ${clock(c.clockSeconds)}`);
    }
    case 'final': {
      const played = periodsPlayed(game);
      return make('final', played > 4 ? `FINAL/${periodLabel(played)}` : 'FINAL');
    }
    case 'delayed':
      return make('scheduled', 'Delayed');
    case 'postponed':
      return make('scheduled', 'Postponed');
    case 'canceled':
      return make('scheduled', 'Canceled');
    case 'scheduled': {
      const ahead = Date.parse(game.startTime) - nowMs;
      if (Number.isNaN(ahead)) return make('scheduled', NO_VALUE);
      if (ahead <= 0) return make('scheduled', 'Starting soon');
      if (ahead <= countdownWithinMs) return make('scheduled', `Starts in ${countdownLabel(ahead)}`);
      return make('scheduled', kickoffLabel(game.startTime, nowMs, timeZone));
    }
  }
}

/** One-line status: `LIVE · Q3 8:11`, `HALF`, `END Q1`, `FINAL`, `FINAL/OT`, `Starts in 2h 5m`, `Sat 3:30 PM ET`. */
export function statusLine(game: StatusGame, nowMs: number, options?: StatusOptions): string {
  return statusParts(game, nowMs, options).line;
}

// ---------------------------------------------------------------------------
// Teams and players
// ---------------------------------------------------------------------------

/** Win-loss record: `record({ wins: 4, losses: 1 })` is `"4-1"`. */
export function record(r: { wins: number; losses: number } | null | undefined): string {
  return r ? `${r.wins}-${r.losses}` : NO_VALUE;
}

/** National rank: `"#2"`. Empty string when unranked, so `{rankLabel(rank) && ...}` works. */
export function rankLabel(rank: number | null | undefined): string {
  return isNum(rank) ? `#${rank}` : '';
}

/** `"B. Dowd"`. Falls back to the last name alone when there is no first name. */
export function playerShortName(player: { firstName: string; lastName: string }): string {
  const initial = player.firstName.trim().charAt(0).toUpperCase();
  const last = player.lastName.trim();
  return initial ? `${initial}. ${last}` : last;
}

/** Initials for avatar fallbacks: `"BD"`. */
export function playerInitials(player: { firstName: string; lastName: string }): string {
  return `${player.firstName.trim().charAt(0)}${player.lastName.trim().charAt(0)}`.toUpperCase();
}

const classYears: Record<ClassYear, string> = {
  Fr: 'Freshman',
  So: 'Sophomore',
  Jr: 'Junior',
  Sr: 'Senior',
  Gr: 'Graduate',
};

/** `classYearLabel('Jr')` is `"Jr"`; `'long'` gives `"Junior"`. */
export function classYearLabel(classYear: ClassYear, style: 'short' | 'long' = 'short'): string {
  return style === 'long' ? classYears[classYear] : classYear;
}

const positions: Record<Position, string> = {
  A: 'Attack',
  M: 'Midfield',
  D: 'Defense',
  LSM: 'Long-Stick Midfield',
  SSDM: 'Short-Stick Defensive Mid',
  FO: 'Faceoff',
  G: 'Goalie',
};

/** `positionLabel('A')` is `"A"`; `'long'` gives `"Attack"`. */
export function positionLabel(position: Position, style: 'short' | 'long' = 'short'): string {
  return style === 'long' ? positions[position] : position;
}

/** Player line under a name: `"#11 · A · Jr"`. */
export function playerMeta(player: { jerseyNumber: number; position: Position; classYear: ClassYear }): string {
  return `#${player.jerseyNumber} · ${player.position} · ${player.classYear}`;
}
