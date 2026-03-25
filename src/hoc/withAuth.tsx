import React, { useEffect, ComponentType } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-toastify';

// Only validate token against backend once every 5 minutes
const TOKEN_VALIDATION_TTL_MS = 5 * 60 * 1000;
let lastValidatedAt = 0;

const withAuth = <P extends object>(WrappedComponent: ComponentType<P>): ComponentType<P> => {
  const AuthWrapper: React.FC<P> = (props: P) => {
    const router = useRouter();
    const { IS_AUTHENTICATED, GET_AUTH_TOKEN, CLEAR_AUTH_DATA } = useAuthStore.getState();

    useEffect(() => {
      const checkAuth = async () => {
        const isOnSignIn = window.location.pathname === '/auth/signin';

        if (!IS_AUTHENTICATED() && !isOnSignIn) {
          router.push('/auth/signin');
          return;
        }

        if (IS_AUTHENTICATED() && isOnSignIn) {
          router.push('/');
          return;
        }

        // Validate token against backend (skip if recently validated)
        if (IS_AUTHENTICATED() && !isOnSignIn) {
          if (Date.now() - lastValidatedAt < TOKEN_VALIDATION_TTL_MS) return;

          try {
            const token = GET_AUTH_TOKEN();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
              CLEAR_AUTH_DATA();
              toast.error('Your session has expired. Please login again.', {
                position: 'top-center',
                toastId: 'session-expired',
              });
              router.push('/auth/signin');
            } else {
              lastValidatedAt = Date.now();
            }
          } catch {
            // Network error — don't logout, user might be offline
          }
        }
      };
      checkAuth();
    }, [router, IS_AUTHENTICATED, GET_AUTH_TOKEN, CLEAR_AUTH_DATA]);

    return <WrappedComponent {...props} />;
  };

  return AuthWrapper;
};

export default withAuth;