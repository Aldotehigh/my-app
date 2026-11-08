import { announce } from '../utils/announce';
import { usePreferences } from '../context/PreferencesContext';
import type { RestaurantColors } from '../constants/restaurantColors';
import { useRef, useState } from 'react';
import { AccessibilityInfo, findNodeHandle, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Category } from '../types/CardItem';

interface Props {
  emptyLabel?: string;
  fieldLabel?: string;
  collectionLabel?: string;
  searchLabel?: string;
  categories: Category[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export default function CategorySelector({ categories, selectedId, onSelect, emptyLabel, fieldLabel, collectionLabel, searchLabel }: Props) {
  const { colors, t, isDark, reduceMotion, screenReaderEnabled } = usePreferences();
  const styles = createStyles(colors);

  const headingRef = useRef<Text>(null);
  const triggerRef = useRef<View>(null);

  const focusHeading = () => {
    const node = findNodeHandle(headingRef.current);
    if (screenReaderEnabled && node) AccessibilityInfo.setAccessibilityFocus(node);
  };
  const restoreFocus = () => {
    const node = findNodeHandle(triggerRef.current);
    if (screenReaderEnabled && node) AccessibilityInfo.setAccessibilityFocus(node);
  };

  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const selectedName = categories.find((category) => category.id === selectedId)?.name ?? (emptyLabel ?? t("All categories"));
  const results = categories.filter((category) => normalize(category.name).includes(normalize(query)));

  const handleSelect = (id: number | null) => {
    onSelect(id);
    const name = categories.find((category) => category.id === id)?.name ?? (emptyLabel ?? t('All categories'));
    announce(`${t('Category selected')}: ${name}`);
    setVisible(false);
    setQuery('');
  };

  return (
    <>
      <Pressable
        ref={triggerRef}
        style={styles.selector}
        accessibilityRole="button"
        accessibilityLabel={`${fieldLabel ?? t('Category')}: ${selectedName}`}
        accessibilityHint={collectionLabel ?? t("Opens the category list")}
        onPress={() => { setQuery(''); setVisible(true); }}
      >
        <View style={styles.selectorContent}>
          <Text style={styles.label}>{fieldLabel ?? t("CATEGORY")}</Text>
          <Text style={styles.selectedName}>{selectedName}</Text>
        </View>
        <Text style={styles.arrow}>⌄</Text>
      </Pressable>

      <Modal supportedOrientations={['portrait', 'landscape']} visible={visible} animationType={reduceMotion ? 'none' : 'slide'} onShow={focusHeading} onDismiss={restoreFocus} presentationStyle="pageSheet" onRequestClose={() => setVisible(false)}>
        <SafeAreaView accessibilityViewIsModal style={styles.modal}>
          <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.header}>
              <Text ref={headingRef} accessible accessibilityRole="header" style={styles.title}>{collectionLabel ?? t("Categories")}</Text>
              <Pressable accessibilityRole="button" onPress={() => setVisible(false)} style={styles.close}>
                <Text style={styles.closeText}>{t("Close")}</Text>
              </Pressable>
            </View>
            <TextInput keyboardAppearance={isDark ? 'dark' : 'light'}
              value={query}
              onChangeText={setQuery}
              placeholder={searchLabel ?? t("Search categories")}
              placeholderTextColor={colors.muted}
              accessibilityLabel={searchLabel ?? t("Search categories")}
              autoCorrect={false}
              clearButtonMode="while-editing"
              style={styles.search}
            />
            <FlatList
              data={results}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.list}
              ListHeaderComponent={
                <Pressable accessibilityLabel={emptyLabel ?? t("All categories")} accessibilityRole="radio" accessibilityState={{ checked: selectedId === null }} onPress={() => handleSelect(null)} style={[styles.row, selectedId === null && styles.selectedRow]}>
                  <Text style={styles.rowText}>{emptyLabel ?? t("All categories")}</Text>
                  {selectedId === null ? <Text style={styles.check}>✓</Text> : null}
                </Pressable>
              }
              ListEmptyComponent={<Text style={styles.empty}>{t("No categories match that name.")}</Text>}
              renderItem={({ item }) => (
                <Pressable accessibilityLabel={item.name} accessibilityRole="radio" accessibilityState={{ checked: selectedId === item.id }} onPress={() => handleSelect(item.id)} style={[styles.row, selectedId === item.id && styles.selectedRow]}>
                  <Text style={styles.rowText}>{item.name}</Text>
                  {selectedId === item.id ? <Text style={styles.check}>✓</Text> : null}
                </Pressable>
              )}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const createStyles = (colors: RestaurantColors) => StyleSheet.create({
  selector: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, marginTop: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface },
  selectorContent: { flex: 1, gap: 5 },
  label: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  selectedName: { color: colors.text, fontSize: 17, fontWeight: '600' },
  arrow: { color: colors.accent, fontSize: 24 },
  modal: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  close: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  closeText: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  search: { margin: 20, padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, fontSize: 16, color: colors.text },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 8 },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, backgroundColor: colors.surface },
  selectedRow: { backgroundColor: colors.soft },
  rowText: { flex: 1, color: colors.text, fontSize: 17 },
  check: { color: colors.accent, fontSize: 20, fontWeight: '700' },
  empty: { color: colors.muted, fontSize: 16, paddingVertical: 20 },
});
