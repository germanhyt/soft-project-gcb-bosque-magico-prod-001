import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchAuthStatus, fetchMe, login as loginApi } from '../lib/auth';
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  type PanelUser,
} from '../lib/auth-storage';

type AuthState = {
  loading: boolean;
  authRequired: boolean;
  user: PanelUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(true);
  const [user, setUser] = useState<PanelUser | null>(getStoredUser());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await fetchAuthStatus();
        if (cancelled) return;
        setAuthRequired(status.authRequired);
        if (!status.authRequired) {
          setUser(null);
          return;
        }
        const token = getStoredToken();
        if (token) {
          const me = await fetchMe();
          if (!cancelled) setUser(me);
        }
      } catch {
        if (!cancelled) setAuthRequired(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginApi(email, password);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ loading, authRequired, user, login, logout }),
    [loading, authRequired, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
