import type { Db } from '@pll/data/db';
import { seek } from './clock';
import { applyPreset } from './presets';
import { DATA_FLAG_KEYS, NETWORK_MODES, type NetworkMode, type ScenarioState } from './types';

/**
 * Shareable scenario links: `#game=<id>&preset=live-q4` plus optional tweaks
 * `&t=<elapsed>` `&net=<mode>` `&lat=<ms>` `&flags=hideWeather,noPlays`.
 * Only differences from the preset are written.
 */
export function stateToHash(db: Db, state: ScenarioState): string {
  const reference = applyPreset(db, state.gameId, state.presetId);
  const params = new URLSearchParams();
  params.set('game', state.gameId);
  params.set('preset', state.presetId);
  const t = state.perGame[state.gameId]?.elapsedSeconds;
  const refT = reference.perGame[state.gameId]?.elapsedSeconds;
  if (typeof t === 'number' && t !== refT) params.set('t', String(Math.floor(t)));
  if (state.network !== reference.network) params.set('net', state.network);
  if (state.latencyMs !== reference.latencyMs) params.set('lat', String(Math.round(state.latencyMs)));
  const flags = DATA_FLAG_KEYS.filter((k) => state.dataFlags[k] !== reference.dataFlags[k]);
  if (flags.length) params.set('flags', DATA_FLAG_KEYS.filter((k) => state.dataFlags[k]).join(',') || 'none');
  return `#${params.toString().replace(/%2C/g, ',')}`;
}

export interface HashRequest {
  game?: string;
  preset?: string;
}

/** Builds the full state a hash describes. Unknown games fall back to `fallbackGameId`; unknown presets to the default. */
export function stateFromHash(db: Db, hash: string, fallbackGameId: string, realNowMs: number): ScenarioState {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const requested = params.get('game');
  const gameId = requested && db.games.some((g) => g.id === requested) ? requested : fallbackGameId;
  let state = applyPreset(db, gameId, params.get('preset') ?? 'default');
  const t = Number(params.get('t'));
  if (params.has('t') && Number.isFinite(t)) state = seek(state, t, realNowMs);
  const net = params.get('net') as NetworkMode | null;
  if (net && NETWORK_MODES.includes(net)) state = { ...state, network: net };
  const lat = Number(params.get('lat'));
  if (params.has('lat') && Number.isFinite(lat)) state = { ...state, latencyMs: Math.max(0, Math.min(10_000, lat)) };
  const flags = params.get('flags');
  if (flags !== null) {
    const on = new Set(flags.split(',').filter(Boolean));
    const dataFlags = { ...state.dataFlags };
    for (const k of DATA_FLAG_KEYS) dataFlags[k] = on.has(k);
    state = { ...state, dataFlags };
  }
  return state;
}
