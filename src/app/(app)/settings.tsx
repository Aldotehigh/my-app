
import { deleteToken } from '../../utils/tokenStorage';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../types/CurrentUser';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { usePreferences } from '../../context/PreferencesContext';
import { PAGE_SIZES } from '../../utils/menuPreferences';
import type { RestaurantColors } from '../../constants/restaurantColors';
import type {
  Language,
  PageSize,
  ThemeMode,
} from '../../utils/preferenceStorage';

const GOLD = '#D8B067';
const WINE = '#801C18';
const CREAM = '#F3DEC5';

export default function SettingsScreen() {
  const { user, reloadUser } = useAuth();

  const {
    colors,
    t,
    preferences,
    savePreferences,
    screenReaderEnabled,
    reduceMotion,
    isDark,
  } = usePreferences();

  const [themeMode, setThemeMode] = useState<ThemeMode>(
    preferences.themeMode
  );

  const [language, setLanguage] = useState<Language>(
    preferences.language
  );

  const [pageSize, setPageSize] = useState<PageSize>(
    preferences.pageSize
  );

  const [highContrast, setHighContrast] = useState(
    preferences.highContrast
  );

  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const router = useRouter();
  const styles = createStyles(colors, isDark);

  const hasChanges =
    highContrast !== preferences.highContrast ||
    themeMode !== preferences.themeMode ||
    language !== preferences.language ||
    pageSize !== preferences.pageSize;

  const handleSave = async () => {
    if (saving || !hasChanges) return;

    setSaving(true);

    try {
      await savePreferences({
        themeMode,
        language,
        pageSize,
        highContrast,
      });
    } catch {
      Alert.alert(
        t('Error'),
        t('Could not save settings.')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (saving || signingOut) return;

    setSigningOut(true);

    try {
      await deleteToken();
      router.replace('/(auth)/login');
    } catch {
      Alert.alert(
        t('Error'),
        t('Could not sign out.')
      );

      setSigningOut(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View
        pointerEvents="none"
        style={styles.headerLine}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
      >
        <Text
          accessibilityRole="header"
          style={styles.heading}
        >
          {t('Settings')}
        </Text>

        <View style={styles.section}>
          <Text
            accessibilityRole="header"
            style={styles.title}
          >
            {t('Appearance')}
          </Text>

          <Text style={styles.description}>
            {t('Follows your device appearance.')}
          </Text>

          <View style={styles.options}>
            {([
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'Automatic' },
            ] as const).map((option) => (
              <Pressable
                key={option.value}
                disabled={saving}
                accessibilityLabel={t(option.label)}
                accessibilityRole="radio"
                accessibilityState={{
                  checked: themeMode === option.value,
                  disabled: saving,
                }}
                onPress={() => setThemeMode(option.value)}
                style={[
                  styles.option,
                  themeMode === option.value &&
                    styles.selectedOption,
                ]}
              >
                <Text style={styles.optionText}>
                  {t(option.label)}
                </Text>

                {themeMode === option.value ? (
                  <Text style={styles.check}>
                    ✓
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text
            accessibilityRole="header"
            style={styles.title}
          >
            {t('Language')}
          </Text>

          <View style={styles.options}>
            {([
              { value: 'es', label: 'Español' },
              { value: 'en', label: 'English' },
              { value: 'ja', label: '日本語' },
            ] as const).map((option) => (
              <Pressable
                key={option.value}
                disabled={saving}
                accessibilityLabel={t(option.label)}
                accessibilityRole="radio"
                accessibilityState={{
                  checked: language === option.value,
                  disabled: saving,
                }}
                onPress={() => setLanguage(option.value)}
                style={[
                  styles.option,
                  language === option.value &&
                    styles.selectedOption,
                ]}
              >
                <Text style={styles.optionText}>
                  {option.label}
                </Text>

                {language === option.value ? (
                  <Text style={styles.check}>
                    ✓
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text
            accessibilityRole="header"
            style={styles.title}
          >
            {t('Dishes per page')}
          </Text>

          <Text style={styles.description}>
            {t(
              'Choose how many dishes to show on each menu page.'
            )}
          </Text>

          <View style={styles.options}>
            {PAGE_SIZES.map((size) => (
              <Pressable
                key={size}
                disabled={saving}
                accessibilityLabel={String(size)}
                accessibilityRole="radio"
                accessibilityState={{
                  checked: pageSize === size,
                  disabled: saving,
                }}
                onPress={() => setPageSize(size)}
                style={[
                  styles.option,
                  pageSize === size &&
                    styles.selectedOption,
                ]}
              >
                <Text style={styles.optionText}>
                  {size}
                </Text>

                {pageSize === size ? (
                  <Text style={styles.check}>
                    ✓
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text
            accessibilityRole="header"
            style={styles.title}
          >
            {t('Accessibility')}
          </Text>

          <View style={styles.switchRow}>
            <Text style={styles.optionText}>
              {t('High contrast')}
            </Text>

            <Switch
              accessibilityLabel={t('High contrast')}
              accessibilityHint={t(
                'Increase contrast for text, controls and borders.'
              )}
              value={highContrast}
              onValueChange={setHighContrast}
              disabled={saving}
              trackColor={{
                false: WINE,
                true: isDark ? GOLD : WINE,
              }}
              thumbColor={
                isDark ? CREAM : '#FFFFFF'
              }
              ios_backgroundColor={WINE}
            />
          </View>

          <Text style={styles.description}>
            {t(
              'Increase contrast for text, controls and borders.'
            )}
          </Text>

          <Text
            accessibilityRole="header"
            style={styles.title}
          >
            {t('System text size')}
          </Text>

          <Text style={styles.description}>
            {t(
              'Text follows the size selected in your device accessibility settings.'
            )}
          </Text>

          <Text
            accessibilityRole="header"
            style={styles.title}
          >
            {t('Reduce motion')}
          </Text>

          <Text style={styles.description}>
            {t(
              reduceMotion
                ? 'Reduced motion is enabled on your device.'
                : 'Motion follows your device accessibility settings.'
            )}
          </Text>

          <Text style={styles.description}>
            {t(
              screenReaderEnabled
                ? 'Screen reader active'
                : 'Screen reader inactive'
            )}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push('/(app)/accessibility')
            }
            style={styles.option}
          >
            <Text style={styles.optionText}>
              {t('VoiceOver navigation guide')}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saving || !hasChanges}
          accessibilityRole="button"
          accessibilityState={{
            disabled: saving || !hasChanges,
            busy: saving,
          }}
          style={({ pressed }) => [
            styles.actionButton,
            (saving || !hasChanges) &&
              styles.disabledButton,
            pressed && !saving && hasChanges &&
              styles.pressedButton,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={CREAM} />
          ) : (
            <Text style={styles.actionButtonText}>
              {t('Save')}
            </Text>
          )}
        </Pressable>

        {user ? (
          <View style={styles.section}>
            <Text
              accessibilityRole="header"
              style={styles.title}
            >
              {t('Account')}
            </Text>

            {user.avatar ? (
              <Image
                accessible={false}
                source={{ uri: user.avatar }}
                style={styles.avatar}
              />
            ) : null}

            <Text style={styles.optionText}>
              {[user.first_name, user.last_name]
                .filter(Boolean)
                .join(' ') || user.username}
            </Text>

            <Pressable
              accessibilityRole="button"
              style={styles.option}
              disabled={saving}
              onPress={() =>
                router.push('/profile')
              }
            >
              <Text style={styles.optionText}>
                {t('Edit profile')}
              </Text>
            </Pressable>

            <Text style={styles.description}>
              {t(ROLE_LABELS[user.role])}
            </Text>

            <Pressable
              accessibilityRole="button"
              disabled={saving || hasChanges}
              accessibilityState={{
                disabled: saving || hasChanges,
              }}
              onPress={reloadUser}
              style={[
                styles.option,
                (saving || hasChanges) &&
                  styles.disabledButton,
              ]}
            >
              <Text style={styles.optionText}>
                {t('Refresh profile')}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Sign out')}
              accessibilityState={{
                disabled: saving || signingOut,
                busy: signingOut,
              }}
              disabled={saving || signingOut}
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.actionButton,
                styles.logoutButton,
                (saving || signingOut) &&
                  styles.disabledButton,
                pressed && !saving && !signingOut &&
                  styles.pressedButton,
              ]}
            >
              {signingOut ? (
                <ActivityIndicator color={CREAM} />
              ) : (
                <Text style={styles.actionButtonText}>
                  {t('Sign out')}
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const createStyles = (
  colors: RestaurantColors,
  isDark: boolean
) => {
  const accent = isDark ? GOLD : WINE;

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },

    headerLine: {
      width: '100%',
      height: 2,
      backgroundColor: accent,
    },

    scrollView: {
      flex: 1,
    },

    container: {
      flexGrow: 1,
      padding: 20,
      gap: 20,
      backgroundColor: colors.background,
    },

    heading: {
      color: colors.text,
      fontSize: 30,
      fontWeight: '700',
    },

    section: {
      padding: 18,
      gap: 14,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: accent,
    },

    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },

    description: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.muted,
    },

    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    },

    options: {
      gap: 10,
    },

    option: {
      padding: 14,
      minHeight: 50,
      borderRadius: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      borderWidth: 1.5,
      borderColor: accent,
      backgroundColor: 'transparent',
    },

    selectedOption: {
      borderWidth: 2,
      borderColor: accent,
      backgroundColor: isDark
        ? 'rgba(216,176,103,0.08)'
        : 'rgba(128,28,24,0.08)',
    },

    optionText: {
      fontSize: 16,
      color: colors.text,
      flexShrink: 1,
      flex: 1,
    },

    check: {
      color: accent,
      fontSize: 24,
      fontWeight: '700',
    },

    actionButton: {
      minHeight: 58,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 999,
      borderWidth: 1.5,
      borderColor: accent,
      backgroundColor: WINE,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      width: '100%',
    },

    logoutButton: {
      alignSelf: 'center',
    },

    actionButtonText: {
      fontSize: 17,
      fontWeight: '700',
      color: CREAM,
      textAlign: 'center',
    },

    disabledButton: {
      opacity: 0.5,
    },

    pressedButton: {
      opacity: 0.8,
    },

    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
    },
  });
};
