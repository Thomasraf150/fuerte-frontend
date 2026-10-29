import { useState, useEffect } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { toast } from '@/utils/notify';
import "react-toastify/dist/ReactToastify.css";
import { useAuthStore } from "@/store";
  
interface LoginData {
  email: string;
  password: string;
}

// The API hands back a signed device token on every sign-in. Sending it again puts this browser's
// failed sign-ins in a counter of its own, so a stranger failing 20 times cannot lock the account
// out here (AuthController::MAX_FAILED_LOGINS). Not a credential; kept across Log Out on purpose.
const DEVICE_TOKEN_KEY = 'fuerte_login_device';

const readDeviceToken = (): string | undefined => {
  try {
    return localStorage.getItem(DEVICE_TOKEN_KEY) ?? undefined;
  } catch {
    return undefined;
  }
};

const saveDeviceToken = (token: unknown): void => {
  if (typeof token !== 'string' || token === '') return;
  try {
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  } catch {
    // Private mode or blocked storage: the browser just shares the account's counter.
  }
};

const useLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const router = useRouter();
  const { SET_AUTH_DATA } = useAuthStore.getState();

  const submit = async (data: LoginData) => {
    setLoginLoading(true);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/login', {
        method: "POST",
        // No credentials: 'include'. The API sets no cookie since 2026-10-29 and
        // takes the token from the Authorization header only.
        headers: {'Content-Type': 'application/json', Accept: 'application/json'},
        body: JSON.stringify({ ...data, device_token: readDeviceToken() })
      });

      if (response.ok) {
        const res = await response.json();
        saveDeviceToken(res.device_token);
        SET_AUTH_DATA(res.user, res.token);
        toast.success("You're logged in!");
        router.push(res.user?.role?.code === 'CALLCTR' ? '/applications' : '/');
        return { success: true, data: res };
      } else {
        // Don't blame the password for every failure. /api/login is rate limited
        // to 5 attempts per minute per account (RouteServiceProvider's 'login'
        // limiter), and 20 failures in an hour lock the account for up to an
        // hour (AuthController; in this browser's own counter once it has
        // signed in here before). Reporting either as "Invalid credentials"
        // pushes the user to retry — which extends the lockout.
        let errorMessage = "Invalid credentials! Please check your email and password.";
        if (response.status === 429) {
          // config/cors.php exposes Retry-After; if a proxy ever hides it, don't
          // promise a precise number we cannot read.
          const retryAfter = Number(response.headers.get('retry-after'));
          if (!Number.isFinite(retryAfter) || retryAfter <= 0) {
            errorMessage = 'Too many login attempts. Please wait about a minute and try again.';
          } else if (retryAfter > 120) {
            errorMessage = `Too many failed sign-ins for this account. Please wait about ${Math.ceil(retryAfter / 60)} minutes and try again.`;
          } else {
            errorMessage = `Too many login attempts. Please wait ${retryAfter} seconds and try again.`;
          }
        } else if (response.status >= 500) {
          errorMessage = 'The server could not be reached. Please try again in a moment.';
        }
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred. Please try again.';
      console.error('An error occurred during login:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoginLoading(false);
    }
  };
  
  const logout = async () => {
    const { CLEAR_AUTH_DATA, GET_AUTH_TOKEN } = useAuthStore.getState();

    // Revoke the token on the server first, so a copy of it stops working too. Best effort:
    // an unreachable server (or one slower than 10 s) still signs this browser out.
    const token = GET_AUTH_TOKEN();
    if (token) {
      try {
        await fetch(process.env.NEXT_PUBLIC_API_URL + '/logout', {
          method: 'POST',
          // The token header only, no cookies (the API reads no cookie since 2026-10-29).
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          signal: AbortSignal.timeout(10_000),
        });
      } catch (error) {
        console.error('Log out: the server could not revoke the token', error);
      }
    }

    CLEAR_AUTH_DATA();
    toast.info("You have successfully logged-out", {
      position: "top-left",
    });

    window.location.href = "/auth/signin";
  };

  return { email, setEmail, password, setPassword, submit, logout, loginLoading };
};

export default useLogin;