import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Button,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { colors } from '../../constants/restaurantColors';
import type { PageSize } from '../../utils/menuPreferences';
import {
    getMenuPageSize,
    PAGE_SIZES,
    saveMenuPageSize,
} from '../../utils/menuPreferences';

export default function SettingsScreen() {
  const router = useRouter();
  const [pageSize, setPageSize] = useState<PageSize | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    setLoadFailed(false);

    getMenuPageSize()
      .then((size) => {
        if (isActive) setPageSize(size);
      })
      .catch(() => {
        if (isActive) setLoadFailed(true);
      });

    return () => {
      isActive = false;
    };
  }, [reloadKey]);

  const handleSave = async () => {
    if (pageSize === null || saving) return;

    setSaving(true);

    try {
      await saveMenuPageSize(pageSize);
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la preferencia.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Platillos por página</Text>
      <Text style={styles.description}>
        Elige cuántos platillos quieres ver en cada página del menú.
      </Text>

      {loadFailed ? (
        <View>
          <Text>No se pudo cargar la preferencia.</Text>
          <Button color={colors.accent}
            title="Reintentar"
            onPress={() => setReloadKey((current) => current + 1)}
          />
        </View>
      ) : pageSize === null ? (
        <ActivityIndicator />
      ) : (
        <>
          <View style={styles.options}>
            {PAGE_SIZES.map((size) => {
              const isSelected = pageSize === size;

              return (
                <Pressable
                  key={size}
                  onPress={() => setPageSize(size)}
                  disabled={saving}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected, disabled: saving }}
                  style={[styles.option, isSelected && styles.selectedOption]}
                >
                  <Text style={isSelected ? styles.selectedText : styles.optionText}>
                    {size}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Button color={colors.accent}
            title={saving ? 'Guardando...' : 'Guardar'}
            onPress={handleSave}
            disabled={saving}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  description: { fontSize: 16, color: colors.muted },
  options: { flexDirection: 'row', gap: 12 },
  option: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectedOption: { backgroundColor: colors.accent },
  optionText: { color: colors.text, fontWeight: '600' },
  selectedText: { color: colors.onAccent, fontWeight: '600' },
});