/** Seeded, deterministic RNG (xmur3 string hash -> mulberry32). No Math.random anywhere in the generator. */

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  float(min: number, max: number): number;
  chance(p: number): boolean;
  pick<T>(items: readonly T[]): T;
  weighted<T>(items: readonly T[], weight: (item: T) => number): T;
  sampleWithout<T>(items: readonly T[], n: number, weight: (item: T) => number): T[];
  shuffle<T>(items: readonly T[]): T[];
  normal(mean?: number, sd?: number): number;
  exp(mean: number): number;
  hex(length: number): string;
  fork(label: string): Rng;
}

function hashString(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

export function createRng(seed: string): Rng {
  let state = hashString(seed);
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rng: Rng = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    float: (min, max) => min + next() * (max - min),
    chance: (p) => next() < p,
    pick: (items) => {
      if (items.length === 0) throw new Error('pick() from empty list');
      return items[Math.floor(next() * items.length)] as (typeof items)[number];
    },
    weighted: (items, weight) => {
      if (items.length === 0) throw new Error('weighted() from empty list');
      const weights = items.map((item) => Math.max(0, weight(item)));
      const total = weights.reduce((a, b) => a + b, 0);
      if (total <= 0) return items[Math.floor(next() * items.length)] as (typeof items)[number];
      let r = next() * total;
      for (let i = 0; i < items.length; i++) {
        r -= weights[i] as number;
        if (r < 0) return items[i] as (typeof items)[number];
      }
      return items[items.length - 1] as (typeof items)[number];
    },
    sampleWithout: (items, n, weight) => {
      const pool = [...items];
      const out: (typeof items)[number][] = [];
      while (out.length < n && pool.length > 0) {
        const chosen = rng.weighted(pool, weight);
        out.push(chosen);
        pool.splice(pool.indexOf(chosen), 1);
      }
      return out;
    },
    shuffle: (items) => {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j] as (typeof out)[number], out[i] as (typeof out)[number]];
      }
      return out;
    },
    normal: (mean = 0, sd = 1) => {
      const u = Math.max(next(), 1e-12);
      const v = next();
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    exp: (mean) => -mean * Math.log(1 - next()),
    hex: (length) => {
      let s = '';
      while (s.length < length) s += Math.floor(next() * 16).toString(16);
      return s;
    },
    fork: (label) => createRng(`${seed}/${label}`),
  };
  return rng;
}

/** RFC-4122-shaped (v4) id drawn from the RNG, so ids are stable across runs. */
export function uuid(rng: Rng): string {
  const variant = '89ab'[rng.int(0, 3)] as string;
  return `${rng.hex(8)}-${rng.hex(4)}-4${rng.hex(3)}-${variant}${rng.hex(3)}-${rng.hex(12)}`;
}
