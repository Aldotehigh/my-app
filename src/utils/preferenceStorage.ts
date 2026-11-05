import * as SecureStore from 'expo-secure-store';

export type Language = 'es' | 'en';
export type ThemeMode = 'system' | 'light' | 'dark';
export type PageSize = 10 | 20 | 30;
export interface AppPreferences {
  language: Language;
  themeMode: ThemeMode;
  pageSize: PageSize;
  highContrast: boolean;
}
export const DEFAULT_PREFERENCES: AppPreferences = {
  language: 'es',
  themeMode: 'system',
  pageSize: 10,
  highContrast: false,
};
const STORAGE_KEY = 'restaurant_preferences';

export async function readPreferences(): Promise<AppPreferences> {
  const stored = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!stored) {
    const previousSize = await SecureStore.getItemAsync('menu_page_size');
    return {
      ...DEFAULT_PREFERENCES,
      pageSize: previousSize === '20' ? 20 : previousSize === '30' ? 30 : 10,
    };
  }
  const value: unknown = JSON.parse(stored);
  if (typeof value !== 'object' || value === null) {
    throw new Error('Invalid preferences');
  }
  const data = value as Partial<AppPreferences>;
  return {
    highContrast: data.highContrast === true,
    language: data.language === 'en' ? 'en' : 'es',
    themeMode: data.themeMode === 'light' || data.themeMode === 'dark' ? data.themeMode : 'system',
    pageSize: data.pageSize === 20 || data.pageSize === 30 ? data.pageSize : 10,
  };
}

export async function writePreferences(value: AppPreferences): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(value));
}
