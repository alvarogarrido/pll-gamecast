import type { Db } from '@pll/data/db';
import type { DataFlags } from './types';

const LONG_SCHOOL = ' State University of Applied Lacrosse and Athletic Excellence';
const LONG_MASCOT = 'Fighting Mountain Thunderbirds of the North';
const LONG_NAME = 'Maximilian-Alexander Featherstonehaugh-Villanueva';

const key = (f: DataFlags) =>
  [f.hideWeather, f.hideRanks, f.hidePhotos, f.noPlays, f.noMedia, f.longNames].map(Number).join('');

const cache = new WeakMap<Db, Map<string, Db>>();

/**
 * Returns a NEW Db with the data flags applied (the input is never mutated). Unchanged parts are shared with the input, which
 * keeps `buildApi`'s per-play-log box score cache effective. Results are memoised per (db, flags).
 */
export function applyDataFlags(db: Db, flags: DataFlags): Db {
  const k = key(flags);
  if (k === '000000') return db;
  let byFlags = cache.get(db);
  if (!byFlags) cache.set(db, (byFlags = new Map()));
  const hit = byFlags.get(k);
  if (hit) return hit;

  const out: Db = { ...db };
  if (flags.hideWeather) out.games = out.games.map((g) => ({ ...g, weather: null }));
  if (flags.hideRanks) {
    out.games = out.games.map((g) => ({
      ...g,
      home: { ...g.home, rankBefore: null, rankAfter: null, rpiBefore: null, rpiAfter: null },
      away: { ...g.away, rankBefore: null, rankAfter: null, rpiBefore: null, rpiAfter: null },
    }));
    out.teams = out.teams.map((t) => ({ ...t, nationalRank: null, rpi: null }));
  }
  if (flags.hidePhotos) {
    out.players = out.players.map((p) => ({ ...p, photoUrl: null }));
    out.staff = out.staff.map((s) => ({ ...s, photoUrl: null }));
    out.articles = out.articles.map((a) => ({ ...a, imageUrl: null }));
  }
  if (flags.noPlays) out.plays = Object.fromEntries(Object.keys(db.plays).map((id) => [id, []]));
  if (flags.noMedia) {
    out.videos = [];
    out.articles = [];
    out.games = out.games.map((g) => ({ ...g, previewArticleId: null, recapArticleId: null }));
  }
  if (flags.longNames) {
    out.teams = out.teams.map((t) => ({
      ...t,
      school: `${t.school}${LONG_SCHOOL}`,
      mascot: `${t.mascot} ${LONG_MASCOT}`,
      headCoach: t.headCoach ? `${t.headCoach}-${LONG_NAME}` : t.headCoach,
    }));
    out.players = out.players.map((p) => ({ ...p, lastName: `${p.lastName}-${LONG_NAME}` }));
    out.staff = out.staff.map((s) => ({ ...s, name: `${s.name} ${LONG_NAME}` }));
  }
  byFlags.set(k, out);
  return out;
}
