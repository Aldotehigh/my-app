import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreferences } from '../context/PreferencesContext';
import { restaurantBrand } from '../constants/restaurantBrand';
import { useAuth } from '../context/AuthContext';
import { OrderInboxButton } from '../context/OrdersContext';

export function RestaurantMasthead() {
  const { t } = usePreferences();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
      <View pointerEvents="none" style={styles.woodOne} />
      <View pointerEvents="none" style={styles.woodTwo} />
      <View pointerEvents="none" style={styles.rings}>
        {[0, 1, 2, 3].map((ring) => <View key={ring} style={[styles.ring, {
          width: 150 + ring * 24, height: 150 + ring * 24,
          top: -ring * 12, left: -ring * 12,
        }]} />)}
      </View>
      <View style={[styles.tools, { top: insets.top + 8 }]}>
        <OrderInboxButton />
        {user?.role === 'customer' ? <Pressable accessibilityRole="button" accessibilityLabel={t('Settings')}
          style={styles.settings} onPress={() => router.navigate('/settings')}
        >
          <Text accessible={false} style={styles.settingsText}>☷</Text>
        </Pressable> : null}
      </View>
      <Text accessible={false} style={styles.emblem}>❖</Text>
      <Text accessibilityRole="header" style={styles.brand}>{restaurantBrand.name}</Text>
      <Text style={styles.tagline}>{t(restaurantBrand.tagline)}</Text>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: restaurantBrand.ink, alignItems: 'center', paddingBottom: 20, paddingHorizontal: 24, overflow: 'hidden' },
  tools: { position: 'absolute', right: 18, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, minHeight: 40 },
  settings: { width: 40, minHeight: 40, borderRadius: 20, backgroundColor: '#594237', alignItems: 'center', justifyContent: 'center' },
  settingsText: { color: restaurantBrand.cream, fontSize: 24 },
  emblem: { color: restaurantBrand.gold, fontSize: 18, marginTop: 0, marginBottom: 5 },
  brand: { color: restaurantBrand.cream, letterSpacing: 5, fontSize: 16, fontWeight: '500', textAlign: 'center' },
  tagline: { color: restaurantBrand.gold, fontFamily: restaurantBrand.serif, fontSize: 13, marginTop: 6, textAlign: 'center' },
  rule: { backgroundColor: '#85633E', width: 30, height: 1, marginTop: 12 },
  woodOne: { position: 'absolute', height: 400, width: 30, backgroundColor: '#513526', transform: [{ rotate: '-42deg' }], top: -170, left: 42 },
  woodTwo: { position: 'absolute', height: 400, width: 14, backgroundColor: '#3D2A21', transform: [{ rotate: '-42deg' }], top: -150, right: 48 },
  rings: { position: 'absolute', right: -65, bottom: -135, width: 170, height: 170 },
  ring: { position: 'absolute', borderWidth: 1, borderColor: '#8D704B', borderRadius: 200, opacity: 0.4 },
});
