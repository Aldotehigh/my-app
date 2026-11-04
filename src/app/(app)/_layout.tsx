import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../../constants/restaurantColors';
import { getToken } from '../../utils/tokenStorage';

export default function AppLayout() {
  const [checking, setChecking] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
    (async () => {
      const token = await getToken();
      setIsLoggedIn(!!token);
      setChecking(true);
    })();
  }, []);

  if (!checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center'}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Menú del restaurante' }} />
      <Stack.Screen name="details" options={{ title: 'Detalles' }} />
      <Stack.Screen name="favorites" options={{ title: 'Mis favoritos' }} />
      <Stack.Screen name="settings" options={{ title: 'Ajustes' }} />
    </Stack>
  )
}