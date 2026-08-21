import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { getMe } from '../api';
import { getErrorMessage } from '../api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string) => void;
  logoutLocal: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('rh_admin_token');
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((data) => {
        if (data.role === 'admin' || data.role === 'manager') {
          setUser(data);
        } else {
          localStorage.removeItem('rh_admin_token');
          setUser(null);
        }
      })
      .catch((err) => {
        console.warn('Session invalid:', getErrorMessage(err));
        localStorage.removeItem('rh_admin_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const setToken = (token: string) => localStorage.setItem('rh_admin_token', token);

  const logoutLocal = () => {
    localStorage.removeItem('rh_admin_token');
    localStorage.removeItem('rh_admin_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, setToken, logoutLocal }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};