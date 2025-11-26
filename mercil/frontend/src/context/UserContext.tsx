import { createContext, useState, type ReactNode , useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface AuthContextType {
  user: { name: string; token: string } | null;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ name: string; token: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (token && username) {
      setUser({ name: username, token: token });
    }
  }, []);

  const register = async (name: string, email: string, password: string) => {
    const res = await axios.post('http://localhost:4000/api/user/register', { name, email, password });

    if (!res.data.success) {
      throw new Error(res.data.message);
    }

  setUser({ name: res.data.username, token: res.data.token });
  localStorage.setItem('token', res.data.token);
  localStorage.setItem('username', res.data.username);
  };

  const login = async (email: string, password: string) => {
    const res = await axios.post('http://localhost:4000/api/user/login', { email, password });
    if (!res.data.success) {
      throw new Error(res.data.message);
    }

  setUser({ name: res.data.username, token: res.data.token });
  localStorage.setItem('token', res.data.token);
  localStorage.setItem('username', res.data.username);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');

    toast.success("Logout Successfully!")
  };

  return (
    <AuthContext.Provider value={{ user, login , logout , register}}>
      {children}
    </AuthContext.Provider>
  );
};