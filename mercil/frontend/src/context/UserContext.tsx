import { createContext, useState, type ReactNode, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface AuthContextType {
  user: { name: string; token: string } | null;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Base URL for Python FastAPI backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ name: string; token: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (token && username) {
      setUser({ name: username, token: token });
    }
    
    setLoading(false);
  }, []);

  const register = async (name: string, email: string, password: string) => {
    try {
      // เปลี่ยน URL ไปที่ Python backend
      const res = await axios.post(`${API_BASE_URL}/api/auth/register`, { 
        name, 
        email, 
        password 
      });

      if (!res.data.success) {
        throw new Error(res.data.message);
      }

      setUser({ name: res.data.username, token: res.data.token });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      
      toast.success('ลงทะเบียนสำเร็จ');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // เปลี่ยน URL ไปที่ Python backend
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { 
        email, 
        password 
      });

      if (!res.data.success) {
        throw new Error(res.data.message);
      }

      setUser({ name: res.data.username, token: res.data.token });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      
      toast.success('ล็อกอินสำเร็จ');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    toast.success('ออกจากระบบสำเร็จ');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}> 
      {children}
    </AuthContext.Provider>
  );
};