import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Db } from '@pll/data/db';
import {
  applyPreset,
  resolveScenario,
  seek,
  setPlaying as setClockPlaying,
  setSpeed as setClockSpeed,
  stateFromHash,
  stateToHash,
  type DataFlagKey,
  type NetworkMode,
  type ResolvedScenario,
  type ScenarioState,
} from '@pll/scenarios';
import { pushState, registerServiceWorker } from './lib/sw-client';

export const gameSrc = (gameId: string) => `/ncaa/game/${encodeURIComponent(gameId)}/`;

export interface Lab {
  status: 'booting' | 'ready' | 'error';
  error: string | null;
  db: Db | null;
  state: ScenarioState | null;
  info: ResolvedScenario['info'] | null;
  frame: { src: string; token: number } | null;
  selectGame(id: string): void;
  selectPreset(id: string): void;
  seek(elapsed: number): void;
  setPlaying(playing: boolean): void;
  setSpeed(speed: number): void;
  setNetwork(mode: NetworkMode): void;
  setLatency(ms: number): void;
  toggleFlag(key: DataFlagKey): void;
  reload(): void;
}

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (intervalMs <= 0) return;
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

/** All Lab state: the scenario, the service worker connection, the iframe, and the URL hash. */
export function useLab(): Lab {
  const [status, setStatus] = useState<Lab['status']>('booting');
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<Db | null>(null);
  const [state, setState] = useState<ScenarioState | null>(null);
  const [frame, setFrame] = useState<Lab['frame']>(null);
  const stateRef = useRef<ScenarioState | null>(null);
  const dbRef = useRef<Db | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const lastHash = useRef('');

  const fail = useCallback((e: unknown) => {
    setError(e instanceof Error ? e.message : String(e));
    setStatus('error');
  }, []);

  /** Update the state, push it to the worker (in order), and optionally reload the frame once the worker has it. */
  const commit = useCallback(
    (next: ScenarioState, reload: boolean) => {
      stateRef.current = next;
      setState(next);
      queue.current = queue.current
        .then(() => pushState(next))
        .then(() => {
          if (reload) setFrame((f) => ({ src: gameSrc(next.gameId), token: (f?.token ?? 0) + 1 }));
        })
        .catch(fail);
    },
    [fail],
  );

  // Boot: DB -> state from the URL hash -> service worker (wait until it controls the page) -> first frame.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`${import.meta.env.BASE_URL}db.json`);
      if (!res.ok) throw new Error(`Could not load db.json (${res.status}).`);
      const loaded = (await res.json()) as Db;
      if (cancelled) return;
      dbRef.current = loaded;
      setDb(loaded);
      const fallback = (loaded.games.find((g) => g.status === 'live') ?? loaded.games[0])?.id ?? '';
      const initial = stateFromHash(loaded, window.location.hash, fallback, Date.now());
      await registerServiceWorker();
      await pushState(initial);
      if (cancelled) return;
      stateRef.current = initial;
      setState(initial);
      setFrame({ src: gameSrc(initial.gameId), token: 1 });
      setStatus('ready');
    })().catch((e) => !cancelled && fail(e));
    return () => {
      cancelled = true;
    };
  }, [fail]);

  // State -> URL hash (replaceState, so the back button is not polluted).
  useEffect(() => {
    if (!db || !state) return;
    const hash = stateToHash(db, state);
    lastHash.current = hash;
    if (window.location.hash !== hash) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
  }, [db, state]);

  // URL hash -> state (someone pastes a scenario link into this tab).
  useEffect(() => {
    const onHashChange = () => {
      const loaded = dbRef.current;
      const current = stateRef.current;
      if (!loaded || !current || window.location.hash === lastHash.current) return;
      commit(stateFromHash(loaded, window.location.hash, current.gameId, Date.now()), true);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [commit]);

  const now = useNow(state?.clock.playing ? 500 : 0);
  const info = useMemo(() => (db && state ? resolveScenario(db, state, now).info : null), [db, state, now]);

  const withState = useCallback(
    (fn: (db: Db, s: ScenarioState) => { next: ScenarioState; reload: boolean } | null) => {
      const d = dbRef.current;
      const s = stateRef.current;
      if (!d || !s) return;
      const result = fn(d, s);
      if (result) commit(result.next, result.reload);
    },
    [commit],
  );

  return {
    status,
    error,
    db,
    state,
    info,
    frame,
    selectGame: (id) =>
      withState((d, s) => ({
        next: { ...applyPreset(d, id, s.presetId), network: s.network, latencyMs: s.latencyMs, dataFlags: s.dataFlags },
        reload: true,
      })),
    selectPreset: (id) => withState((d, s) => ({ next: applyPreset(d, s.gameId, id), reload: true })),
    seek: (elapsed) => withState((_d, s) => ({ next: seek(s, elapsed, Date.now()), reload: true })),
    setPlaying: (playing) => withState((d, s) => ({ next: setClockPlaying(d, s, playing, Date.now()), reload: playing })),
    setSpeed: (speed) => withState((d, s) => ({ next: setClockSpeed(d, s, speed, Date.now()), reload: false })),
    setNetwork: (mode) =>
      withState((_d, s) => ({
        next: { ...s, network: mode, latencyMs: mode === 'slow' && s.latencyMs < 500 ? 2500 : s.latencyMs },
        reload: false,
      })),
    setLatency: (ms) => withState((_d, s) => ({ next: { ...s, latencyMs: ms }, reload: false })),
    toggleFlag: (key) =>
      withState((_d, s) => ({ next: { ...s, dataFlags: { ...s.dataFlags, [key]: !s.dataFlags[key] } }, reload: true })),
    reload: () => setFrame((f) => (f ? { ...f, token: f.token + 1 } : f)),
  };
}
