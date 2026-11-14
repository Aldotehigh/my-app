
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { usePreferences } from '../context/PreferencesContext';

const GOLD = '#D8B067';
const WINE = '#801C18';
const CREAM = '#F3DEC5';

export interface ProfileDraft {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export async function profileForm(
  draft: ProfileDraft,
  avatarUri: string | null,
  address?: object
) {
  const data = new FormData();

  if (address !== undefined) {
    data.append('address', JSON.stringify(address));
  }

  for (const [key, value] of Object.entries(draft)) {
    data.append(key, value.trim());
  }

  if (avatarUri) {
    if (Platform.OS === 'web') {
      const response = await fetch(avatarUri);

      data.append(
        'avatar',
        await response.blob(),
        'avatar.jpg'
      );
    } else {
      const filename =
        avatarUri.split('/').pop() || 'avatar.jpg';

      const extension = filename
        .split('.')
        .pop()
        ?.toLowerCase();

      const type =
        extension === 'png'
          ? 'image/png'
          : extension === 'webp'
            ? 'image/webp'
            : 'image/jpeg';

      data.append(
        'avatar',
        {
          uri: avatarUri,
          name: filename,
          type,
        } as unknown as Blob
      );
    }
  }

  return data;
}

export function ProfileEditor({
  draft,
  setDraft,
  avatar,
  setAvatar,
  busy,
}: {
  draft: ProfileDraft;
  setDraft: (value: ProfileDraft) => void;
  avatar: string | null;
  setAvatar: (value: string) => void;
  busy: boolean;
}) {
  const { colors, t, isDark } = usePreferences();

  const [failedImage, setFailedImage] =
    useState<string | null>(null);

  const [picking, setPicking] = useState(false);

  const accentColor = isDark ? GOLD : WINE;

  async function pick() {
    if (busy || picking) return;

    setPicking(true);

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          t('Permission denied'),
          t('We need access to your photos')
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.75,
        });

      if (!result.canceled && result.assets[0]) {
        setFailedImage(null);
        setAvatar(result.assets[0].uri);
      }
    } catch {
      Alert.alert(
        t('Error'),
        t('Could not open your photos.')
      );
    } finally {
      setPicking(false);
    }
  }

  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          alignItems: 'center',
          gap: 12,
          marginBottom: 8,
        }}
      >
        {avatar && failedImage !== avatar ? (
          <Image
            accessible={false}
            source={{ uri: avatar }}
            onError={() => setFailedImage(avatar)}
            style={{
              width: 92,
              height: 92,
              borderRadius: 46,
            }}
          />
        ) : (
          <View
            style={{
              width: 92,
              height: 92,
              borderRadius: 46,
              backgroundColor: colors.soft,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: accentColor,
                fontSize: 32,
              }}
            >
              {(draft.first_name || draft.username || '?')
                .slice(0, 1)
                .toUpperCase()}
            </Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Choose profile photo')}
          accessibilityState={{
            disabled: busy || picking,
            busy: picking,
          }}
          disabled={busy || picking}
          onPress={() => void pick()}
          style={({ pressed }) => ({
            minHeight: 52,
            minWidth: 230,
            maxWidth: '100%',
            paddingHorizontal: 22,
            paddingVertical: 12,
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: accentColor,
            backgroundColor: WINE,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            opacity:
              busy || picking
                ? 0.5
                : pressed
                  ? 0.8
                  : 1,
          })}
        >
          {picking ? (
            <ActivityIndicator color={CREAM} />
          ) : (
            <Text
              style={{
                color: CREAM,
                fontSize: 15,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              {t('Choose profile photo')}
            </Text>
          )}
        </Pressable>
      </View>

      {([
        ['first_name', 'First name'],
        ['last_name', 'Last name'],
        ['username', 'Username'],
        ['email', 'Email'],
      ] as const).map(([key, label]) => (
        <View
          key={key}
          style={{ gap: 5 }}
        >
          <Text
            style={{
              color: colors.text,
              fontWeight: '600',
            }}
          >
            {t(label)}
          </Text>

          <TextInput
            accessibilityLabel={t(label)}
            value={draft[key]}
            editable={!busy}
            onChangeText={(value) =>
              setDraft({
                ...draft,
                [key]: value,
              })
            }
            autoCapitalize={
              key === 'email' || key === 'username'
                ? 'none'
                : 'words'
            }
            keyboardType={
              key === 'email'
                ? 'email-address'
                : 'default'
            }
            maxLength={
              key === 'email' ? 254 : 150
            }
            style={{
              minHeight: 48,
              padding: 12,
              color: colors.text,
              borderWidth: 1,
              borderColor: accentColor,
              borderRadius: 10,
              backgroundColor: colors.surface,
            }}
          />
        </View>
      ))}
    </View>
  );
}
