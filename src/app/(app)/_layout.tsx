import { ReservationUpdates } from '../../context/ReservationUpdates';
import { SuppliesProvider } from '../../context/SuppliesContext';
import { RestaurantNavigation } from '../../components/RestaurantNavigation';
import { View } from 'react-native';
import { OrdersProvider, OrderInboxButton } from '../../context/OrdersContext';
import { CartProvider } from '../../context/CartContext';
import { usePreferences } from '../../context/PreferencesContext';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, Button, Text } from 'react-native';
import { deleteToken } from '../../utils/tokenStorage';

export default function AppLayout() {
  return (
    <AuthProvider>
      <AuthenticatedNavigator />
    </AuthProvider>
  );
}

function AuthenticatedNavigator() {
  const { colors, t, reduceMotion } = usePreferences();
  const { user, loading, error, reloadUser } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
        <Text style={{ color: colors.text }}>{t('Loading profile...')}</Text>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: colors.background }}>
        <Text style={{ color: colors.text }}>{t('Could not load your profile. Check your connection or sign in again.')}</Text>
        <Button color={colors.accent} title={t('Retry')} onPress={() => void reloadUser()} />
        <Button color={colors.accent} title={t('Sign out')} onPress={async () => {
          await deleteToken();
          router.replace('/(auth)/login');
        }} />
      </View>
    );
  }

  return (
    <CartProvider key={user.id}>
    <SuppliesProvider>
    <OrdersProvider>
    <View style={{ flex: 1 }}>
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerShadowVisible: false,
        headerRight: () => <OrderInboxButton />,
        animation: reduceMotion ? 'none' : 'default',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false, title: t(user.can_manage_menu ? "Manage menu" : user.area === "kitchen" ? "Kitchen" : user.area === "bar" ? "Drinks bar" : user.area === "sushi" ? "Sushi" : "Restaurant menu") }} />
      <Stack.Screen name="form" options={{ title: t(user.area === 'bar' ? 'Manage drink' : 'Manage dish') }} />
      <Stack.Screen name="details" options={{ title: t("Details") }} />
      <Stack.Screen name="favorites" options={{ title: t("My favorites") }} />
      <Stack.Screen name="accessibility" options={{ title: t('Accessibility') }} />
      <Stack.Screen name="profile" options={{ title: t("My profile") }} />
      <Stack.Screen name="settings" options={{ title: t("Settings") }} />
      <Stack.Screen name="owner" options={{ title: t('Owner dashboard') }} />
      <Stack.Screen name="reservations" options={{ title: t("Reservations") }} />
      <Stack.Screen name="inventory" options={{ title: t('Inventory') }} />
      <Stack.Screen name="supplies" options={{ title: t("Supplies") }} />
      <Stack.Screen name="table-orders" options={{ title: t("Orders") }} />
    </Stack>
    <ReservationUpdates />
    <RestaurantNavigation />
    </View>
    </OrdersProvider>
    </SuppliesProvider>
    </CartProvider>
  )
}