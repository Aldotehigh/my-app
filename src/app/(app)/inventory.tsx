import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../context/PreferencesContext';
import {
  createInventory, getInventory, getInventoryHistory, moveInventory, setInventoryMinimum,
  type InventoryItem, type InventoryMovement,
} from '../../services/business';

export default function InventoryScreen() {
  const { user } = useAuth();
  const { colors, t } = usePreferences();
  const owner = Boolean(user?.can_view_business);
  const allowed = owner || user?.area === 'bar' || user?.area === 'kitchen' || user?.area === 'sushi';
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [history, setHistory] = useState<InventoryMovement[]>([]);
  const [area, setArea] = useState<'kitchen' | 'bar' | 'sushi'>('kitchen');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [opening, setOpening] = useState('0');
  const [minimum, setMinimum] = useState('0');
  const [newMinimum, setNewMinimum] = useState('0');
  const [kind, setKind] = useState<'in' | 'out' | 'count'>('out');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const operation = useRef(false);
  const requestKey = useRef<{ signature: string; key: string } | null>(null);
  const selectionVersion = useRef(0);
  const panel = [styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }];
  const input = [styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }];
  const quantityValid = (value: string) => /^\d{1,9}([.,]\d{1,3})?$/.test(value.trim());

  const refresh = useCallback(async () => {
    if (!allowed) { setLoading(false); return; }
    setLoading(true);
    try {
      setItems(await getInventory());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Could not load inventory.'));
    } finally {
      setLoading(false);
    }
  }, [allowed, t]);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  async function open(item: InventoryItem) {
    const version = ++selectionVersion.current;
    setSelected(item);
    setNewMinimum(item.minimum);
    setAmount('');
    setReason('');
    setHistory([]);
    try {
      const moves = await getInventoryHistory(item.id);
      if (version === selectionVersion.current) setHistory(moves);
    } catch (err) {
      Alert.alert(t('Error'), err instanceof Error ? err.message : t('Could not load movements.'));
    }
  }

  async function create() {
    if (operation.current || !name.trim() || !unit.trim() || !quantityValid(opening) || !quantityValid(minimum)) return;
    operation.current = true;
    setBusy(true);
    try {
      await createInventory({
        area, name: name.trim(), unit: unit.trim(),
        quantity: opening.trim().replace(',', '.'), minimum: minimum.trim().replace(',', '.'),
      });
      setName(''); setUnit(''); setOpening('0'); setMinimum('0');
      await refresh();
    } catch (err) {
      Alert.alert(t('Error'), err instanceof Error ? err.message : t('Could not create stock item.'));
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  async function movement() {
    if (!selected || operation.current || !quantityValid(amount) || !reason.trim()) return;
    operation.current = true;
    setBusy(true);
    const signature = JSON.stringify([selected.id, kind, amount, reason]);
    if (requestKey.current?.signature !== signature) {
      requestKey.current = { signature, key: Date.now().toString(36) + Math.random().toString(36).slice(2) };
    }
    try {
      const updated = await moveInventory(selected.id, kind, amount.trim().replace(',', '.'), reason.trim(), requestKey.current.key);
      requestKey.current = null;
      await open(updated);
      await refresh();
    } catch (err) {
      Alert.alert(t('Error'), err instanceof Error ? err.message : t('Could not record movement.'));
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  async function updateMinimum() {
    if (!selected || operation.current || !quantityValid(newMinimum)) return;
    operation.current = true;
    setBusy(true);
    try {
      const updated = await setInventoryMinimum(selected.id, newMinimum.replace(',', '.'));
      setSelected(updated);
      await refresh();
    } catch (err) {
      Alert.alert(t('Error'), err instanceof Error ? err.message : t('Could not update minimum stock.'));
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  if (!allowed) return <Text style={{ color: colors.text, padding: 24 }}>{t('Owner access required.')}</Text>;
  const movementLabels: Record<string, string> = {
    in: 'Stock entry', out: 'Stock usage', count: 'Physical count', opening: 'Opening balance', receipt: 'Supply receipt',
  };
  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>{t('Inventory')}</Text>
      <Text style={{ color: colors.muted }}>{t('Supply receipts add stock. Record usage and physical counts to keep quantities current.')}</Text>
      <Button title={t('Refresh')} color={colors.accent} disabled={busy || loading} onPress={() => void refresh()} />
      {owner ? (
        <View style={panel}>
          <Text style={[styles.title, { color: colors.text }]}>{t('New stock item')}</Text>
          <View style={styles.row}>
            {(['kitchen', 'bar', 'sushi'] as const).map((value) => <Button key={value} title={(area === value ? '✓ ' : '') + t(value === 'bar' ? 'Drinks bar' : value === 'sushi' ? 'Sushi' : 'Kitchen')} color={colors.accent} disabled={busy} onPress={() => setArea(value)} />)}
          </View>
          <TextInput accessibilityLabel={t('Supply name')} placeholder={t('Supply name')} placeholderTextColor={colors.muted} value={name} onChangeText={setName} maxLength={100} editable={!busy} style={input} />
          <TextInput accessibilityLabel={t('Unit')} placeholder={t('Unit: kg, bottles, pieces')} placeholderTextColor={colors.muted} value={unit} onChangeText={setUnit} maxLength={30} editable={!busy} style={input} />
          <Text style={{ color: colors.text }}>{t('Opening balance')}</Text>
          <TextInput accessibilityLabel={t('Opening balance')} value={opening} onChangeText={setOpening} keyboardType="decimal-pad" editable={!busy} style={input} />
          <Text style={{ color: colors.text }}>{t('Minimum stock')}</Text>
          <TextInput accessibilityLabel={t('Minimum stock')} value={minimum} onChangeText={setMinimum} keyboardType="decimal-pad" editable={!busy} style={input} />
          <Button title={t('Create stock item')} color={colors.accent} disabled={busy || !name.trim() || !unit.trim() || !quantityValid(opening) || !quantityValid(minimum)} onPress={() => void create()} />
        </View>
      ) : null}
      {loading || busy ? <ActivityIndicator color={colors.accent} /> : null}
      {error ? <Text accessibilityRole="alert" style={{ color: colors.accent }}>{error}</Text> : null}
      {!items.length && !loading && !error ? <Text style={{ color: colors.muted }}>{t('No stock items yet. Enter opening balances or receive a supply request.')}</Text> : null}
      {items.map((item) => (
        <View key={item.id} style={panel}>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void open(item)} style={{ gap: 7, minHeight: 48 }}>
            <Text style={[styles.title, { color: colors.text }]}>{item.name}</Text>
            <Text style={{ color: colors.text }}>{t(item.area === 'bar' ? 'Drinks bar' : item.area === 'sushi' ? 'Sushi' : 'Kitchen')} · {item.quantity} {item.unit}</Text>
            <Text style={{ color: item.low_stock ? colors.accent : colors.muted }}>{t('Minimum stock')} · {item.minimum} {item.unit}{item.low_stock ? ' · ' + t('Low stock') : ''}</Text>
            <Text style={{ color: colors.accent }}>{t('View movements')}</Text>
          </Pressable>
          {selected?.id === item.id ? (
            <View style={{ gap: 10 }}>
              {owner ? (
                <>
                  <Text style={{ color: colors.text }}>{t('Record inventory movement')}</Text>
                  <View style={styles.row}>
                    {(['in', 'out', 'count'] as const).map((value) => <Button key={value} color={colors.accent} title={(kind === value ? '✓ ' : '') + t(movementLabels[value])} disabled={busy} onPress={() => setKind(value)} />)}
                  </View>
                  <TextInput accessibilityLabel={t(kind === 'count' ? 'Counted quantity' : 'Quantity')} placeholder={t(kind === 'count' ? 'Counted quantity' : 'Quantity')} placeholderTextColor={colors.muted} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" editable={!busy} style={input} />
                  <TextInput accessibilityLabel={t('Movement reason')} placeholder={t('Movement reason')} placeholderTextColor={colors.muted} value={reason} onChangeText={setReason} maxLength={200} editable={!busy} style={input} />
                  <Button title={t('Save movement')} color={colors.accent} disabled={busy || !quantityValid(amount) || !reason.trim() || (kind !== 'count' && Number(amount.replace(',', '.')) === 0)} onPress={() =>
                    Alert.alert(t('Confirm'), item.name + ' · ' + t(movementLabels[kind]) + ' · ' + amount + ' ' + item.unit, [
                      { text: t('Cancel'), style: 'cancel' }, { text: t('Confirm'), onPress: () => void movement() },
                    ])
                  } />
                  <TextInput accessibilityLabel={t('Minimum stock')} value={newMinimum} onChangeText={setNewMinimum} keyboardType="decimal-pad" editable={!busy} style={input} />
                  <Button title={t('Update minimum stock')} color={colors.accent} disabled={busy || !quantityValid(newMinimum)} onPress={() => void updateMinimum()} />
                </>
              ) : null}
              {history.map((move) => <View key={move.id} style={styles.history}>
                <Text style={{ color: colors.text }}>{t(movementLabels[move.kind] ?? move.kind)} · {move.delta} · {t('Balance')} {move.balance}</Text>
                <Text style={{ color: colors.muted }}>{move.author} · {new Date(move.created_at).toLocaleString()}</Text>
                {move.reason ? <Text style={{ color: colors.muted }}>{move.reason}</Text> : null}
                {move.supply_request_id ? <Text style={{ color: colors.muted }}>{t('Supplies')} #{move.supply_request_id}</Text> : null}
              </View>)}
            </View>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 16 },
  panel: { padding: 16, gap: 10, borderRadius: 16, borderWidth: 1 },
  heading: { fontSize: 30, fontWeight: '700' },
  title: { fontSize: 21, fontWeight: '700' },
  input: { padding: 12, minHeight: 48, borderRadius: 10, borderWidth: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  history: { paddingVertical: 8, gap: 5 },
});
