import { useEffect } from 'react';
import { Alert, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './AuthContext';
import { usePreferences } from './PreferencesContext';
import { getReservations, type Reservation } from '../services/reservations';

export function ReservationUpdates() {
  const { user } = useAuth();
  const { t } = usePreferences();
  const router = useRouter();
  useEffect(() => {
    if (!user || !['customer', 'owner', 'admin'].includes(user.role)) return;
    let active = true;
    let previous: Map<number, string> | undefined;
    let timer: ReturnType<typeof setTimeout>;
    let inFlight = false;
    async function check() {
      if (inFlight || !active || AppState.currentState !== 'active') return;
      inFlight = true;
      try {
        const fresh = await getReservations();
        if (!active) return;
        const changed: Reservation[] = previous ? fresh.filter((item) => user!.role === 'customer'
          ? previous!.has(item.id) && previous!.get(item.id) !== item.status
          : !previous!.has(item.id) && item.status === 'pending') : [];
        previous = new Map(fresh.map((item) => [item.id, item.status]));
        if (changed.length) Alert.alert(t('Reservations'), t(user!.role === 'customer' ? 'Your reservation status has changed.' : 'A new reservation request has arrived.'), [
          { text: t('Later'), style: 'cancel' }, { text: t('View reservations'), onPress: () => router.push('/reservations') },
        ]);
      } catch { /* The reservations screen shows connection errors and a retry button. */ }
      finally { inFlight = false; }
    }
    async function poll() { await check(); if (active) timer = setTimeout(() => void poll(), 15000); }
    void poll();
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') void check(); });
    return () => { active = false; clearTimeout(timer); listener.remove(); };
  }, [user?.id, user?.role, router, t]);
  return null;
}
