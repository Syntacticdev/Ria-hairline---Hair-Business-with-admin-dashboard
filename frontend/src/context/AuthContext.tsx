import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { getMe } from '../api';
import { getErrorMessage } from '../api/client';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string) => void;
  refreshUser: () => Promise<boolean>;
  logoutLocal: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('rh_token');
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((data) => setUser(data))
      .catch((err) => {
        console.warn('Session invalid:', getErrorMessage(err));
        localStorage.removeItem('rh_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const setToken = (token: string) => {
    localStorage.setItem('rh_token', token);
  };

  const refreshUser = async (): Promise<boolean> => {
    try {
      const data = await getMe();
      setUser(data);
      return true;
    } catch {
      return false;
    }
  };

  const logoutLocal = () => {
    localStorage.removeItem('rh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, setToken, refreshUser, logoutLocal }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};