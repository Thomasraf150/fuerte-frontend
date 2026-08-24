import { useState, useEffect } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthStore } from "@/store";
  
interface LoginData {
  email: string;
  password: string;
}

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
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        const res = await response.json();
        SET_AUTH_DATA(res.user, res.token);
        toast.success("You're logged in!");
        router.push('/');
        return { success: true, data: res };
      } else {
        // Don't blame the password for every failure. /api/login is rate limited
        // to 5 attempts per minute per account (RouteServiceProvider's 'login'
        // limiter), and reporting that lockout as "Invalid credentials" pushes
        // the user to retry — which extends the lockout.
        let errorMessage = "Invalid credentials! Please check your email and password.";
        if (response.status === 429) {
          // Retry-After is cross-origin here and may be hidden, so don't promise
          // a precise number we cannot read.
          const retryAfter = Number(response.headers.get('retry-after'));
          errorMessage = Number.isFinite(retryAfter) && retryAfter > 0
            ? `Too many login attempts. Please wait ${retryAfter} seconds and try again.`
            : 'Too many login attempts. Please wait about a minute and try again.';
        } else if (response.status >= 500) {
          errorMessage = 'The server could not be reached. Please try again in a moment.';
        }
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred. Please try again.';
      console.error('An error occurred during login:', error);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoginLoading(false);
    }
  };
  
  const logout = async () => {
    const { CLEAR_AUTH_DATA } = useAuthStore.getState();

    CLEAR_AUTH_DATA();
    toast.info("You have successfully logged-out", {
      position: "top-left",
    });

    window.location.href = "/auth/signin";
  };

  return { email, setEmail, password, setPassword, submit, logout, loginLoading };
};

export default useLogin;