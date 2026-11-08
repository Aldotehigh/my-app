import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, AppState, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { getTableOrders, type TableOrder } from '../services/tableOrders';
import { useAuth } from './AuthContext';
import { usePreferences } from './PreferencesContext';

const OrdersContext = createContext<{
  orders: TableOrder[];
  error: string;
  loading: boolean;
  refresh: () => Promise<void>;
  arrivals: number;
  dismissArrivals: () => void;
} | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { t } = usePreferences();
  const router = useRouter();
  const [orders, setOrders] = useState<TableOrder[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [arrivals, setArrivals] = useState(0);
  const seen = useRef<Set<number> | null>(null);
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    const requestId = ++sequence.current;
    try {
      const fresh = await getTableOrders();
      if (requestId !== sequence.current) return;
      if (seen.current) {
        const count = fresh.filter((order) => !seen.current!.has(order.id)).length;
        if (count) {
          setArrivals((current) => current + count);
          if (user?.role !== 'customer') {
            Alert.alert(
              t('New orders'),
              t(user?.area === 'kitchen' ? 'A new kitchen order has arrived.' : user?.area === 'sushi' ? 'A new sushi order has arrived.' : user?.area === 'bar' ? 'A new bar order has arrived.' : 'A new restaurant order has arrived.'),
              [
                { text: t('Later'), style: 'cancel' },
                { text: t('View orders'), onPress: () => {
                  setArrivals(0);
                  router.push('/table-orders');
                } },
              ],
            );
          }
        }
      }
      seen.current = new Set(fresh.map((order) => order.id));
      setOrders(fresh);
      setError('');
    } catch (err) {
      if (requestId === sequence.current) {
        setError(err instanceof Error ? err.message : 'Could not load orders.');
      }
    } finally {
      if (requestId === sequence.current) setLoading(false);
    }
  }, [router, t, user?.role, user?.area]);

  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout>;
    async function poll() {
      if (!active) return;
      if (AppState.currentState === 'active') await refresh();
      if (active) timeout = setTimeout(() => void poll(), 8000);
    }
    void poll();
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => {
      active = false;
      sequence.current++;
      clearTimeout(timeout);
      listener.remove();
    };
  }, [refresh]);

  return (
    <OrdersContext.Provider value={{ orders, error, loading, refresh, arrivals, dismissArrivals: () => setArrivals(0) }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function OrderInboxButton() {
  const { colors, t } = usePreferences();
  const { user } = useAuth();
  const router = useRouter();
  const { orders, error, arrivals, dismissArrivals } = useOrders();
  if (user?.role === 'customer') return null;
  const activeCount = orders.filter((order) =>
    order.lines.some((line) => !['served', 'declined'].includes(line.status)),
  ).length;
  return (
    <Pressable accessibilityRole="button"
      accessibilityLabel={t(error ? 'Orders connection lost' : arrivals ? 'New orders' : 'Incoming orders') + ' ' + (arrivals || activeCount)}
      accessibilityLiveRegion="polite"
      style={{ padding: 8, borderRadius: 10, backgroundColor: colors.soft }}
      onPress={() => { dismissArrivals(); router.push('/table-orders'); }}
    >
      <Text style={{ color: colors.accent, fontWeight: '700' }}>
        {error ? '!' : arrivals ? '●' : ''} {t('Orders')} · {arrivals || activeCount}
      </Text>
    </Pressable>
  );
}

export function useOrders() {
  const value = useContext(OrdersContext);
  if (!value) throw new Error('Missing orders provider.');
  return value;
}
