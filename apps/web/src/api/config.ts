/**
 * The ONE place that knows where the API lives.
 *
 *   apiUrl(path) = API_BASE + path + API_SUFFIX
 *
 * Defaults point at the static files in public/api/v1/<path>.json. A real backend would set
 * NEXT_PUBLIC_API_SUFFIX to an empty string (and maybe NEXT_PUBLIC_API_BASE to a full origin).
 * `process.env.NEXT_PUBLIC_*` must be written literally so Next can inline the values.
 */
export const API_BASE: string = (process.env.NEXT_PUBLIC_API_BASE ?? '/api/v1').replace(/\/+$/, '');
export const API_SUFFIX: string = process.env.NEXT_PUBLIC_API_SUFFIX ?? '.json';

/** Validate every response against the zod contract in @pll/data (always in dev, opt-in in production). */
export const VALIDATE_RESPONSES: boolean =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_API_VALIDATE === '1';

/** `apiUrl('/games/abc/stats')` -> `/api/v1/games/abc/stats.json` */
export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}${API_SUFFIX}`;
}
