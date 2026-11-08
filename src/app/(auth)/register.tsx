import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, Text, TextInput, View } from 'react-native';
import { ProfileEditor, profileForm, type ProfileDraft } from '../../components/ProfileEditor';
import { usePreferences } from '../../context/PreferencesContext';
import { registerCustomer } from '../../services/customerProfile';
import { saveToken } from '../../utils/tokenStorage';

export default function RegisterScreen() {
  const { colors, t } = usePreferences();
  const router = useRouter();
  const [draft, setDraft] = useState<ProfileDraft>({ username: '', email: '', first_name: '', last_name: '' });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const operation = useRef(false);

  async function submit() {
    if (operation.current) return;
    if (!draft.username.trim() || !draft.email.trim() || !draft.first_name.trim() || password.length < 8 || password !== confirm) {
      Alert.alert(t('Check your details'), t('Enter your name, username, email and matching passwords of at least 8 characters.'));
      return;
    }
    operation.current = true;
    setBusy(true);
    try {
      const form = await profileForm(draft, avatar);
      form.append('password', password);
      form.append('password_confirm', confirm);
      const result = await registerCustomer(form);
      await saveToken(result.token);
      router.replace('/(app)');
    } catch (err) {
      Alert.alert(t('Could not create your account.'), err instanceof Error ? t(err.message) : t('Check your connection.'));
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 70, gap: 16, backgroundColor: colors.background }} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={{ fontSize: 32, fontWeight: '700', color: colors.text }}>{t('Create your account')}</Text>
      <Text style={{ color: colors.muted }}>{t('Join as a customer to order and save your favorites.')}</Text>
      <ProfileEditor draft={draft} setDraft={setDraft} avatar={avatar} setAvatar={setAvatar} busy={busy} />
      {([[password, setPassword, 'Password'], [confirm, setConfirm, 'Confirm password']] as const).map(([value, setter, label]) => (
        <View key={label} style={{ gap: 6 }}>
          <Text style={{ color: colors.text }}>{t(label)}</Text>
          <TextInput accessibilityLabel={t(label)} value={value} onChangeText={setter} secureTextEntry
            autoCapitalize="none" autoComplete="new-password" maxLength={128} editable={!busy}
            style={{ minHeight: 48, padding: 12, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.surface }}
          />
        </View>
      ))}
      <Text style={{ color: colors.muted }}>{t('Use at least 8 characters with letters and numbers.')}</Text>
      {busy ? <ActivityIndicator color={colors.accent} /> : null}
      <Button title={t('Create account')} color={colors.accent} disabled={busy} onPress={() => void submit()} />
      <Button title={t('I already have an account')} color={colors.accent} disabled={busy} onPress={() => router.replace('/(auth)/login')} />
    </ScrollView>
  );
}
