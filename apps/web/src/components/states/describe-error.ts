import { isApiError } from '@/api/client';

export interface ErrorCopy {
  title: string;
  message: string;
  /** Does trying again make sense? (A 404 will not fix itself.) */
  canRetry: boolean;
}

/** Turns any thrown value into user-facing copy. Keep wording here, not in components. */
export function describeError(error: unknown): ErrorCopy {
  if (!isApiError(error)) {
    return { title: 'Something went wrong', message: 'An unexpected error occurred.', canRetry: true };
  }
  switch (error.kind) {
    case 'offline':
      return {
        title: "You're offline",
        message: "Check your connection. We'll load this as soon as you're back online.",
        canRetry: true,
      };
    case 'network':
      return {
        title: "Can't reach the server",
        message: 'The connection failed. Check your network and try again.',
        canRetry: true,
      };
    case 'http':
      if (error.status === 404) {
        return { title: 'Not found', message: "We couldn't find what you were looking for.", canRetry: false };
      }
      if ((error.status ?? 0) >= 500) {
        return {
          title: 'Server problem',
          message: 'Something went wrong on our side. Please try again in a moment.',
          canRetry: true,
        };
      }
      return { title: 'Request failed', message: `The server refused the request (${error.status}).`, canRetry: true };
    case 'parse':
    case 'schema':
      return {
        title: 'Unexpected data',
        message: "The server sent something we couldn't read. Please try again later.",
        canRetry: true,
      };
  }
}
