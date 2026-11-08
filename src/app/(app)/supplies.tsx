import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../context/PreferencesContext';
import { useSupplies } from '../../context/SuppliesContext';
import { changeSupplyStatus, sendSupplies, supplyStatusLabels, type SupplyDraftItem, type SupplyStatus } from '../../services/supplies';

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export default function SuppliesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors, t } = usePreferences();
  const { requests, loading, error, refresh } = useSupplies();
  const [requiredBy, setRequiredBy] = useState(tomorrow);
  const [notes, setNotes] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [draft, setDraft] = useState<SupplyDraftItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [area, setArea] = useState<'kitchen' | 'bar' | 'sushi' | null>(null);
  const requestKey = useRef<{ signature: string; key: string } | null>(null);
  const operation = useRef(false);
  const owner = user?.role === 'admin' || user?.role === 'owner';
  const staff = user?.role === 'kitchen' || user?.role === 'bar' || user?.role === 'sushi';
  const cardStyle = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }];
  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }];
  const visible = requests.filter((request) => !area || request.area === area);
  const canAdd = name.trim() && unit.trim() && /^\d{1,7}([.,]\d{1,2})?$/.test(quantity.trim()) && Number(quantity.replace(',', '.')) > 0 && draft.length < 30;

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  function addItem() {
    if (!canAdd || busy) return;
    setDraft((current) => [...current, {
      name: name.trim(), quantity: quantity.trim().replace(',', '.'), unit: unit.trim(), urgent,
    }]);
    setName('');
    setQuantity('');
    setUnit('');
    setUrgent(false);
  }

  async function submit() {
    if (operation.current || !draft.length) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requiredBy)) {
      Alert.alert(t('Error'), t('Use the date format YYYY-MM-DD.'));
      return;
    }
    operation.current = true;
    setBusy(true);
    const signature = JSON.stringify([requiredBy, notes, draft]);
    if (requestKey.current?.signature !== signature) {
      requestKey.current = { signature, key: Date.now().toString(36) + Math.random().toString(36).slice(2) };
    }
    try {
      const saved = await sendSupplies(requiredBy, notes.trim(), draft, requestKey.current.key);
      setDraft([]);
      setNotes('');
      requestKey.current = null;
      await refresh();
      Alert.alert(t('Supply list sent'), '#' + saved.id);
    } catch (err) {
      Alert.alert(t('Could not send the supply list.'), err instanceof Error ? err.message : '');
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  async function update(requestId: number, itemId: number, status: SupplyStatus) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    try {
      await changeSupplyStatus(requestId, itemId, status);
      await refresh();
    } catch (err) {
      Alert.alert(t('Error'), err instanceof Error ? err.message : t('Could not update supplies.'));
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  if (!owner && !staff) return <Text style={{ padding: 24, color: colors.text }}>{t('This screen is for restaurant staff.')}</Text>;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>{t(owner ? 'Supply inbox' : 'Supplies for the next service')}</Text>
      {user?.can_view_business || user?.area ? <Button color={colors.accent} title={t('View inventory')} onPress={() => router.navigate('/inventory')} /> : null}
      <Text style={{ color: colors.muted }}>{t(owner ? 'Review what each area needs and track purchases.' : 'Send the owner what your area needs for service.')}</Text>
      {staff ? (
        <View style={cardStyle}>
          <Text style={{ color: colors.accent, fontWeight: '700' }}>{t(user.area === 'bar' ? 'Drinks bar' : user.area === 'sushi' ? 'Sushi' : 'Kitchen')}</Text>
          <Text style={{ color: colors.text }}>{t('Service date')} · YYYY-MM-DD</Text>
          <TextInput accessibilityLabel={t('Service date')} value={requiredBy} onChangeText={setRequiredBy} maxLength={10} editable={!busy} style={inputStyle} />
          <TextInput accessibilityLabel={t('Supply name')} placeholder={t('Supply name')} placeholderTextColor={colors.muted} value={name} onChangeText={setName} maxLength={100} editable={!busy} style={inputStyle} />
          <View style={styles.row}>
            <TextInput accessibilityLabel={t('Quantity')} placeholder={t('Quantity')} placeholderTextColor={colors.muted} value={quantity} onChangeText={setQuantity} maxLength={10} keyboardType="decimal-pad" editable={!busy} style={[inputStyle, styles.grow]} />
            <TextInput accessibilityLabel={t('Unit')} placeholder={t('Unit: kg, bottles, pieces')} placeholderTextColor={colors.muted} value={unit} onChangeText={setUnit} maxLength={30} editable={!busy} style={[inputStyle, styles.grow]} />
          </View>
          <View style={styles.row}>
            <Text style={{ flex: 1, color: colors.text }}>{t('Urgent')}</Text>
            <Switch accessibilityLabel={t('Urgent')} value={urgent} onValueChange={setUrgent} disabled={busy} trackColor={{ true: colors.olive }} />
          </View>
          <Button title={t('Add supply')} color={colors.accent} onPress={addItem} disabled={!canAdd || busy} />
          {draft.map((item, index) => (
            <View key={index} style={[styles.item, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{item.name} · {item.quantity} {item.unit}</Text>
              {item.urgent ? <Text style={{ color: colors.accent }}>{t('Urgent')}</Text> : null}
              <Button title={t('Remove')} color={colors.accent} disabled={busy} onPress={() => setDraft((current) => current.filter((_, position) => position !== index))} />
            </View>
          ))}
          <TextInput accessibilityLabel={t('Notes for the owner')} placeholder={t('Notes for the owner')} placeholderTextColor={colors.muted} value={notes} onChangeText={setNotes} maxLength={1000} multiline editable={!busy} style={[inputStyle, { minHeight: 72 }]} />
          <Button title={t('Send supply list')} color={colors.accent} onPress={() => void submit()} disabled={busy || !draft.length} />
        </View>
      ) : null}
      <View style={styles.row}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text, flex: 1 }]}>{t('Submitted lists')}</Text>
        <Button title={t('Refresh')} color={colors.accent} onPress={() => void refresh()} disabled={busy || loading} />
      </View>
      {owner ? (
        <View style={styles.row}>
          {([{ value: null, label: 'All areas' }, { value: 'kitchen', label: 'Kitchen' }, { value: 'bar', label: 'Drinks bar' }, { value: 'sushi', label: 'Sushi' }] as const).map((option) => (
            <Pressable key={option.label} accessibilityRole="button" accessibilityState={{ selected: area === option.value }}
              style={[styles.filter, { backgroundColor: area === option.value ? colors.accent : colors.surface }]} onPress={() => setArea(option.value)}
            ><Text style={{ color: area === option.value ? colors.onAccent : colors.text }}>{t(option.label)}</Text></Pressable>
          ))}
        </View>
      ) : null}
      {loading || busy ? <ActivityIndicator color={colors.accent} /> : null}
      {error ? <Text accessibilityRole="alert" style={{ color: colors.accent }}>{error}</Text> : null}
      {!loading && !error && !visible.length ? <Text style={{ color: colors.muted }}>{t('There are no supply requests yet.')}</Text> : null}
      {visible.map((report) => (
        <View key={report.id} style={cardStyle}>
          <Text style={[styles.title, { color: colors.text }]}>#{report.id} · {t(report.area === 'bar' ? 'Drinks bar' : report.area === 'sushi' ? 'Sushi' : 'Kitchen')}</Text>
          <Text style={{ color: colors.text }}>{t('Service date')} · {report.required_by}</Text>
          <Text style={{ color: colors.muted }}>{report.author_name}</Text>
          {report.notes ? <Text style={{ color: colors.text }}>{report.notes}</Text> : null}
          {report.items.map((item) => (
            <View key={item.id} style={[styles.item, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{item.name} · {item.quantity} {item.unit}</Text>
              {item.urgent ? <Text style={{ color: colors.accent, fontWeight: '700' }}>{t('Urgent')}</Text> : null}
              <Text style={{ color: colors.muted }}>{t(supplyStatusLabels[item.status])}</Text>
              {owner && item.status === 'pending' ? <Button title={t('Mark purchased')} color={colors.accent} disabled={busy} onPress={() => void update(report.id, item.id, 'purchased')} /> : null}
              {item.status === 'purchased' ? <Button title={t('Confirm receipt')} color={colors.accent} disabled={busy} onPress={() =>
                Alert.alert(t('Confirm receipt'), item.name, [
                  { text: t('Cancel'), style: 'cancel' },
                  { text: t('Confirm'), onPress: () => void update(report.id, item.id, 'received') },
                ])
              } /> : null}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 16 },
  card: { padding: 16, borderRadius: 18, gap: 12, borderWidth: 1 },
  heading: { fontSize: 29, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700' },
  input: { borderWidth: 1, padding: 12, minHeight: 48, borderRadius: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  grow: { flex: 1, minWidth: 120 },
  item: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, gap: 8 },
  filter: { minHeight: 44, borderRadius: 22, padding: 12 },
});
