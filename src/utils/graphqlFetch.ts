import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-toastify';

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; extensions?: Record<string, any> }>;
}

/**
 * Centralized GraphQL fetch with automatic auth error handling.
 * When the token is invalid or expired, clears auth state and redirects to login.
 */
export async function graphqlFetch<T = any>(
  query: string,
  variables?: Record<string, any>,
): Promise<GraphQLResponse<T>> {
  const { GET_AUTH_TOKEN } = useAuthStore.getState();
  const token = GET_AUTH_TOKEN();

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  // HTTP-level auth failure (e.g. if auth:sanctum middleware is added later)
  if (response.status === 401) {
    handleSessionExpired();
    throw new Error('Session expired');
  }

  const result: GraphQLResponse<T> = await response.json();

  // GraphQL-level auth failure (resolver threw "Unauthenticated")
  const hasAuthError = result.errors?.some(
    (e) =>
      e.message?.toLowerCase().includes('unauthenticated') ||
      e.extensions?.category === 'authentication',
  );

  if (hasAuthError) {
    handleSessionExpired();
    throw new Error('Session expired');
  }

  return result;
}

function handleSessionExpired(): void {
  const { CLEAR_AUTH_DATA } = useAuthStore.getState();
  CLEAR_AUTH_DATA();
  toast.error('Your session has expired. Please login again.', {
    position: 'top-center',
    toastId: 'session-expired',
  });
  window.location.href = '/auth/signin';
}
