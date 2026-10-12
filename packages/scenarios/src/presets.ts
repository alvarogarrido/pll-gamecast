import type { Db } from '@pll/data/db';
import { wallClockAt } from '@pll/data/derive';
import { buildTimeline, scoreAt, logEnd } from './timeline';
import { createDefaultState, type ScenarioState } from './types';

export interface PresetAvailability {
  enabled: boolean;
  /** Why it is disabled, or a heads-up when it is enabled but approximate. */
  note?: string;
}

export interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  /** Disabled presets are shown greyed out in the Lab. Default: always enabled. */
  availability?(db: Db, gameId: string): PresetAvailability;
  /** The situation, as a partial state (merged over `createDefaultState`). `gameId` itself is never changed by a preset. */
  apply(db: Db, gameId: string): Partial<ScenarioState>;
}

const HOUR = 3_600_000;
const iso = (ms: number) => new Date(ms).toISOString();
const gameOf = (db: Db, gameId: string) => db.games.find((g) => g.id === gameId);

/** The state with the focus game paused at `elapsed` game-seconds. */
function atElapsed(gameId: string, elapsed: number): Partial<ScenarioState> {
  return {
    perGame: { [gameId]: { elapsedSeconds: elapsed } },
    clock: { playing: false, speed: 1, anchorRealMs: 0, anchorElapsed: elapsed },
  };
}

/** Latest moment in Q4 (at least 2:00 left) with a margin of at most 1 goal; falls back to the closest margin in Q4. */
export function findCloseFinish(db: Db, gameId: string): { elapsed: number; margin: number } | null {
  const tl = buildTimeline(db, gameId);
  if (tl.end < 2700) return null;
  const marginAt = (e: number) => {
    const s = scoreAt(tl, e);
    return Math.abs(s.home - s.away);
  };
  const latest = Math.min(3480, tl.end - 1);
  for (let e = latest; e >= 2700; e -= 1) if (marginAt(e) <= 1) return { elapsed: e, margin: marginAt(e) };
  let best = { elapsed: latest, margin: marginAt(latest) };
  for (let e = latest; e >= 2700; e -= 1) if (marginAt(e) < best.margin) best = { elapsed: e, margin: marginAt(e) };
  return best;
}

const hasPlays = (db: Db, gameId: string): PresetAvailability =>
  (db.plays[gameId]?.length ?? 0) > 0 ? { enabled: true } : { enabled: false, note: 'This game has no play log.' };

/** Add a preset here (see apps/lab/README.md). Order = order in the Lab. */
export const presets: ScenarioPreset[] = [
  {
    id: 'default',
    label: 'Default snapshot',
    description: 'The DB as shipped: Saturday Mar 13 2027, 3:30 PM ET. Two games live, three final, three to play.',
    apply: () => ({}),
  },
  {
    id: 'start-of-season',
    label: 'Start of season',
    description: 'Three days before the first game of the season. Every game is scheduled and every record is 0-0.',
    apply: (db) => {
      const first = Math.min(...db.games.map((g) => Date.parse(g.startTime)));
      return { nowOverride: iso(first - 72 * HOUR) };
    },
  },
  {
    id: 'pregame',
    label: 'Pregame',
    description: 'Two hours before the focus game starts.',
    apply: (db, gameId) => {
      const g = gameOf(db, gameId);
      return g ? { nowOverride: iso(Date.parse(g.startTime) - 2 * HOUR) } : {};
    },
  },
  {
    id: 'live-q1',
    label: 'Live: Q1 early',
    description: 'Five minutes into the first quarter.',
    availability: hasPlays,
    apply: (_db, gameId) => atElapsed(gameId, 300),
  },
  {
    id: 'live-halftime',
    label: 'Live: Halftime',
    description: 'The break after Q2 (0:00, halftime).',
    availability: hasPlays,
    apply: (_db, gameId) => atElapsed(gameId, 1800),
  },
  {
    id: 'live-q4',
    label: 'Live: Q4 close finish',
    description: 'The latest moment in Q4 (at least 2:00 left) where the margin is at most one goal.',
    availability: (db, gameId) => {
      const found = findCloseFinish(db, gameId);
      if (!found) return { enabled: false, note: 'This game has no fourth quarter.' };
      return found.margin <= 1
        ? { enabled: true }
        : { enabled: true, note: `No one-goal moment in Q4 for this game; using the closest (margin ${found.margin}).` };
    },
    apply: (db, gameId) => {
      const found = findCloseFinish(db, gameId);
      return found ? atElapsed(gameId, found.elapsed) : {};
    },
  },
  {
    id: 'overtime',
    label: 'Overtime',
    description: 'Thirty seconds into overtime. Only for games that went to OT.',
    availability: (db, gameId) =>
      (db.plays[gameId] ?? []).some((p) => p.period >= 5)
        ? { enabled: true }
        : { enabled: false, note: 'This game did not go to overtime.' },
    apply: (db, gameId) => atElapsed(gameId, Math.min(3600 + 30, Math.max(0, logEnd(db, gameId) - 1))),
  },
  {
    id: 'final',
    label: 'Final',
    description: 'The game is over (the whole log is revealed). Server time is 30 minutes after the final whistle.',
    availability: hasPlays,
    apply: (db, gameId) => {
      const g = gameOf(db, gameId);
      const patch: Partial<ScenarioState> = { perGame: { [gameId]: { status: 'final' } } };
      // Games that are already final at the snapshot keep the snapshot time.
      if (g && g.status !== 'final') {
        patch.nowOverride = iso(Date.parse(wallClockAt(g.startTime, logEnd(db, gameId))) + 30 * 60_000);
      }
      return patch;
    },
  },
  {
    id: 'offline',
    label: 'No internet',
    description: 'Every API call and every cross-origin request (team logos) fails; navigator.onLine is false in the app.',
    apply: () => ({ network: 'offline' }),
  },
  {
    id: 'slow',
    label: 'Slow network',
    description: 'Every API response takes 2.5 seconds, so loading states stay visible.',
    apply: () => ({ network: 'slow', latencyMs: 2500 }),
  },
  {
    id: 'errors',
    label: 'API errors',
    description: 'Every API call answers 500 with a JSON error body.',
    apply: () => ({ network: 'server_error' }),
  },
  {
    id: 'missing-data',
    label: 'Missing data',
    description: 'No weather, ranks, photos, plays or media. Shows every empty state.',
    apply: () => ({
      dataFlags: { hideWeather: true, hideRanks: true, hidePhotos: true, noPlays: true, noMedia: true, longNames: false },
    }),
  },
];

export const getPreset = (id: string): ScenarioPreset | undefined => presets.find((p) => p.id === id);

/** A complete state for `presetId` on `gameId` (falls back to the default snapshot for unknown ids). */
export function applyPreset(db: Db, gameId: string, presetId: string): ScenarioState {
  const preset = getPreset(presetId) ?? (presets[0] as ScenarioPreset);
  const base = createDefaultState(gameId, preset.id);
  const patch = preset.apply(db, gameId);
  return {
    ...base,
    ...patch,
    gameId,
    presetId: preset.id,
    perGame: patch.perGame ?? base.perGame,
    clock: patch.clock ?? base.clock,
    dataFlags: { ...base.dataFlags, ...patch.dataFlags },
  };
}
