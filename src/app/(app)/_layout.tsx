import { CartProvider } from '../../context/CartContext';
import { usePreferences } from '../../context/PreferencesContext';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, Button, Text, View } from 'react-native';
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
    <CartProvider key={user.username}>
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerShadowVisible: false,
        animation: reduceMotion ? 'none' : 'default',
      }}
    >
      <Stack.Screen name="index" options={{ title: t(user.can_manage_menu ? "Manage menu" : user.area === "kitchen" ? "Kitchen" : user.area === "bar" ? "Bar" : "Restaurant menu") }} />
      <Stack.Screen name="form" options={{ title: t('Manage dish') }} />
      <Stack.Screen name="details" options={{ title: t("Details") }} />
      <Stack.Screen name="favorites" options={{ title: t("My favorites") }} />
      <Stack.Screen name="accessibility" options={{ title: t('Accessibility') }} />
      <Stack.Screen name="settings" options={{ title: t("Settings") }} />
      <Stack.Screen name="table-orders" options={{ title: t("Orders") }} />
    </Stack>
    </CartProvider>
  )
}