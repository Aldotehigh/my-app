import { useAuth } from '../../context/AuthContext';
import CategorySelector from '../../components/CategorySelector';
import { getCategories } from '../../services/categories';
import type { Category } from '../../types/CardItem';
import { usePreferences } from '../../context/PreferencesContext';
import type { RestaurantColors } from '../../constants/restaurantColors';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  Button,
} from 'react-native';
import { createCard, updateCard } from '../../services/cards';
import { CardItem } from '../../types/CardItem';

export default function FormScreen() {
  const { colors, t, isDark } = usePreferences();
  const styles = createStyles(colors);

  const { card } = useLocalSearchParams<{ card?: string }>();
  const editing: CardItem | null = card ? JSON.parse(card) : null;
  const router = useRouter();
  const { user } = useAuth();
  const canEditMenu = Boolean(user?.can_edit_menu ?? user?.can_manage_menu);

  const [title, setTitle] = useState(editing?.title ?? '');
  const [englishDescription, setEnglishDescription] = useState(editing?.description_en ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [price, setPrice] = useState(editing?.price ?? '');
  const [imageUri, setImageUri] = useState<string | null>(editing?.image ?? null);
  const [isAvailable, setIsAvailable] = useState(editing?.is_available ?? true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(editing?.category?.id ?? null);
  const [categoryError, setCategoryError] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryReloadKey, setCategoryReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setCategoriesLoading(true);
    setCategoryError(false);
    getCategories().then((data) => {
      if (active) setCategories(user?.area ? data.filter((category) => category.area === user.area) : data);
    }).catch(() => {
      if (active) setCategoryError(true);
    }).finally(() => {
      if (active) setCategoriesLoading(false);
    });
    return () => { active = false; };
  }, [categoryReloadKey, user?.area]);


  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t("Permission denied"), t("We need access to your photos"));
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (saving || !canEditMenu || categoriesLoading || categoryError) return;

    if (categoryId === null) {
      Alert.alert(t('Error'), t('Select a category.'));
      return;
    }

    if (!title.trim() || !description.trim() || !price.trim()) {
      Alert.alert(t("Error"), t("Enter the title, description and price."));
      return;
    }

    const normalizedPrice = price.trim().replace(',', '.');

    if (!/^\d{1,6}(\.\d{1,2})?$/.test(normalizedPrice)) {
      Alert.alert(
        t("Invalid price"),
        t("Enter a price from 0 to 999999.99 with up to two decimal places."),
      );
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('description_en', englishDescription.trim());
      formData.append('price', normalizedPrice);
      formData.append('category_id', String(categoryId));
      formData.append('is_available', String(isAvailable));
      if (imageUri && imageUri !== editing?.image) {
        if (Platform.OS === 'web') {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          formData.append('image', blob, 'photo.jpg');

          // The browser supplies the MIME type from the blob.
        } else {
          const filename = imageUri.split('/').pop() || 'photo.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          formData.append('image', {
            uri: imageUri,
            name: filename,
            type,
          } as any);
        }
      }

      if (editing) {
        await updateCard(Number(editing.id), formData);
      } else {
        await createCard(formData);
      }

      router.back();
    } catch (err) {
      Alert.alert(
        t("Error"),
        err instanceof Error ? err.message : t("Could not save")
      );
    } finally {
      setSaving(false);
    }
  };

  if (!canEditMenu) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 16, backgroundColor: colors.background }}>
        <Text style={{ color: colors.text }}>{t('You cannot edit items in this area.')}</Text>
        <Button color={colors.accent} title={t('Back to menu')} onPress={() => router.replace('/(app)')} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>{t("Title")}</Text>
      <TextInput placeholderTextColor={colors.muted} keyboardAppearance={isDark ? 'dark' : 'light'}
        value={title}
        onChangeText={setTitle}
        accessibilityLabel={t("Title")}
        placeholder={t(user?.area === 'bar' ? "Example: drink of the day" : "Example: Grilled salmon")}
        style={styles.input}
        editable={!saving}
      />

      <Text style={styles.label}>{t("Description")}</Text>
      <TextInput placeholderTextColor={colors.muted} keyboardAppearance={isDark ? 'dark' : 'light'}
        value={description}
        onChangeText={setDescription}
        accessibilityLabel={t("Description")}
        placeholder={t(user?.area === 'bar' ? "Describe the drink..." : "Describe the dish...")}
        style={[styles.input, styles.textArea]}
        multiline
        numberOfLines={4}
        editable={!saving}
      />
      <Text style={styles.label}>{t("English description")}</Text>
      <TextInput value={englishDescription} onChangeText={setEnglishDescription}
        accessibilityLabel={t("English description")} keyboardAppearance={isDark ? 'dark' : 'light'}
        style={[styles.input, styles.textArea]} multiline editable={!saving} />
      <Text style={styles.label}>{t("Price (MXN)")}</Text>
      <TextInput placeholderTextColor={colors.muted} keyboardAppearance={isDark ? 'dark' : 'light'}
        value={price}
        onChangeText={setPrice}
        accessibilityLabel={t("Price (MXN)")}
        placeholder={t("Example: 125.00")}
        keyboardType="decimal-pad"
        style={styles.input}
        editable={!saving}
      />
      <Text style={styles.label}>{t('Category')}</Text>
      {categoriesLoading ? <ActivityIndicator color={colors.accent} /> : categoryError ? (
        <View style={{ gap: 12 }}>
          <Text style={{ color: colors.text }}>{t('Could not load categories.')}</Text>
          <Button color={colors.accent} title={t('Retry')} onPress={() => setCategoryReloadKey((current) => current + 1)} />
        </View>
      ) : (
        <CategorySelector
          categories={categories}
          selectedId={categoryId}
          onSelect={setCategoryId}
          emptyLabel={t('Select a category')}
        />
      )}
      <Text style={styles.label}>{t("Availability")}</Text>

      <Switch
        accessibilityLabel={t("Dish availability")}
        value={isAvailable}
        onValueChange={setIsAvailable}
        disabled={saving}
      />

      <Text style={{ color: colors.text }}>
        {isAvailable ? t("Available") : t("Sold out")}
      </Text>
      <Text style={styles.label}>{t("Image (optional)")}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("Choose image")}
        onPress={pickImage}
        style={styles.imagePicker}
        disabled={saving}
      >
        {imageUri ? (
          <Image accessible={false} source={{ uri: imageUri }} style={styles.imagePreview} />
        ) : (
          <Text style={styles.imagePickerText}>{t("📷 Choose image")}</Text>
        )}
      </Pressable>

      {imageUri && (
        <Pressable onPress={pickImage} disabled={saving}>
          <Text style={styles.changeImageText}>{t("Change image")}</Text>
        </Pressable>
      )}

      <Pressable
        onPress={handleSave}
        disabled={saving || categoriesLoading || categoryError}
        style={[styles.button, saving && styles.buttonDisabled]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {editing ? t("Update") : t("Create")}
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const createStyles = (colors: RestaurantColors) => StyleSheet.create({
  container: { padding: 24, backgroundColor: colors.background, flexGrow: 1 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.onAccent, fontWeight: '600', fontSize: 16 },
  imagePicker: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  imagePickerText: { fontSize: 16, color: colors.muted },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  changeImageText: {
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
});
