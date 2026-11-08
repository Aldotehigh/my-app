import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getCurrentUser } from '../services/profile';
import type { CurrentUser } from '../types/CurrentUser';

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  error: boolean;
  reloadUser: () => void;
  updateUser: (user: CurrentUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    getCurrentUser().then((data) => {
      if (active) setUser(data);
    }).catch(() => {
      if (active) {
        setUser(null);
        setError(true);
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [reloadKey]);

  const reloadUser = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, reloadUser, updateUser: setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is required');
  return context;
}
