import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
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
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Tarjetas' }} />
      <Stack.Screen name="details" options={{ title: 'Detalle' }} />
    </Stack>
  )
}