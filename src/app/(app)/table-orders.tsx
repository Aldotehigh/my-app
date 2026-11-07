import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { usePreferences } from '../../context/PreferencesContext';
import {
  getTableOrders, orderStatusLabels, sendTableOrder, updateOrderLine,
  type LineStatus, type TableOrder,
} from '../../services/tableOrders';

const nextStep: Partial<Record<LineStatus, { status: LineStatus; label: string }>> = {
  review: { status: 'received', label: 'Confirm allergy review' },
  received: { status: 'preparing', label: 'Start preparing' },
  preparing: { status: 'ready', label: 'Mark ready' },
};

export default function TableOrdersScreen() {
  const { colors, t } = usePreferences();
  const { user } = useAuth();
  const { lines, remove } = useCart();
  const [table, setTable] = useState('');
  const [orders, setOrders] = useState<TableOrder[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const operation = useRef(false);
  const request = useRef<{ signature: string; key: string } | null>(null);
  const customer = user?.role === 'customer';
  const validTable = /^[1-9]\d{0,2}$/.test(table.trim());
  const estimatedTotal = lines.reduce((total, line) => total + Number(line.price) * line.quantity, 0);
  const panel = [styles.panel, { backgroundColor: colors.surface }];
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOrders(await getTableOrders());
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Could not load orders.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  async function submit() {
    if (operation.current || !validTable || !lines.length) return;
    operation.current = true;
    setBusy(true);
    const signature = JSON.stringify([table.trim(), lines.map((line) => line.id)]);
    if (request.current?.signature !== signature) {
      request.current = { signature, key: Date.now().toString(36) + Math.random().toString(36).slice(2) };
    }
    try {
      const order = await sendTableOrder(Number(table), request.current.key, lines);
      remove(lines.map((line) => line.id));
      request.current = null;
      setOrders((current) => [order, ...current.filter((item) => item.id !== order.id)]);
      Alert.alert(t('Order sent'), `#${order.id}`);
    } catch (err) {
      Alert.alert(t('Could not send the order'), err instanceof Error ? err.message : '');
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  async function changeStatus(orderId: number, lineId: number, status: LineStatus) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    try {
      const updated = await updateOrderLine(orderId, lineId, status);
      setOrders((current) => current.map((order) => order.id === updated.id ? updated : order));
    } catch (err) {
      Alert.alert(t('Could not update the order'), err instanceof Error ? err.message : '');
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  function confirmReview(orderId: number, lineId: number) {
    Alert.alert(t('Confirm allergy review'), t('Confirm only after checking ingredients and the risk of cross-contact.'), [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Confirm'), onPress: () => void changeStatus(orderId, lineId, 'received') },
    ]);
  }

  function lineNotes(removals: string[], allergy: string, selections: string[]) {
    return (
      <>
        {selections.length ? <Text style={{ color: colors.text }}>{selections.map(t).join(', ')}</Text> : null}
        {removals.length ? <Text style={{ color: colors.text }}>{t('Without')} {removals.join(', ')}</Text> : null}
        {allergy ? (
          <View style={[styles.allergy, { backgroundColor: colors.soft, borderColor: colors.accent }]}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{t('ALLERGY ALERT')} · {allergy}</Text>
          </View>
        ) : null}
      </>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {customer ? (
        <View style={panel}>
          <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>{t('Your cart')}</Text>
          {!lines.length ? <Text style={{ color: colors.muted }}>{t('Your cart is empty.')}</Text> : null}
          {lines.map((line) => (
            <View key={line.id} style={[styles.line, { borderColor: colors.muted }]}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{line.quantity} × {line.title}</Text>
              <Text style={{ color: colors.text }}>${(Number(line.price) * line.quantity).toFixed(2)} MXN</Text>
              {lineNotes(line.removals, line.allergy, line.selections.map((selection) => selection.label))}
              <Button color={colors.accent} title={t('Remove from cart')} disabled={busy} onPress={() => remove([line.id])} />
            </View>
          ))}
          {lines.length ? (
            <>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{t('Estimated total')} · ${estimatedTotal.toFixed(2)} MXN</Text>
              <TextInput
                accessibilityLabel={t('Table number')}
                placeholder={t('Table number')}
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                editable={!busy}
                maxLength={3}
                value={table}
                onChangeText={setTable}
                style={[styles.input, { color: colors.text, borderColor: colors.muted }]}
              />
              <Button color={colors.accent} title={t('Send order')} disabled={!validTable || busy} onPress={() => void submit()} />
            </>
          ) : null}
        </View>
      ) : null}
      <View style={styles.headingRow}>
        <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>{t(customer ? 'My orders' : 'Incoming orders')}</Text>
        <Button color={colors.accent} title={t('Refresh orders')} disabled={loading || busy} onPress={() => void refresh()} />
      </View>
      {loading || busy ? <ActivityIndicator color={colors.accent} /> : null}
      {error ? <Text accessibilityRole="alert" style={{ color: colors.accent }}>{error}</Text> : null}
      {!loading && !error && !orders.length ? <Text style={{ color: colors.muted }}>{t('There are no orders yet.')}</Text> : null}
      {orders.map((order) => (
        <View key={order.id} style={panel}>
          <Text style={[styles.heading, { color: colors.text }]}>#{order.id} · {t('Table')} {order.table}</Text>
          {order.lines.map((line) => {
            const next = nextStep[line.status];
            return (
              <View key={line.id} style={[styles.line, { borderColor: colors.muted }]}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{line.quantity} × {line.title}</Text>
                <Text style={{ color: colors.muted }}>{t(line.area === 'bar' ? 'Bar' : 'Kitchen')} · {t(orderStatusLabels[line.status])}</Text>
                {customer ? (
                  <Text style={{ color: colors.text }}>${(Number(line.unit_price) * line.quantity).toFixed(2)} MXN</Text>
                ) : null}
                {lineNotes(line.removals, line.allergy, line.selections ?? [])}
                {!customer && next ? (
                  <>
                    <Button color={colors.accent} title={t(next.label)} disabled={busy || loading} onPress={() =>
                      line.status === 'review' ? confirmReview(order.id, line.id) : void changeStatus(order.id, line.id, next.status)
                    } />
                    <Button color={colors.accent} title={t('Decline item')} disabled={busy || loading} onPress={() =>
                      Alert.alert(t('Decline item'), line.title, [
                        { text: t('Cancel'), style: 'cancel' },
                        { text: t('Confirm'), style: 'destructive', onPress: () => void changeStatus(order.id, line.id, 'declined') },
                      ])
                    } />
                  </>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  panel: { borderRadius: 16, padding: 16, gap: 12 },
  heading: { fontSize: 21, fontWeight: '700', flexShrink: 1 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  line: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, gap: 8 },
  allergy: { borderWidth: 1, borderRadius: 8, padding: 10 },
  input: { borderWidth: 1, borderRadius: 8, minHeight: 48, padding: 12 },
});
