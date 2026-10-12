'use client';

/**
 * TanStack Query hooks: one per endpoint of the contract in @pll/data/api.
 * Each hook returns the full `{ data, meta }` envelope (read `query.data?.data`).
 *
 * Polling: live games refetch every 15 s; everything else is fetched once.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type {
  GameDetail,
  GameInsights,
  GameMedia,
  GamePlays,
  GamePreview,
  GameStats,
  ScoreboardResponse,
  WinProbabilitySeries,
} from '@pll/data/api';
import { apiGet, type ResponseSchema } from './client';
import { serverClock } from './server-clock';

export const LIVE_POLL_MS = 15_000;

// ---------------------------------------------------------------------------
// Fetch plumbing
// ---------------------------------------------------------------------------

type Envelope = { meta: { serverTime: string } };
/** Names of the envelope schemas exported by @pll/data/api. */
type SchemaExport =
  | 'ScoreboardResponse'
  | 'GameDetail'
  | 'GameStats'
  | 'GamePlays'
  | 'WinProbabilitySeries'
  | 'GameInsights'
  | 'GamePreview'
  | 'GameMedia';

const schemaLoader = (name: SchemaExport) => async (): Promise<ResponseSchema> => {
  const mod = await import('@pll/data/api');
  return mod[name] as ResponseSchema;
};

async function fetchEnvelope<T extends Envelope>(path: string, schema: SchemaExport, signal: AbortSignal): Promise<T> {
  const response = await apiGet<T>(path, { signal, schema: schemaLoader(schema) });
  serverClock.sync(response.meta.serverTime);
  return response;
}

const gamePath = (gameId: string, suffix = '') => `/games/${encodeURIComponent(gameId)}${suffix}`;

export const queryKeys = {
  scoreboard: ['scoreboard'] as const,
  game: (gameId: string) => ['game', gameId] as const,
  stats: (gameId: string) => ['game', gameId, 'stats'] as const,
  plays: (gameId: string) => ['game', gameId, 'plays'] as const,
  winProbability: (gameId: string) => ['game', gameId, 'win-probability'] as const,
  insights: (gameId: string) => ['game', gameId, 'insights'] as const,
  preview: (gameId: string) => ['game', gameId, 'preview'] as const,
  media: (gameId: string) => ['game', gameId, 'media'] as const,
};

export interface QueryOptions {
  /** Set to false to defer fetching (e.g. a tab that is not visible yet). */
  enabled?: boolean;
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/** GET /scoreboard. Polls while any listed game is live. */
export function useScoreboard(options: QueryOptions = {}): UseQueryResult<ScoreboardResponse> {
  return useQuery({
    queryKey: queryKeys.scoreboard,
    queryFn: ({ signal }) => fetchEnvelope<ScoreboardResponse>('/scoreboard', 'ScoreboardResponse', signal),
    refetchInterval: (query) =>
      query.state.data?.data.games.some((g) => g.status === 'live') ? LIVE_POLL_MS : false,
    ...options,
  });
}

/** GET /games/{id}. Polls while the game is live. */
export function useGame(gameId: string, options: QueryOptions = {}): UseQueryResult<GameDetail> {
  return useQuery({
    queryKey: queryKeys.game(gameId),
    queryFn: ({ signal }) => fetchEnvelope<GameDetail>(gamePath(gameId), 'GameDetail', signal),
    refetchInterval: (query) => (query.state.data?.data.status === 'live' ? LIVE_POLL_MS : false),
    ...options,
  });
}

/** Polling interval for the per-game endpoints: 15 s while the game is live, none otherwise. */
function useLiveInterval(gameId: string): number | false {
  const { data } = useGame(gameId);
  return data?.data.status === 'live' ? LIVE_POLL_MS : false;
}

/** GET /games/{id}/stats */
export function useGameStats(gameId: string, options: QueryOptions = {}): UseQueryResult<GameStats> {
  const refetchInterval = useLiveInterval(gameId);
  return useQuery({
    queryKey: queryKeys.stats(gameId),
    queryFn: ({ signal }) => fetchEnvelope<GameStats>(gamePath(gameId, '/stats'), 'GameStats', signal),
    refetchInterval,
    ...options,
  });
}

/** GET /games/{id}/plays */
export function useGamePlays(gameId: string, options: QueryOptions = {}): UseQueryResult<GamePlays> {
  const refetchInterval = useLiveInterval(gameId);
  return useQuery({
    queryKey: queryKeys.plays(gameId),
    queryFn: ({ signal }) => fetchEnvelope<GamePlays>(gamePath(gameId, '/plays'), 'GamePlays', signal),
    refetchInterval,
    ...options,
  });
}

/** GET /games/{id}/win-probability */
export function useWinProbability(
  gameId: string,
  options: QueryOptions = {},
): UseQueryResult<WinProbabilitySeries> {
  const refetchInterval = useLiveInterval(gameId);
  return useQuery({
    queryKey: queryKeys.winProbability(gameId),
    queryFn: ({ signal }) =>
      fetchEnvelope<WinProbabilitySeries>(gamePath(gameId, '/win-probability'), 'WinProbabilitySeries', signal),
    refetchInterval,
    ...options,
  });
}

/** GET /games/{id}/insights */
export function useGameInsights(gameId: string, options: QueryOptions = {}): UseQueryResult<GameInsights> {
  const refetchInterval = useLiveInterval(gameId);
  return useQuery({
    queryKey: queryKeys.insights(gameId),
    queryFn: ({ signal }) => fetchEnvelope<GameInsights>(gamePath(gameId, '/insights'), 'GameInsights', signal),
    refetchInterval,
    ...options,
  });
}

/** GET /games/{id}/preview (pregame modules; does not change during a game, so no polling). */
export function useGamePreview(gameId: string, options: QueryOptions = {}): UseQueryResult<GamePreview> {
  return useQuery({
    queryKey: queryKeys.preview(gameId),
    queryFn: ({ signal }) => fetchEnvelope<GamePreview>(gamePath(gameId, '/preview'), 'GamePreview', signal),
    ...options,
  });
}

/** GET /games/{id}/media (videos + articles; no polling). */
export function useGameMedia(gameId: string, options: QueryOptions = {}): UseQueryResult<GameMedia> {
  return useQuery({
    queryKey: queryKeys.media(gameId),
    queryFn: ({ signal }) => fetchEnvelope<GameMedia>(gamePath(gameId, '/media'), 'GameMedia', signal),
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Server time
// ---------------------------------------------------------------------------

/**
 * "Now" according to the server: the latest `meta.serverTime` plus the client time elapsed since
 * it was received. Returns epoch milliseconds, or `null` until the first response arrived (and during
 * prerender). Re-renders every `tickMs` (default 1 s; 0 = only when a new response re-anchors it).
 *
 * Game logic must use this, never Date.now() / new Date() (enforced by ESLint).
 */
export function useServerNow(options: { tickMs?: number } = {}): number | null {
  const tickMs = options.tickMs ?? 1000;

  const subscribe = useCallback(
    (onChange: () => void) => {
      const unsubscribe = serverClock.subscribe(onChange);
      const timer = tickMs > 0 ? setInterval(onChange, tickMs) : undefined;
      return () => {
        unsubscribe();
        if (timer) clearInterval(timer);
      };
    },
    [tickMs],
  );

  const getSnapshot = useCallback(() => {
    const now = serverClock.now();
    if (now === null) return null;
    return tickMs > 0 ? Math.floor(now / tickMs) * tickMs : Math.floor(now);
  }, [tickMs]);

  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
