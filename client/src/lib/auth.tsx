import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { trpc } from './trpc';

interface User {
  id: string;
  email: string;
  name: string;
  picture: string | null;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (idToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = 'runwaylens_session';

export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = trpc.auth.googleLogin.useMutation();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !!getSessionToken(),
    retry: false,
  });

  // Sync user from me query
  useEffect(() => {
    if (meQuery.isSuccess) {
      setUser(meQuery.data ?? null);
      setIsLoading(false);
    } else if (meQuery.isError) {
      // Session invalid/expired
      localStorage.removeItem(SESSION_KEY);
      setUser(null);
      setIsLoading(false);
    } else if (!getSessionToken()) {
      // No session token at all
      setIsLoading(false);
    }
  }, [meQuery.isSuccess, meQuery.isError, meQuery.data]);

  const login = useCallback(async (idToken: string) => {
    const result = await loginMutation.mutateAsync({ idToken });
    localStorage.setItem(SESSION_KEY, result.sessionToken);
    setUser(result.user);
    setIsLoading(false);
    // Navigate to dashboard instead of reloading (fixes mobile lag)
    window.location.href = '/';
  }, [loginMutation]);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
