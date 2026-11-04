import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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
  TextInput
} from 'react-native';
import { colors } from '../../constants/restaurantColors';
import { createCard, updateCard } from '../../services/cards';
import { CardItem } from '../../types/CardItem';

export default function FormScreen() {
  const { card } = useLocalSearchParams<{ card?: string }>();
  const editing: CardItem | null = card ? JSON.parse(card) : null;
  const router = useRouter();

  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [price, setPrice] = useState(editing?.price ?? '');
  const [imageUri, setImageUri] = useState<string | null>(editing?.image ?? null);
  const [isAvailable, setIsAvailable] = useState(editing?.is_available ?? true);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos');
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
    if (saving) return;

    if (!title.trim() || !description.trim() || !imageUri || !price.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    const normalizedPrice = price.trim().replace(',', '.');

    if (!/^\d{1,6}(\.\d{1,2})?$/.test(normalizedPrice)) {
      Alert.alert(
        'Precio inválido',
        'Ingresa un precio entre 0 y 999999.99, con máximo dos decimales.',
      );
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', normalizedPrice);
      formData.append('is_available', isAvailable.toString());
      formData.append('is_available', String(isAvailable));
      const isNewImage = imageUri !== editing?.image;
      if (isNewImage) {
        if (Platform.OS === 'web') {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          formData.append('image', blob, 'photo.jpg');

          // Nota: En web, el tipo MIME se infiere automáticamente del blob, por lo que no es necesario especificarlo.
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
        'Error',
        err instanceof Error ? err.message : 'No se pudo guardar'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Título</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Ej: Mi primera tarjeta"
        style={styles.input}
        editable={!saving}
      />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Describe la tarjeta..."
        style={[styles.input, styles.textArea]}
        multiline
        numberOfLines={4}
        editable={!saving}
      />
      <Text style={styles.label}>Precio (MXN)</Text>
      <TextInput
        value={price}
        onChangeText={setPrice}
        placeholder="Ej: 125.00"
        keyboardType="decimal-pad"
        style={styles.input}
        editable={!saving}
      />
      <Text style={styles.label}>Disponibilidad</Text>

      <Switch
        accessibilityLabel="Disponibilidad del platillo"
        value={isAvailable}
        onValueChange={setIsAvailable}
        disabled={saving}
      />

      <Text>
        {isAvailable ? 'Disponible' : 'Agotado'}
      </Text>
      <Text style={styles.label}>Imagen</Text>
      <Pressable
        onPress={pickImage}
        style={styles.imagePicker}
        disabled={saving}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        ) : (
          <Text style={styles.imagePickerText}>📷 Seleccionar imagen</Text>
        )}
      </Pressable>

      {imageUri && (
        <Pressable onPress={pickImage} disabled={saving}>
          <Text style={styles.changeImageText}>Cambiar imagen</Text>
        </Pressable>
      )}

      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={[styles.button, saving && styles.buttonDisabled]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {editing ? 'Actualizar' : 'Crear'}
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: colors.surface,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
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
