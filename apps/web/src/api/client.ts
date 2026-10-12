import { VALIDATE_RESPONSES, apiUrl } from './config';

/**
 * What went wrong, so the UI can tell the user the right thing:
 *  - offline  the browser reports no connection
 *  - network  fetch itself failed (DNS, CORS, server down) while the browser thinks it is online
 *  - http     the server answered with a non-2xx status (see `status`)
 *  - parse    the body was not JSON or not the `{ data, meta }` envelope
 *  - schema   valid JSON that violates the contract (only checked when validation is on)
 */
export type ApiErrorKind = 'offline' | 'network' | 'http' | 'parse' | 'schema';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly url: string;

  constructor(kind: ApiErrorKind, url: string, message: string, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = 'ApiError';
    this.kind = kind;
    this.url = url;
    this.status = options?.status ?? null;
  }

  /** Worth retrying automatically? Transient failures only. */
  get retryable(): boolean {
    if (this.kind === 'network') return true;
    if (this.kind === 'http') return this.status === 408 || this.status === 429 || (this.status ?? 0) >= 500;
    return false;
  }

  get isNotFound(): boolean {
    return this.kind === 'http' && this.status === 404;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

/** Minimal structural type of a zod schema, so this module does not depend on zod. */
export interface ResponseSchema {
  safeParse(data: unknown): { success: true } | { success: false; error: { message: string } };
}

export interface ApiGetOptions {
  signal?: AbortSignal;
  /**
   * Lazy schema loader. Only called when VALIDATE_RESPONSES is on, so zod stays out of the
   * critical path in production.
   */
  schema?: () => Promise<ResponseSchema>;
}

function isEnvelope(value: unknown): value is { data: unknown; meta: { serverTime: string } } {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  const meta = v.meta as Record<string, unknown> | undefined;
  return 'data' in v && typeof meta === 'object' && meta !== null && typeof meta.serverTime === 'string';
}

const browserIsOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

/** GET `path` (relative to the API base) and return the parsed `{ data, meta }` envelope. */
export async function apiGet<T>(path: string, options: ApiGetOptions = {}): Promise<T> {
  const url = apiUrl(path);

  if (browserIsOffline()) throw new ApiError('offline', url, 'The browser is offline.');

  let response: Response;
  try {
    response = await fetch(url, {
      signal: options.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-cache', // always revalidate: live games must not be served stale from the HTTP cache
    });
  } catch (cause) {
    if (options.signal?.aborted) throw cause; // cancelled by TanStack Query, not an error to show
    if (browserIsOffline()) throw new ApiError('offline', url, 'The browser went offline.', { cause });
    throw new ApiError('network', url, `Network request failed for ${url}.`, { cause });
  }

  if (!response.ok) {
    throw new ApiError('http', url, `${response.status} ${response.statusText} for ${url}`, {
      status: response.status,
    });
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (cause) {
    throw new ApiError('parse', url, `Response from ${url} is not valid JSON.`, { cause });
  }
  if (!isEnvelope(json)) {
    throw new ApiError('parse', url, `Response from ${url} is not a { data, meta } envelope.`);
  }

  if (VALIDATE_RESPONSES && options.schema) {
    const schema = await options.schema();
    const result = schema.safeParse(json);
    if (!result.success) {
      throw new ApiError('schema', url, `Response from ${url} violates the API contract:\n${result.error.message}`);
    }
  }

  return json as T;
}
