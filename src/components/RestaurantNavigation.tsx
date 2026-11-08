import { useSupplies } from '../context/SuppliesContext';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { usePreferences } from '../context/PreferencesContext';
import { restaurantBrand } from '../constants/restaurantBrand';

export function RestaurantNavigation() {
  const { user } = useAuth();
  const { lines } = useCart();
  const { pendingCount } = useSupplies();
  const { t, colors } = usePreferences();
  const router = useRouter();
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const items = [
    ...(user?.can_view_business ? [
      { path: '/owner', route: '/owner' as const, label: 'Dashboard', icon: '▥' },
    ] : []),
    { path: '/', route: '/(app)' as const, label: 'Menu', icon: '⌂' },
    { path: '/table-orders', route: '/table-orders' as const, label: 'Orders', icon: '▤' },
    ...(user?.role === 'customer' ? [
      { path: '/reservations', route: '/reservations' as const, label: 'Reservations', icon: '▦' },
      { path: '/favorites', route: '/favorites' as const, label: 'Favorites', icon: '♡' },
    ] : [
      { path: '/supplies', route: '/supplies' as const, label: 'Supplies', icon: '☑' },
    ]),
    { path: '/settings', route: '/settings' as const, label: 'Settings', icon: '☷' },
  ];
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10), borderTopColor: colors.border }]}>
      {items.map((item) => {
        const selected = path === item.path;
        const count = item.label === 'Orders' && user?.role === 'customer'
          ? lines.reduce((sum, line) => sum + line.quantity, 0) : item.label === 'Supplies' ? pendingCount : 0;
        return (
          <Pressable key={item.label} accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={t(item.label) + (count ? ' · ' + count : '')}
            style={styles.item} onPress={() => { if (!selected) router.navigate(item.route); }}
          >
            <View style={styles.iconRow}>
              <Text accessible={false} style={[styles.icon, { color: selected ? restaurantBrand.cream : restaurantBrand.gold }]}>{item.icon}</Text>
              {count ? <Text style={styles.count}>{count}</Text> : null}
            </View>
            <Text style={[styles.label, { color: selected ? restaurantBrand.cream : restaurantBrand.gold }]}>{t(item.label)}</Text>
            <View style={[styles.indicator, { backgroundColor: selected ? restaurantBrand.gold : 'transparent' }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', paddingTop: 9, paddingHorizontal: 12, backgroundColor: restaurantBrand.ink, borderTopWidth: 1 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 54, gap: 2, paddingHorizontal: 2 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  icon: { fontSize: 26, lineHeight: 29 },
  label: { fontSize: 11, fontWeight: '500' },
  indicator: { height: 2, width: 24, marginTop: 4, borderRadius: 2 },
  count: { backgroundColor: '#7D251F', color: '#FFF6E7', paddingHorizontal: 5, borderRadius: 8, fontSize: 10, fontWeight: '700' },
});
