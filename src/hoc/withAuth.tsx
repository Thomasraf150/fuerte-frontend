import React, { useEffect, ComponentType } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useAuthStore } from '@/store/authStore';
import { handleSessionExpired } from '@/utils/graphqlFetch';

// Only validate token against backend once every 5 minutes
const TOKEN_VALIDATION_TTL_MS = 5 * 60 * 1000;
let lastValidatedAt = 0;

const withAuth = <P extends object>(WrappedComponent: ComponentType<P>): ComponentType<P> => {
  const AuthWrapper: React.FC<P> = (props: P) => {
    const router = useRouter();
    const { IS_AUTHENTICATED, GET_AUTH_TOKEN } = useAuthStore.getState();

    useEffect(() => {
      const checkAuth = async (force = false) => {
        const isOnSignIn = window.location.pathname === '/auth/signin';

        if (!IS_AUTHENTICATED() && !isOnSignIn) {
          router.push('/auth/signin');
          return;
        }

        if (IS_AUTHENTICATED() && isOnSignIn) {
          router.push('/');
          return;
        }

        // Validate token against backend (skip if recently validated, unless forced)
        if (IS_AUTHENTICATED() && !isOnSignIn) {
          if (!force && Date.now() - lastValidatedAt < TOKEN_VALIDATION_TTL_MS) return;

          try {
            const token = GET_AUTH_TOKEN();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
              },
            });

            if (!res.ok) {
              handleSessionExpired();
            } else {
              lastValidatedAt = Date.now();
            }
          } catch {
            // Network error — don't logout, user might be offline
          }
        }
      };

      checkAuth();

      // bfcache fix: when the user navigates back/forward and the browser
      // restores this page from bfcache, the useEffect above does NOT re-fire
      // and the 5-minute throttle on lastValidatedAt may still be valid even
      // though the Sanctum token was invalidated server-side (logout in another
      // tab, server restart, etc.). Listen for the `pageshow` event with
      // `persisted: true` and force a fresh revalidation. Without this, the
      // first data fetch after back-nav hits the server with a stale token,
      // gets an HTML 401 page, and the old `await response.json()` would
      // surface "Unexpected token '<'" in the UI.
      const onPageShow = (event: PageTransitionEvent) => {
        if (event.persisted) {
          lastValidatedAt = 0;
          checkAuth(true);
        }
      };
      window.addEventListener('pageshow', onPageShow);
      return () => window.removeEventListener('pageshow', onPageShow);
    }, [router, IS_AUTHENTICATED, GET_AUTH_TOKEN]);

    return <WrappedComponent {...props} />;
  };

  return AuthWrapper;
};

export default withAuth;
