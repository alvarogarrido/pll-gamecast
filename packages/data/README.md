# @pll/data

Data engine for the Gamecast prototype: a text-file database (JSON) compiled by one pure function, `buildApi()`, into a
static JSON API. The same function runs in the browser (Scenario Lab service worker) with modified inputs.

```
db/*.json  --loadDbFromDisk-->  Db (memory)  --buildApi(db, opts)-->  Map<path, response>  --emit-->  apps/web/public/api/v1/**.json
```

## Regenerate

```bash
npm run generate -w @pll/data   # seeded + deterministic: rewrites packages/data/db/ from scratch
npm run build -w @pll/data      # db/ -> apps/web/public/api/v1/** (validated, cleans the folder first) + media placeholders
npm run typecheck -w @pll/data
npm test -w @pll/data
```

`generate` takes an optional seed (`npm run generate -w @pll/data -- some-seed`); the committed DB uses the default seed
(`il-2027-d`). Same seed, same bytes. The `db/` folder is the database and is committed (about 2.8 MB).

## The text DB (`db/`)

| File | Contents |
| --- | --- |
| `meta.json` | `{ snapshotTime, season: 2027, currentWeek }`. Snapshot = Sat Mar 13 2027, 3:30 PM ET (`2027-03-13T20:30:00Z`), week 6 |
| `conferences.json` | ACC, Big Ten, Ivy, Big East |
| `teams.json` | 16 real D1 programs: colors, mascot, ESPN CDN logo, head coach (null when unsure), record, rank/RPI as of the snapshot |
| `players.json` | 33 invented players per team (2 FO, 3 G, 7 A, 10 M, 3 LSM, 2 SSDM, 6 D) with season totals from the final games |
| `games.json` | 45 games: weeks 1-5 (final), the week-6 Saturday slate, one future NCAA quarterfinal (May 15, neutral site, seeds) |
| `plays/{gameId}.json` | the complete simulated play log of every game, including scheduled and live ones |
| `articles.json`, `videos.json` | previews for every game, recaps for finals; videos use `/media/placeholder-thumb.svg` and a public sample mp4 |
| `staff.json`, `staff-picks.json` | 4 Inside Lacrosse staffers; picks for about half the games |
| `injuries.json` | a handful of injuries (out/doubtful players are excluded from later simulated games) |
| `insights.json` | editorial insights only; streaks, lead changes, etc. are derived at build time |

The week-6 slate: 3 final (Penn at Cornell, Michigan at Ohio State, Georgetown at Virginia), 2 live (Duke at Notre Dame,
Q4 2:23 left and tied; Maryland at Johns Hopkins, Q2 7:09 left), 3 scheduled (North Carolina at Syracuse in the JMA
Wireless Dome, Yale at Princeton, Penn State at Denver).

`status` and `snapshotElapsedSeconds` describe the world at `snapshotTime`. Every game has a full log; the API only
reveals what has happened by the effective status/elapsed time.

Conventions: percentages are fractions 0..1; clocks are integer seconds; `elapsedSeconds` counts game-clock seconds since the
opening faceoff (OT periods continue after 3600, 240 s each, sudden victory). Poll rank / RPI in `teams.json` are the last
published poll (before the final games of the snapshot Saturday); `rankAfter`/`rpiAfter` on those three finals are the
provisional movement. Team and player season totals include only final games (live games are excluded).

## API paths (relative to `/api/v1`, `.json` suffix on disk)

Keys of the `buildApi()` map are paths without base or suffix. Every value is `{ data, meta: { serverTime } }` and
validates against the schema in `src/api.ts`.

| Path | Schema |
| --- | --- |
| `/scoreboard` | `ScoreboardResponse`, games of `meta.currentWeek` ordered by start time |
| `/games/{id}` | `GameDetail` |
| `/games/{id}/stats` | `GameStats` (team box score, player stats, player refs) |
| `/games/{id}/plays` | `GamePlays` (chronological, server-rendered descriptions, running score and win probability) |
| `/games/{id}/win-probability` | `WinProbabilitySeries` |
| `/games/{id}/insights` | `GameInsights` (derived + editorial, chronological) |
| `/games/{id}/preview` | `GamePreview` (rosters, injuries, season averages, last 3 results, standings, staff picks) |
| `/games/{id}/media` | `GameMedia` |

## Pure modules (browser-safe, no `node:` imports)

- `src/db.ts`: `Db`, `validateDb()` (zod + referential integrity), `checkDbIntegrity()`.
- `src/derive.ts` (barrel): clock helpers, `computeBoxScore`, `scoreFromPlays`, `playsUpTo`, `describePlay`,
  `winProbabilityHome`, `autoInsights`, season averages, previous results, conference standings.
- `src/build-api.ts`: `buildApi(db, opts)`, `resolveApiPath(db, opts, path)`, `createApi()`, `validateApi()`, `schemaForPath()`.
- Node-only code lives in `scripts/` (`load-db.ts`, `generate.ts`, `emit-static-api.ts`); the simulator is in `scripts/gen/`.

### Scenario Lab overrides

```ts
buildApi(db, {
  now: '2027-03-13T22:00:00Z',                 // meta.serverTime (default db.meta.snapshotTime)
  elapsedOverrides: { [gameId]: 1500 },        // put the game in progress at game-second 1500 (null = use the DB)
  statusOverrides: { [gameId]: 'scheduled' },  // 'final' reveals the whole log; 'scheduled' hides it
});
```

An elapsed override makes the game `live` (unless a status override says otherwise); an elapsed at or past the end of the
log makes it `final`. Period boundaries belong to the period that is ending (clock 0:00, `break`/`halftime`), so the next
period's plays stay hidden until it starts. Standings and records follow the effective statuses. Pass a new `Db` object
(do not mutate in place) when the underlying data changes.

### Modelling notes

- Win probability: logistic on the normal approximation of the remaining goal differential, using score margin, time
  remaining and the pregame prior (`src/win-probability.ts`); strictly inside (0, 1), 0.9995/0.0005 once a game is decided.
- Extra-man opportunities = penalties drawn; a penalty ends on the first extra-man goal.
- A player "appears" in a game when named in any play (shooter, assister, goalie on a shot faced, faceoff loser, ...),
  which defines `gamesPlayed`.
