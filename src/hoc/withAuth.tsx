import React, { useEffect, ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const withAuth = <P extends object>(WrappedComponent: ComponentType<P>): ComponentType<P> => {
  const AuthWrapper: React.FC<P> = (props: P) => {
    const router = useRouter();
    const { IS_AUTHENTICATED } = useAuthStore.getState();

    useEffect(() => {
      const checkAuth = () => {
        if (!IS_AUTHENTICATED() && window.location.pathname !== '/auth/signin') {
          router.push('/auth/signin');
        } else if (IS_AUTHENTICATED() && window.location.pathname === '/auth/signin') {
          router.push('/');
        }
      };
      checkAuth();
    }, [router, IS_AUTHENTICATED]);

    // if (!IS_AUTHENTICATED() && window.location.pathname !== '/auth/signin') {
    //   router.push('/');
    // }

    return <WrappedComponent {...props} />;
  };

  return AuthWrapper;
};

export default withAuth;