import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  level: number;
  exp: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    const { data, error } = await authApi.me();
    if (data?.user) {
      setUser(data.user);
    } else {
      localStorage.removeItem('token');
    }
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await authApi.login(email, password);
    if (error) return { error };
    
    if (data) {
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return {};
    }
    return { error: 'Login failed' };
  };

  const register = async (email: string, password: string, name: string) => {
    const { data, error } = await authApi.register(email, password, name);
    if (error) return { error };
    
    if (data) {
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return {};
    }
    return { error: 'Registration failed' };
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
