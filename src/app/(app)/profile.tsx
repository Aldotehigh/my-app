
import { AddressEditor } from '../../components/AddressEditor';
import {
  emptyAddress,
  completeAddress,
  type Address,
} from '../../types/Address';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  ProfileEditor,
  profileForm,
  type ProfileDraft,
} from '../../components/ProfileEditor';
import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../context/PreferencesContext';
import {
  apiMessage,
  updateCustomerProfile,
} from '../../services/customerProfile';
import { useRouter } from 'expo-router';

const GOLD = '#D8B067';
const WINE = '#801C18';
const CREAM = '#F3DEC5';

export default function ProfileScreen() {
  const { user, updateUser } = useAuth();
  const { colors, t, isDark } = usePreferences();
  const router = useRouter();

  const accentColor = isDark ? GOLD : WINE;

  const [draft, setDraft] = useState<ProfileDraft>({
    username: user?.username ?? '',
    email: user?.email ?? '',
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
  });

  const [avatar, setAvatar] = useState<string | null>(
    user?.avatar ?? null
  );

  const [saveAddress, setSaveAddress] = useState(
    Boolean(user?.address?.street)
  );

  const [address, setAddress] = useState<Address>(
    user?.address?.street
      ? user.address
      : emptyAddress(
          [user?.first_name, user?.last_name]
            .filter(Boolean)
            .join(' ') || user?.username
        )
  );

  const [busy, setBusy] = useState(false);
  const operation = useRef(false);

  async function save() {
    if (operation.current) return;

    if (!draft.username.trim() || !draft.email.trim()) {
      Alert.alert(
        t('Error'),
        t('Enter your username and email.')
      );
      return;
    }

    if (saveAddress && !completeAddress(address)) {
      Alert.alert(
        t('Error'),
        t(
          'Complete the address, a valid phone number and a five-digit postal code.'
        )
      );
      return;
    }

    operation.current = true;
    setBusy(true);

    try {
      const form = await profileForm(
        draft,
        avatar !== user?.avatar ? avatar : null,
        saveAddress ? address : {}
      );

      const updated = await updateCustomerProfile(form);

      updateUser(updated);
      router.back();
    } catch (err) {
      Alert.alert(
        t('Error'),
        err instanceof Error
          ? err.message
          : apiMessage(err)
      );
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.headerLine,
          {
            backgroundColor: accentColor,
          },
        ]}
      />

      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { backgroundColor: colors.background },
        ]}
      >
        <Text
          accessibilityRole="header"
          style={[
            styles.title,
            { color: colors.text },
          ]}
        >
          {t('My profile')}
        </Text>

        <ProfileEditor
          draft={draft}
          setDraft={setDraft}
          avatar={avatar}
          setAvatar={setAvatar}
          busy={busy}
        />

        <View style={styles.addressRow}>
          <Text
            style={[
              styles.addressLabel,
              { color: colors.text },
            ]}
          >
            {t('Save a delivery address')}
          </Text>

          <Switch
            accessibilityLabel={t('Save a delivery address')}
            value={saveAddress}
            onValueChange={setSaveAddress}
            disabled={busy}
            trackColor={{
              false: WINE,
              true: accentColor,
            }}
            thumbColor={CREAM}
            ios_backgroundColor={WINE}
          />
        </View>

        {saveAddress ? (
          <AddressEditor
            value={address}
            onChange={setAddress}
            busy={busy}
          />
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Save profile')}
          accessibilityState={{
            disabled: busy,
            busy,
          }}
          disabled={busy}
          onPress={() => void save()}
          style={({ pressed }) => [
            styles.saveButton,
            {
              borderColor: accentColor,
              opacity: busy
                ? 0.5
                : pressed
                  ? 0.8
                  : 1,
            },
          ]}
        >
          {busy ? (
            <ActivityIndicator color={CREAM} />
          ) : (
            <Text style={styles.saveButtonText}>
              {t('Save profile')}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  headerLine: {
    width: '100%',
    height: 2,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
    flexGrow: 1,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
  },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  addressLabel: {
    flex: 1,
  },

  saveButton: {
    minHeight: 58,
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: WINE,
    borderWidth: 1.5,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonText: {
    color: CREAM,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
});
