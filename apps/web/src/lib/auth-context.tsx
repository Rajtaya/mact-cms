'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { api, setAccessToken, setRefreshToken, getRefreshToken } from './api';
import type { Role } from './permissions';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Restore session on mount via refresh token.
  useEffect(() => {
    (async () => {
      if (!getRefreshToken()) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.post('/auth/refresh', {
          refreshToken: getRefreshToken(),
        });
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        const me = await api.get('/auth/me');
        setUser(me.data);
      } catch {
        setRefreshToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
    router.push('/dashboard');
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
