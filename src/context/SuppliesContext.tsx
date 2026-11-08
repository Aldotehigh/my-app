import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { getSupplies, type SupplyRequest } from '../services/supplies';
import { useAuth } from './AuthContext';
import { usePreferences } from './PreferencesContext';

const SuppliesContext = createContext<{
  requests: SupplyRequest[];
  pendingCount: number;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
} | null>(null);

export function SuppliesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { t } = usePreferences();
  const router = useRouter();
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const seen = useRef<Set<number> | null>(null);
  const staff = Boolean(user && user.role !== 'customer');
  const refresh = useCallback(async () => {
    if (!staff) {
      setLoading(false);
      return;
    }
    const version = ++sequence.current;
    try {
      const fresh = await getSupplies();
      if (version !== sequence.current) return;
      if ((user?.role === 'admin' || user?.role === 'owner') && seen.current && fresh.some((report) => !seen.current!.has(report.id))) {
        Alert.alert(t('New supply request'), t('An area sent its supply list.'), [
          { text: t('Later'), style: 'cancel' },
          { text: t('View supplies'), onPress: () => router.navigate('/supplies') },
        ]);
      }
      seen.current = new Set(fresh.map((report) => report.id));
      setRequests(fresh);
      setError('');
    } catch (err) {
      if (version === sequence.current) setError(err instanceof Error ? err.message : t('Could not load supplies.'));
    } finally {
      if (version === sequence.current) setLoading(false);
    }
  }, [router, staff, t, user?.role]);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      if (!active) return;
      if (AppState.currentState === 'active') await refresh();
      if (active && staff) timer = setTimeout(() => void poll(), 8000);
    }
    void refresh();
    timer = setTimeout(() => void poll(), 8000);
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => {
      active = false;
      sequence.current++;
      clearTimeout(timer);
      listener.remove();
    };
  }, [refresh, staff]);

  const pendingCount = requests.filter((report) => report.items.some((item) => item.status !== 'received')).length;
  return (
    <SuppliesContext.Provider value={{ requests, pendingCount, loading, error, refresh }}>
      {children}
    </SuppliesContext.Provider>
  );
}

export function useSupplies() {
  const context = useContext(SuppliesContext);
  if (!context) throw new Error('Missing supplies provider.');
  return context;
}
