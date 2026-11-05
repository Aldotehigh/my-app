import { useDeviceAccessibility } from '../hooks/useDeviceAccessibility';
import { announce } from '../utils/announce';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, Button, Text, View, useColorScheme } from 'react-native';
import { darkColors, lightColors, highContrastDarkColors, highContrastLightColors } from '../constants/restaurantColors';
import type { RestaurantColors } from '../constants/restaurantColors';
import { DEFAULT_PREFERENCES, readPreferences, writePreferences } from '../utils/preferenceStorage';
import type { AppPreferences } from '../utils/preferenceStorage';
import { setActiveLanguage, translate } from '../utils/translations';

interface PreferencesContextValue {
  preferences: AppPreferences;
  colors: RestaurantColors;
  isDark: boolean;
  screenReaderEnabled: boolean;
  reduceMotion: boolean;
  t: (key: string) => string;
  savePreferences: (value: AppPreferences) => Promise<void>;
}
const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const { screenReaderEnabled, reduceMotion } = useDeviceAccessibility();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const saving = useRef(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    readPreferences().then((saved) => {
      if (!active) return;
      setActiveLanguage(saved.language);
      setPreferences(saved);
      setReady(true);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [reloadKey]);

  const savePreferences = useCallback(async (value: AppPreferences) => {
    if (saving.current) throw new Error(translate('Could not save settings.'));
    saving.current = true;
    try {
      await writePreferences(value);
      setActiveLanguage(value.language);
      setPreferences(value);
      announce(translate('Settings saved', value.language));
    } finally {
      saving.current = false;
    }
  }, []);

  const isDark = preferences.themeMode === 'system'
    ? systemScheme === 'dark'
    : preferences.themeMode === 'dark';
  const colors = preferences.highContrast
    ? (isDark ? highContrastDarkColors : highContrastLightColors)
    : (isDark ? darkColors : lightColors);
  const t = useCallback((key: string) => translate(key, preferences.language), [preferences.language]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        {failed ? (
          <>
            <Text style={{ color: colors.text }}>{t('Could not load settings.')}</Text>
            <Button color={colors.accent} title={t('Retry')} onPress={() => setReloadKey((value) => value + 1)} />
          </>
        ) : <ActivityIndicator color={colors.accent} />}
      </View>
    );
  }

  return (
    <PreferencesContext.Provider value={{ preferences, colors, isDark, screenReaderEnabled, reduceMotion, t, savePreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('PreferencesProvider is required');
  return value;
}
