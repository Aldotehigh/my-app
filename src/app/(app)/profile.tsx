import { AddressEditor } from '../../components/AddressEditor';
import { emptyAddress, completeAddress, type Address } from '../../types/Address';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, Switch, Text, View } from 'react-native';
import { ProfileEditor, profileForm, type ProfileDraft } from '../../components/ProfileEditor';
import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../context/PreferencesContext';
import { apiMessage, updateCustomerProfile } from '../../services/customerProfile';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, updateUser } = useAuth();
  const { colors, t } = usePreferences();
  const router = useRouter();
  const [draft, setDraft] = useState<ProfileDraft>({
    username: user?.username ?? '', email: user?.email ?? '',
    first_name: user?.first_name ?? '', last_name: user?.last_name ?? '',
  });
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
  const [saveAddress, setSaveAddress] = useState(Boolean(user?.address?.street));
  const [address, setAddress] = useState<Address>(user?.address?.street ? user.address : emptyAddress([user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username));
  const [busy, setBusy] = useState(false);
  const operation = useRef(false);

  async function save() {
    if (operation.current) return;
    if (!draft.username.trim() || !draft.email.trim()) {
      Alert.alert(t('Error'), t('Enter your username and email.'));
      return;
    }
    if (saveAddress && !completeAddress(address)) {
      Alert.alert(t('Error'), t('Complete the address, a valid phone number and a five-digit postal code.'));
      return;
    }
    operation.current = true;
    setBusy(true);
    try {
      const form = await profileForm(draft, avatar !== user?.avatar ? avatar : null, saveAddress ? address : {});
      const updated = await updateCustomerProfile(form);
      updateUser(updated);
      router.back();
    } catch (err) {
      Alert.alert(t('Error'), err instanceof Error ? err.message : apiMessage(err));
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 16, backgroundColor: colors.background, flexGrow: 1 }}>
      <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 30, fontWeight: '700' }}>{t('My profile')}</Text>
      <ProfileEditor draft={draft} setDraft={setDraft} avatar={avatar} setAvatar={setAvatar} busy={busy} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text style={{ color: colors.text, flex: 1 }}>{t('Save a delivery address')}</Text>
        <Switch accessibilityLabel={t('Save a delivery address')} value={saveAddress} onValueChange={setSaveAddress} disabled={busy} />
      </View>
      {saveAddress ? <AddressEditor value={address} onChange={setAddress} busy={busy} /> : null}
      {busy ? <ActivityIndicator color={colors.accent} /> : null}
      <Button title={t('Save profile')} color={colors.accent} disabled={busy} onPress={() => void save()} />
    </ScrollView>
  );
}
