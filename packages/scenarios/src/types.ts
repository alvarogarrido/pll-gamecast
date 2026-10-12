import type { GameStatus } from '@pll/data/schema';

export type NetworkMode = 'online' | 'offline' | 'slow' | 'flaky' | 'server_error';

export const NETWORK_MODES: readonly NetworkMode[] = ['online', 'slow', 'flaky', 'server_error', 'offline'];

export interface DataFlags {
  hideWeather: boolean;
  hideRanks: boolean;
  hidePhotos: boolean;
  noPlays: boolean;
  noMedia: boolean;
  longNames: boolean;
}

export type DataFlagKey = keyof DataFlags;
export const DATA_FLAG_KEYS: readonly DataFlagKey[] = [
  'hideWeather',
  'hideRanks',
  'hidePhotos',
  'noPlays',
  'noMedia',
  'longNames',
];

export interface GameOverride {
  /** number = the game is in progress at that game-second; null = use the DB; undefined = no override. */
  elapsedSeconds?: number | null;
  status?: GameStatus;
}

export interface ClockState {
  playing: boolean;
  /** Game-seconds (or world seconds, see resolve.ts) per real second. */
  speed: number;
  /** `Date.now()` at the moment the anchors below were captured. */
  anchorRealMs: number;
  /** Elapsed game-seconds of the focus game at `anchorRealMs`. */
  anchorElapsed: number;
}

/**
 * Everything the Lab can vary. Plain JSON: it is posted to the service worker and persisted in Cache Storage.
 *
 * Two ways to move the world:
 *  - elapsed-driven: `perGame[gameId].elapsedSeconds` is a number. The focus game sits at that game-second
 *    (advancing with `clock` while playing) and `serverTime` follows the game (see resolve.ts).
 *  - time-driven: `nowOverride` is set and the focus game has no elapsed override. Every game derives its
 *    status from the wall clock, so "now" can be before kickoff, mid-game or after the final whistle.
 */
export interface ScenarioState {
  /** The focus game: the one shown in the device frame. */
  gameId: string;
  presetId: string;
  nowOverride?: string;
  perGame: Record<string, GameOverride>;
  clock: ClockState;
  network: NetworkMode;
  latencyMs: number;
  dataFlags: DataFlags;
}

export const NO_FLAGS: DataFlags = {
  hideWeather: false,
  hideRanks: false,
  hidePhotos: false,
  noPlays: false,
  noMedia: false,
  longNames: false,
};

export function createDefaultState(gameId: string, presetId = 'default'): ScenarioState {
  return {
    gameId,
    presetId,
    perGame: {},
    clock: { playing: false, speed: 1, anchorRealMs: 0, anchorElapsed: 0 },
    network: 'online',
    latencyMs: 0,
    dataFlags: { ...NO_FLAGS },
  };
}
