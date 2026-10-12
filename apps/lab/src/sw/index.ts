/**
 * Scenario Lab service worker (TOOLING, not product code). Bundled to /lab-sw.js (scope "/") as one self-contained script.
 *
 * It fakes the prototype's API for pages that are NESTED IFRAMES only (the Lab's device frame). Everything else (top-level tabs,
 * navigations, the Lab page itself) goes straight to the network, so the plain prototype stays untouched even in a browser that
 * has this worker installed.
 *
 *  - Messages: { type: 'SET_STATE', state } | { type: 'GET_STATE' } | { type: 'PING' } (replies on the MessagePort when given,
 *    otherwise to the sender).
 *  - State + DB survive worker restarts through Cache Storage.
 */
import { resolveApiPath } from '@pll/data/build-api';
import type { Db } from '@pll/data/db';
import { createDefaultState, resolveScenario, type ScenarioState } from '@pll/scenarios';

declare const self: ServiceWorkerGlobalScope;

const CACHE = 'pll-lab-v1';
const DB_URL = '/lab/db.json';
const STATE_URL = '/__lab/state.json';
const API_PREFIX = '/api/v1/';
const VERSION = 1;

// ---------------------------------------------------------------------------
// DB + state (memory first, Cache Storage as the backup)
// ---------------------------------------------------------------------------

let dbPromise: Promise<Db> | null = null;
let state: ScenarioState | null = null;
let statePromise: Promise<ScenarioState> | null = null;

function loadDb(): Promise<Db> {
  dbPromise ??= (async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(DB_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`db.json: ${res.status}`);
      await cache.put(DB_URL, res.clone());
      return (await res.json()) as Db;
    } catch (error) {
      const cached = await cache.match(DB_URL);
      if (cached) return (await cached.json()) as Db;
      throw error;
    }
  })().catch((error) => {
    dbPromise = null; // try again on the next request
    throw error;
  });
  return dbPromise;
}

async function persistState(next: ScenarioState): Promise<void> {
  const cache = await caches.open(CACHE);
  await cache.put(STATE_URL, new Response(JSON.stringify(next), { headers: { 'Content-Type': 'application/json' } }));
}

function loadState(): Promise<ScenarioState> {
  if (state) return Promise.resolve(state);
  statePromise ??= (async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(STATE_URL);
    if (hit) state = (await hit.json()) as ScenarioState;
    if (!state) {
      const db = await loadDb();
      state = createDefaultState(db.games[0]?.id ?? '');
    }
    return state;
  })();
  return statePromise;
}

// ---------------------------------------------------------------------------
// Lifecycle + messages
// ---------------------------------------------------------------------------

self.addEventListener('install', () => {
  void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      await Promise.allSettled([loadDb(), loadState()]);
    })(),
  );
});

type Message = { type: 'SET_STATE'; state: ScenarioState } | { type: 'GET_STATE' } | { type: 'PING' };

self.addEventListener('message', (event) => {
  const msg = event.data as Message | undefined;
  if (!msg || typeof msg !== 'object') return;
  const reply = (payload: unknown) => {
    const target = event.ports[0] ?? (event.source as Client | null);
    target?.postMessage(payload);
  };
  switch (msg.type) {
    case 'PING':
      reply({ type: 'PONG', version: VERSION });
      break;
    case 'GET_STATE':
      event.waitUntil(loadState().then((s) => reply({ type: 'STATE', state: s })));
      break;
    case 'SET_STATE':
      state = msg.state;
      statePromise = Promise.resolve(msg.state);
      event.waitUntil(persistState(msg.state).finally(() => reply({ type: 'STATE_SET' })));
      break;
  }
});

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Scenario-Lab': '1' },
  });

const errorBody = (status: number, message: string) => ({ error: { status, message } });

async function isNestedClient(event: FetchEvent): Promise<boolean> {
  if (!event.clientId) return false;
  const client = await self.clients.get(event.clientId);
  return client?.frameType === 'nested';
}

async function handleApi(path: string): Promise<Response> {
  const [scenario, db] = await Promise.all([loadState(), loadDb()]);
  if (scenario.network === 'offline') return Response.error();
  if (scenario.latencyMs > 0) await sleep(scenario.latencyMs);
  if (scenario.network === 'server_error') return json(errorBody(500, 'Simulated server error (Scenario Lab)'), 500);
  if (scenario.network === 'flaky' && Math.random() < 0.3) return json(errorBody(503, 'Simulated flaky network (Scenario Lab)'), 503);

  const resolved = resolveScenario(db, scenario, Date.now());
  const body = resolveApiPath(resolved.db, resolved.opts, path);
  if (body === undefined) return json(errorBody(404, `No such endpoint: ${path}`), 404);
  return json(body);
}

async function handle(event: FetchEvent, sameOrigin: boolean, path: string): Promise<Response> {
  if (!(await isNestedClient(event))) return fetch(event.request);
  if (sameOrigin) return handleApi(path);
  // Cross-origin (team logos, fonts, ...): only the offline scenario touches them.
  const scenario = await loadState();
  return scenario.network === 'offline' ? Response.error() : fetch(event.request);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Navigations are never faked (the frame loads the real static page); the decision about *who* asks is async,
  // but respondWith must be called synchronously, so we only claim the requests that could matter.
  if (request.mode === 'navigate') return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin) {
    if (request.method !== 'GET' || !url.pathname.startsWith(API_PREFIX) || !url.pathname.endsWith('.json')) return;
    const path = url.pathname.slice(API_PREFIX.length - 1).replace(/\.json$/, '');
    event.respondWith(handle(event, true, path));
    return;
  }
  // Media elements use range requests, which cannot be proxied through an opaque cross-origin response.
  if (request.destination === 'video' || request.destination === 'audio' || request.headers.has('range')) return;
  event.respondWith(handle(event, false, ''));
});
