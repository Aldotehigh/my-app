import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../types/CurrentUser';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { usePreferences } from '../../context/PreferencesContext';
import { PAGE_SIZES } from '../../utils/menuPreferences';
import type { Language, PageSize, ThemeMode } from '../../utils/preferenceStorage';

export default function SettingsScreen() {
  const { user, reloadUser } = useAuth();
  const { colors, t, preferences, savePreferences, screenReaderEnabled, reduceMotion } = usePreferences();
  const [themeMode, setThemeMode] = useState<ThemeMode>(preferences.themeMode);
  const [language, setLanguage] = useState<Language>(preferences.language);
  const [pageSize, setPageSize] = useState<PageSize>(preferences.pageSize);
  const router = useRouter();
  const [highContrast, setHighContrast] = useState(preferences.highContrast);
  const [saving, setSaving] = useState(false);
  const hasChanges = highContrast !== preferences.highContrast || themeMode !== preferences.themeMode || language !== preferences.language || pageSize !== preferences.pageSize;

  const handleSave = async () => {
    if (saving || !hasChanges) return;
    setSaving(true);
    try {
      await savePreferences({ themeMode, language, pageSize, highContrast });
    } catch {
      Alert.alert(t('Error'), t('Could not save settings.'));
    } finally {
      setSaving(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 20, gap: 20, backgroundColor: colors.background },
    heading: { color: colors.text, fontSize: 30, fontWeight: '700' },
    section: { padding: 18, gap: 14, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    title: { fontSize: 20, fontWeight: '700', color: colors.text },
    description: { fontSize: 15, lineHeight: 22, color: colors.muted },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
    options: { gap: 8 },
    option: { padding: 14, minHeight: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderWidth: 1, borderColor: colors.border },
    selected: { backgroundColor: colors.soft, borderColor: colors.accent },
    optionText: { fontSize: 16, color: colors.text, flexShrink: 1, flex: 1 },
    check: { color: colors.accent, fontSize: 20 },
    save: { minHeight: 52, padding: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
    disabled: { opacity: 0.5 },
    saveText: { fontSize: 17, fontWeight: '700', color: colors.onAccent },
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text accessibilityRole="header" style={styles.heading}>{t('Settings')}</Text>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.title}>{t('Appearance')}</Text>
        <Text style={styles.description}>{t('Follows your device appearance.')}</Text>
        <View style={styles.options}>
          {([
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'Automatic' },
          ] as const).map((option) => (
            <Pressable key={option.value} disabled={saving} accessibilityLabel={t(option.label)} accessibilityRole="radio" accessibilityState={{ checked: themeMode === option.value, disabled: saving }} onPress={() => setThemeMode(option.value)} style={[styles.option, themeMode === option.value && styles.selected]}>
              <Text style={styles.optionText}>{t(option.label)}</Text>
              {themeMode === option.value ? <Text style={styles.check}>✓</Text> : null}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.title}>{t('Language')}</Text>
        {([{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }] as const).map((option) => (
          <Pressable key={option.value} disabled={saving} accessibilityLabel={t(option.label)} accessibilityRole="radio" accessibilityState={{ checked: language === option.value, disabled: saving }} onPress={() => setLanguage(option.value)} style={[styles.option, language === option.value && styles.selected]}>
            <Text style={styles.optionText}>{option.label}</Text>
            {language === option.value ? <Text style={styles.check}>✓</Text> : null}
          </Pressable>
        ))}
        <Text style={styles.description}>{t('Menu names and descriptions appear as entered by the restaurant.')}</Text>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.title}>{t('Dishes per page')}</Text>
        <Text style={styles.description}>{t('Choose how many dishes to show on each menu page.')}</Text>
        {PAGE_SIZES.map((size) => (
          <Pressable key={size} disabled={saving} accessibilityLabel={String(size)} accessibilityRole="radio" accessibilityState={{ checked: pageSize === size, disabled: saving }} onPress={() => setPageSize(size)} style={[styles.option, pageSize === size && styles.selected]}>
            <Text style={styles.optionText}>{size}</Text>
            {pageSize === size ? <Text style={styles.check}>✓</Text> : null}
          </Pressable>
        ))}
      </View>


      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.title}>{t('Accessibility')}</Text>
        <View style={styles.switchRow}>
          <Text style={styles.optionText}>{t('High contrast')}</Text>
          <Switch
            accessibilityLabel={t('High contrast')}
            accessibilityHint={t('Increase contrast for text, controls and borders.')}
            value={highContrast}
            onValueChange={setHighContrast}
            disabled={saving}
            trackColor={{ true: colors.olive }}
          />
        </View>
        <Text style={styles.description}>{t('Increase contrast for text, controls and borders.')}</Text>
        <Text accessibilityRole="header" style={styles.title}>{t('System text size')}</Text>
        <Text style={styles.description}>{t('Text follows the size selected in your device accessibility settings.')}</Text>
        <Text accessibilityRole="header" style={styles.title}>{t('Reduce motion')}</Text>
        <Text style={styles.description}>
          {t(reduceMotion ? 'Reduced motion is enabled on your device.' : 'Motion follows your device accessibility settings.')}
        </Text>
        <Text style={styles.description}>{t(screenReaderEnabled ? 'Screen reader active' : 'Screen reader inactive')}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(app)/accessibility')}
          style={styles.option}
        >
          <Text style={styles.optionText}>{t('VoiceOver navigation guide')}</Text>
        </Pressable>
      </View>

      <Pressable onPress={handleSave} disabled={saving || !hasChanges} accessibilityRole="button" accessibilityState={{ disabled: saving || !hasChanges, busy: saving }} style={[styles.save, (saving || !hasChanges) && styles.disabled]}>
        {saving ? <ActivityIndicator color={colors.onAccent} /> : <Text style={styles.saveText}>{t('Save')}</Text>}
      </Pressable>
      {user ? (
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.title}>{t('Account')}</Text>
          <Text style={styles.optionText}>{user.username}</Text>
          <Text style={styles.description}>{t(ROLE_LABELS[user.role])}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={saving || hasChanges}
            accessibilityState={{ disabled: saving || hasChanges }}
            onPress={reloadUser}
            style={[styles.option, (saving || hasChanges) && styles.disabled]}
          >
            <Text style={styles.optionText}>{t('Refresh profile')}</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}
