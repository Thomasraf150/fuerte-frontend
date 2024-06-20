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
  const router = useRouter();
  const { SET_AUTH_DATA } = useAuthStore.getState();

  const submit = async (data: LoginData) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/login', {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify(data)
      });
      // console.log(response, ' response')
      if (response.ok) {
        const res = await response.json();
        SET_AUTH_DATA(res.user, res.token);
        toast.success("Your Logged In!");
        router.push('/');
      } else {
        toast.error("Invalid Credentials!");
      }
    } catch (error) {
      console.error('An error occurred during login:', error);
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

  return { email, setEmail, password, setPassword, submit, logout };
};

export default useLogin;