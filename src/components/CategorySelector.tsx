
import { categoryName } from '../utils/categoryNames';
import { announce } from '../utils/announce';
import { usePreferences } from '../context/PreferencesContext';
import type { RestaurantColors } from '../constants/restaurantColors';
import { useRef, useState } from 'react';

import {
  AccessibilityInfo,
  findNodeHandle,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import type { Category } from '../types/CardItem';

// ============================================
// COLORES DE YOTSUBA
// ============================================

const GOLD = '#D8B067';
const WINE = '#801C18';
const TERRACOTTA = '#A34437';
const LIGHT_SOFT = '#F2DDD2';
const CREAM = '#FFF1DF';

// ============================================
// PROPIEDADES
// ============================================

interface Props {
  emptyLabel?: string;
  fieldLabel?: string;
  collectionLabel?: string;
  searchLabel?: string;
  categories: Category[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

// ============================================
// NORMALIZAR BÚSQUEDA
// ============================================

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// ============================================
// SELECTOR DE CATEGORÍAS Y MESAS
// ============================================

export default function CategorySelector({
  categories,
  selectedId,
  onSelect,
  emptyLabel,
  fieldLabel,
  collectionLabel,
  searchLabel,
}: Props) {
  const {
    colors,
    t,
    isDark,
    reduceMotion,
    screenReaderEnabled,
    preferences,
  } = usePreferences();

  const styles = createStyles(colors, isDark);

  const headingRef = useRef<Text>(null);
  const triggerRef = useRef<View>(null);

  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  // ============================================
  // ACCESIBILIDAD
  // ============================================

  const focusHeading = () => {
    const node = findNodeHandle(headingRef.current);

    if (screenReaderEnabled && node) {
      AccessibilityInfo.setAccessibilityFocus(node);
    }
  };

  const restoreFocus = () => {
    const node = findNodeHandle(triggerRef.current);

    if (screenReaderEnabled && node) {
      AccessibilityInfo.setAccessibilityFocus(node);
    }
  };

  // ============================================
  // CATEGORÍAS TRADUCIDAS
  // ============================================

  const localizedCategories = categories.map((category) => ({
    ...category,
    name: categoryName(
      category.name,
      preferences.language
    ),
    originalName: category.name,
  }));

  const selectedName =
    localizedCategories.find(
      (category) => category.id === selectedId
    )?.name ??
    (emptyLabel ?? t('All categories'));

  // ============================================
  // FILTRAR RESULTADOS
  // ============================================

  const results = localizedCategories.filter((category) =>
    [category.name, category.originalName].some((name) =>
      normalize(name).includes(normalize(query))
    )
  );

  // ============================================
  // SELECCIONAR OPCIÓN
  // ============================================

  const handleSelect = (id: number | null) => {
    onSelect(id);

    const name =
      localizedCategories.find(
        (category) => category.id === id
      )?.name ??
      (emptyLabel ?? t('All categories'));

    announce(`${t('Category selected')}: ${name}`);

    setVisible(false);
    setQuery('');
  };

  // ============================================
  // CERRAR MODAL
  // ============================================

  const closeModal = () => {
    setVisible(false);
    setQuery('');
  };

  // ============================================
  // PANTALLA
  // ============================================

  return (
    <>
      {/* =====================================
          SELECTOR PRINCIPAL
          MESA / SELECCIONA UNA MESA
      ===================================== */}

      <Pressable
        ref={triggerRef}
        style={styles.selector}
        accessibilityRole="button"
        accessibilityLabel={`${
          fieldLabel ?? t('Category')
        }: ${selectedName}`}
        accessibilityHint={
          collectionLabel ??
          t('Opens the category list')
        }
        onPress={() => {
          setQuery('');
          setVisible(true);
        }}
      >
        <View style={styles.selectorContent}>
          <Text style={styles.label}>
            {fieldLabel ?? t('CATEGORY')}
          </Text>

          <Text style={styles.selectedName}>
            {selectedName}
          </Text>
        </View>

        {/* FLECHA ADAPTADA AL TEMA */}

        <Text style={styles.arrow}>
          ⌄
        </Text>
      </Pressable>

      {/* =====================================
          MODAL DE SELECCIÓN
      ===================================== */}

      <Modal
        supportedOrientations={[
          'portrait',
          'landscape',
        ]}
        visible={visible}
        animationType={
          reduceMotion ? 'none' : 'slide'
        }
        onShow={focusHeading}
        onDismiss={restoreFocus}
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView
          accessibilityViewIsModal
          style={styles.modal}
        >
          <KeyboardAvoidingView
            style={styles.modalContent}
            behavior={
              Platform.OS === 'ios'
                ? 'padding'
                : undefined
            }
          >
            {/* =================================
                ENCABEZADO DEL MODAL
            ================================= */}

            <View style={styles.header}>
              <Text
                ref={headingRef}
                accessible
                accessibilityRole="header"
                style={styles.title}
              >
                {collectionLabel ?? t('Categories')}
              </Text>

              {/* BOTÓN CERRAR COLOR VINO */}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('Close')}
                onPress={closeModal}
                style={({ pressed }) => [
                  styles.close,
                  {
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={styles.closeText}>
                  {t('Close')}
                </Text>
              </Pressable>
            </View>

            {/* =================================
                BUSCADOR
                DORADO / TERRACOTA
            ================================= */}

            <TextInput
              keyboardAppearance={
                isDark ? 'dark' : 'light'
              }
              value={query}
              onChangeText={setQuery}
              placeholder={
                searchLabel ?? t('Search categories')
              }
              placeholderTextColor={colors.muted}
              accessibilityLabel={
                searchLabel ?? t('Search categories')
              }
              autoCorrect={false}
              clearButtonMode="while-editing"
              style={styles.search}
            />

            {/* =================================
                LISTA DE MESAS
            ================================= */}

            <FlatList
              data={results}
              keyExtractor={(item) =>
                String(item.id)
              }
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.list}

              // OPCIÓN SIN SELECCIÓN

              ListHeaderComponent={
                <Pressable
                  accessibilityLabel={
                    emptyLabel ?? t('All categories')
                  }
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: selectedId === null,
                  }}
                  onPress={() =>
                    handleSelect(null)
                  }
                  style={({ pressed }) => [
                    styles.row,
                    selectedId === null &&
                      styles.selectedRow,
                    {
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={styles.rowText}>
                    {emptyLabel ?? t('All categories')}
                  </Text>

                  {selectedId === null ? (
                    <Text style={styles.check}>
                      ✓
                    </Text>
                  ) : null}
                </Pressable>
              }

              // SIN RESULTADOS

              ListEmptyComponent={
                <Text style={styles.empty}>
                  {t(
                    'No categories match that name.'
                  )}
                </Text>
              }

              // OPCIONES DISPONIBLES

              renderItem={({ item }) => {
                const selected =
                  selectedId === item.id;

                return (
                  <Pressable
                    accessibilityLabel={item.name}
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: selected,
                    }}
                    onPress={() =>
                      handleSelect(item.id)
                    }
                    style={({ pressed }) => [
                      styles.row,
                      selected &&
                        styles.selectedRow,
                      {
                        opacity: pressed
                          ? 0.8
                          : 1,
                      },
                    ]}
                  >
                    <Text style={styles.rowText}>
                      {item.name}
                    </Text>

                    {/* PALOMITA DE SELECCIÓN */}

                    {selected ? (
                      <Text style={styles.check}>
                        ✓
                      </Text>
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

// ============================================
// ESTILOS PARA AMBOS MODOS
// ============================================

const createStyles = (
  colors: RestaurantColors,
  isDark: boolean
) =>
  StyleSheet.create({
    // =========================================
    // SELECTOR PRINCIPAL
    // =========================================

    selector: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      padding: 16,
      marginTop: 12,
      borderWidth: 1.5,
      borderColor: isDark
        ? GOLD
        : TERRACOTTA,
      borderRadius: 18,
      backgroundColor: colors.surface,
    },

    selectorContent: {
      flex: 1,
      gap: 5,
    },

    label: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
    },

    selectedName: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '600',
    },

    arrow: {
      color: isDark
        ? GOLD
        : WINE,
      fontSize: 24,
    },

    // =========================================
    // MODAL SIN BORDE EXTERIOR
    // =========================================

    modal: {
      flex: 1,
      backgroundColor: colors.background,
    },

    modalContent: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // =========================================
    // ENCABEZADO
    // =========================================

    header: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
      gap: 12,
    },

    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      flexShrink: 1,
    },

    // =========================================
    // BOTÓN CERRAR
    // IGUAL EN AMBOS MODOS
    // =========================================

    close: {
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 18,
      borderRadius: 999,
      backgroundColor: WINE,
      borderWidth: 1,
      borderColor: TERRACOTTA,
    },

    closeText: {
      color: CREAM,
      fontSize: 16,
      fontWeight: '700',
    },

    // =========================================
    // BUSCADOR
    // =========================================

    search: {
      margin: 20,
      padding: 14,
      minHeight: 52,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: isDark
        ? GOLD
        : TERRACOTTA,
      fontSize: 16,
      color: colors.text,
    },

    // =========================================
    // CONTENEDOR DE LA LISTA
    // =========================================

    list: {
      paddingHorizontal: 20,
      paddingBottom: 24,
      gap: 10,
    },

    // =========================================
    // CADA OPCIÓN DE MESA
    // =========================================

    row: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1.2,
      borderColor: isDark
        ? GOLD
        : TERRACOTTA,
    },

    // =========================================
    // OPCIÓN SELECCIONADA
    // =========================================

    selectedRow: {
      backgroundColor: isDark
        ? colors.soft
        : LIGHT_SOFT,
      borderWidth: 1.8,
      borderColor: isDark
        ? GOLD
        : TERRACOTTA,
    },

    // =========================================
    // TEXTO DE LAS MESAS
    // =========================================

    rowText: {
      flex: 1,
      color: colors.text,
      fontSize: 17,
    },

    // =========================================
    // PALOMITA
    // =========================================

    check: {
      color: isDark
        ? GOLD
        : WINE,
      fontSize: 24,
      fontWeight: '800',
    },

    // =========================================
    // SIN RESULTADOS
    // =========================================

    empty: {
      color: colors.muted,
      fontSize: 16,
      paddingVertical: 20,
    },
  });
