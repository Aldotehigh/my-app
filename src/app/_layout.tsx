import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PreferencesProvider, usePreferences } from '../context/PreferencesContext';

function RootNavigator() {
  const { colors, isDark } = usePreferences();
  const route = useSegments().join('/');
  const onMenu = route === '(app)' || route === '(app)/index';
  return (
    <>
      <StatusBar style={isDark || onMenu ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <RootNavigator />
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}
