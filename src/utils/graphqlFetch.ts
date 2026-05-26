import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-toastify';

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; extensions?: Record<string, any> }>;
}

/**
 * Thrown when the GraphQL endpoint responds with non-JSON (HTML error page,
 * 502 from nginx, maintenance mode, etc.). Surfaced separately so call sites
 * can render a friendly retry banner instead of the raw "Unexpected token '<'"
 * parse error that confused users when they used the browser back button.
 */
export class GraphQLConnectionError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'GraphQLConnectionError';
  }
}

// Module-level guard so the redirect/toast only fires once per session even
// when many in-flight hooks all hit a 401 at the same time. Reset on full
// page reload (which `handleSessionExpired` triggers via window.location).
let sessionExpiredHandled = false;

/**
 * Shared response-parsing logic used by both `graphqlFetch` and the legacy
 * `fetchWithRecache` helper. Detects auth failures (401/419), non-JSON
 * responses (HTML error pages, maintenance mode), and JSON parse failures —
 * mapping each into a typed error or a session-expired redirect.
 */
export async function parseGraphQLResponse<T = any>(
  response: Response,
): Promise<GraphQLResponse<T>> {
  if (response.status === 401 || response.status === 419) {
    handleSessionExpired();
    throw new GraphQLConnectionError('Session expired', response.status);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new GraphQLConnectionError(
      response.status >= 500
        ? 'The server is temporarily unavailable. Please try again.'
        : 'Connection lost. Please refresh the page and try again.',
      response.status,
    );
  }

  try {
    return (await response.json()) as GraphQLResponse<T>;
  } catch {
    throw new GraphQLConnectionError(
      'Received an invalid response from the server. Please retry.',
      response.status,
    );
  }
}

/**
 * Centralized GraphQL fetch with auth header attachment and defensive parsing.
 *
 * Why the defensive parsing matters: in production we have hit cases where
 * the user clicks the browser back button on a list page, the page restores
 * from bfcache and immediately refetches with a stale Sanctum token, and
 * Laravel returns an HTML error page. The old code did `await response.json()`
 * unconditionally and the resulting "Unexpected token '<'" message leaked
 * into the UI. This helper:
 *   1. Asks for JSON explicitly so Laravel returns JSON 401 instead of HTML
 *      redirects.
 *   2. Delegates response handling to `parseGraphQLResponse` (status sniff,
 *      content-type check, safe JSON parse).
 *   3. Also catches Lighthouse "Unauthenticated" errors that come back as
 *      200-with-errors instead of HTTP 401, and routes them through the same
 *      session-expired flow.
 */
export async function graphqlFetch<T = any>(
  query: string,
  variables?: Record<string, any>,
  options?: { signal?: AbortSignal },
): Promise<GraphQLResponse<T>> {
  const token = useAuthStore.getState().GET_AUTH_TOKEN();

  let response: Response;
  try {
    response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
      signal: options?.signal,
    });
  } catch (err) {
    // Preserve AbortError so callers using AbortController can detect cancellation.
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new GraphQLConnectionError(
      'Cannot reach the server. Please check your connection and retry.',
    );
  }

  const result = await parseGraphQLResponse<T>(response);

  const hasAuthError = result.errors?.some(
    (e) =>
      e.message?.toLowerCase().includes('unauthenticated') ||
      e.extensions?.category === 'authentication',
  );
  if (hasAuthError) {
    handleSessionExpired();
    throw new GraphQLConnectionError('Session expired');
  }

  return result;
}

export function handleSessionExpired(): void {
  if (sessionExpiredHandled) return;
  sessionExpiredHandled = true;
  useAuthStore.getState().CLEAR_AUTH_DATA();
  toast.error('Your session has expired. Please login again.', {
    position: 'top-center',
    toastId: 'session-expired',
  });
  if (typeof window !== 'undefined') {
    window.location.href = '/auth/signin';
  }
}

/**
 * Test-only: reset the one-shot guard so multiple test cases in the same
 * module process don't bleed state. Production flow resets the flag by
 * triggering a full page reload via `window.location.href` inside
 * `handleSessionExpired`, so this is never needed at runtime.
 */
export function resetSessionExpiredHandled(): void {
  sessionExpiredHandled = false;
}
