# Scenario Lab (tooling, not product)

A separate tool that lets designers and stakeholders look at the prototype (`apps/web`) in different situations: start of season,
pregame, live at any moment, final, no internet, slow or failing API, missing data, and more to come.

It is **completely detached**: `apps/web` contains no lab or scenario code and never imports from here. The Lab runs the normal,
unmodified prototype in an iframe and changes what the prototype's `fetch('/api/v1/...json')` calls return from the outside.

```
Lab page (/lab/)                          Service worker (/lab-sw.js, scope /)
  Settings panel -- SET_STATE ----------->  keeps ScenarioState + db.json (memory + Cache Storage)
  <iframe src=/ncaa/game/<id>/>             nested iframes only:
     app: fetch('/api/v1/games/x.json') ->    resolveScenario(db, state, now) -> resolveApiPath() -> JSON
                                              + latency / offline / 500 / flaky 503
```

## Run it

```bash
npm run dev:lab        # next dev (apps/web, :3000) + Lab Vite dev server; open http://localhost:5173/lab/
npm run build:site     # production site in ./site  (prototype at /, Lab at /lab/, Storybook at /storybook/)
npm run preview:site   # serves ./site on :4173 with Vercel-like clean URLs, for checking the production build
```

Deploys with the root `vercel.json` (`npm run build:site`, output `site/`, `/` redirects to `/lab/`).

### What `build:site` produces

| Path in `site/` | From |
| --- | --- |
| `/` and `/ncaa/game/<id>/` ... | `apps/web/out` (the static export, untouched) |
| `/lab/` | `apps/lab` (Vite, base `/lab/`) |
| `/lab/db.json` | the whole DB as one object (`packages/data/db`, same shape as `Db`) read by the service worker and the Lab |
| `/lab-sw.js` | `apps/lab/src/sw/index.ts` bundled by `vite.sw.config.ts`. It lives at the **site root** because a worker's scope cannot be wider than its own folder and the app's API calls come from `/ncaa/...`, not `/lab/...` |
| `/storybook/` | `npm run build-storybook -w @pll/ui` |

`npm run build:site -- --skip=web,storybook` skips steps while iterating (it then re-uses the last outputs).

### Dev workflow details

- `npm run dev:lab` (`scripts/dev-lab.mjs`) starts both servers and stops both on Ctrl+C.
- Vite (port 5173, base `/lab/`) **proxies every path that is not the Lab's own** (`/lab/*`, `/lab-sw.js`) to `http://localhost:3000`
  (override with `LAB_WEB_ORIGIN`), websockets included, so the iframe is same-origin and Next's HMR works.
- In dev, `/lab-sw.js` and `/lab/db.json` are served by the `lab-dev-assets` plugin in `vite.config.ts`: the worker is bundled on
  demand with `vite.sw.config.ts` and re-bundled when anything under `src/sw`, `packages/scenarios/src` or `packages/data/src` changes
  (reload the Lab after editing the worker; it is served with `Cache-Control: no-cache` and `skipWaiting`/`clients.claim`).
- Service workers need `localhost` or https. Hard reloads (Shift+Reload) bypass the worker: the Lab then says so; reload normally.

## How the pieces work

- **`packages/scenarios`** (pure TypeScript, tested with vitest): `ScenarioState`, `presets`, `resolveScenario(db, state, realNowMs)`.
  It returns a *new* `Db` plus `BuildApiOptions` (`now`, `elapsedOverrides`, `statusOverrides`), which the service worker feeds to
  `resolveApiPath` from `@pll/data/build-api`. The DB is never mutated.
- **Time**: the focus game is either *elapsed-driven* (`perGame[gameId].elapsedSeconds` is a number; `serverTime` follows the game) or
  *time-driven* (`nowOverride` set; every game derives its status from that moment, so Pregame can play into kickoff at 60x). While
  playing, `elapsed = anchorElapsed + (realNow - anchorRealMs) / 1000 x speed`; at the end of the log the game becomes final.
