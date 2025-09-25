import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
        const errorMessage = "Invalid credentials! Please check your email and password.";
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