- **Time travel consistency**: whenever the world is not the DB snapshot, the other games derive from the same moment, the scoreboard
  shows the focus game's week and every side's `recordBefore` is recomputed from the games that are final then.
- **Network** (service worker): `offline` -> `Response.error()` (also for cross-origin requests such as ESPN logos); `server_error` -> 500
  JSON; `flaky` -> 30% 503; `latencyMs` is added to every non-offline call. The Lab also sets `navigator.onLine = false` inside the
  iframe (and fires `offline`) because the app checks it; this is re-applied after every iframe load.
- **Only nested iframes are faked.** The worker checks `(await clients.get(event.clientId))?.frameType === 'nested'` and never touches
  navigations. A top-level tab on `/ncaa/game/<id>/` always shows the shipped data, even in a browser that has the worker installed.
- **Reloads**: changing game, preset, scrubbing, data flags and pressing Play reload the iframe (the app would not notice by polling);
  network, latency, speed and pause do not. While the clock plays, the app's own 15 s polling picks up new plays.
- **Share a scenario**: the Lab URL hash holds it, e.g. `/lab/#game=<id>&preset=live-q4` (plus `t=<elapsed>`, `net=`, `lat=`, `flags=`
  when they differ from the preset). "Copy scenario link" copies it.

## Add a scenario

Edit `packages/scenarios/src/presets.ts` and append to `presets` (order = order in the Lab):

```ts
{
  id: 'q3-blowout',                       // used in the URL hash, keep it stable
  label: 'Live: Q3 blowout',
  description: 'Shown under the buttons.',
  // optional: grey the button out (with a reason) for games it does not suit
  availability: (db, gameId) => (hasBlowout(db, gameId) ? { enabled: true } : { enabled: false, note: 'No blowout in this game.' }),
  // return only what differs from the default snapshot
  apply: (db, gameId) => ({
    perGame: { [gameId]: { elapsedSeconds: 2300 } },
    clock: { playing: false, speed: 1, anchorRealMs: 0, anchorElapsed: 2300 },
    // nowOverride: '2027-03-13T19:00:00Z',          // time-driven alternative
    // network: 'flaky', latencyMs: 800,
    // dataFlags: { noMedia: true, ... },
  }),
},
```

Add a test next to the others in `packages/scenarios/test/`. Run `npm test -w @pll/scenarios`. A new *data* flag goes in
`DataFlags` (`types.ts`), `applyDataFlags` (`flags.ts`) and the toggle list in `src/components/SettingsPanel.tsx`; a new *network*
behaviour goes in `src/sw/index.ts`.

## Findings: "Start of season" and `buildApi`

`buildApi`'s `statusOverrides` + `now` alone are **not enough** to reach a true 0-0 season:

- Standings, season averages and "previous results" derive from the games that are final, so they do become empty. 
- `GameSide.record` is stored per game (`recordBefore`) and **is not derived**, so it still shows the week-6 records.
- `scoreboard` shows `db.meta.currentWeek`, which is fixed.

`resolveScenario` therefore also (when the world is not the snapshot) recomputes `recordBefore` from the effective finals and sets
`meta.currentWeek` to the focus game's week, all on a copy of the DB. A test checks that doing this at the snapshot moment reproduces
the shipped records exactly. Ranks / RPI are left as shipped (use "No ranks / RPI" to hide them); a real preseason poll is not modelled.

## Known limitations

- "No plays" empties the play log, so scores derived from it (including final scores in the scoreboard) become 0-0 by construction.
- Video/audio and `Range` requests are never routed through the worker (opaque 206 responses break media playback), so they keep
  working offline.
- Requests made by workers inside the iframe (`frameType` `none`) are not intercepted; the prototype has none.
- Browsers that disable service workers (some embedded webviews, private modes) cannot run the Lab; it shows the reason.
