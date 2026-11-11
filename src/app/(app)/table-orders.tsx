import { CustomerOrderCard, deliveryReady } from '../../components/CustomerOrderCard';
import { DiningTablePicker } from '../../components/DiningTablePicker';
import { addressText, completeAddress } from '../../types/Address';
import { quoteOrder, reviewDelivery, type Pricing } from '../../services/promotions';
import { useOrders } from '../../context/OrdersContext';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { usePreferences } from '../../context/PreferencesContext';
import {
  orderStatusLabels, sendTableOrder, updateOrderLine, updateDeliveryProgress,
  type LineStatus,
} from '../../services/tableOrders';

const nextStep: Partial<Record<LineStatus, { status: LineStatus; label: string }>> = {
  review: { status: 'received', label: 'Confirm restaurant review' },
  received: { status: 'preparing', label: 'Start preparing' },
  preparing: { status: 'ready', label: 'Mark ready' },
  ready: { status: 'served', label: 'Mark served' },
};

export default function TableOrdersScreen() {
  const { colors, t } = usePreferences();
  const { user } = useAuth();
  const router = useRouter();
  const { lines, remove } = useCart();
  const [table, setTable] = useState('');
  const [fulfillment, setFulfillment] = useState<'dine_in' | 'pickup' | 'delivery'>('dine_in');
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [quoted, setQuoted] = useState<{ signature: string; data: Pricing } | null>(null);
  const [quoteError, setQuoteError] = useState('');
  const [quoteRetry, setQuoteRetry] = useState(0);
  const { orders, error, loading, refresh } = useOrders();
  const [allergyNotice, setAllergyNotice] = useState('');
  const [tipPercent, setTipPercent] = useState(0);
  const [busy, setBusy] = useState(false);
  const operation = useRef(false);
  const request = useRef<{ signature: string; key: string } | null>(null);
  const customer = user?.role === 'customer';
  const validTable = /^[0-9]{1,3}[AB]?$/.test(table.trim());
  const addressSignature = JSON.stringify(user?.address ?? {});
  const quoteSignature = JSON.stringify([lines, tipPercent]);
  const quote = quoted?.signature === quoteSignature ? quoted.data : null;
  const validFulfillment = fulfillment === 'dine_in' ? validTable : fulfillment === 'pickup' || (completeAddress(user?.address) && addressConfirmed);

  useEffect(() => { setAddressConfirmed(false); }, [addressSignature, fulfillment]);
  useEffect(() => {
    if (!customer || !lines.length) { setQuoted(null); setQuoteError(''); return; }
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    setQuoteError('');
    setQuoted(null);
    quoteOrder(lines, tipPercent, controller.signal).then((data) => {
      if (active) setQuoted({ signature: quoteSignature, data });
    }).catch((err) => {
      if (active) setQuoteError(err instanceof Error ? err.message : t('Could not calculate the bill.'));
    }).finally(() => clearTimeout(timeout));
    return () => { active = false; controller.abort(); clearTimeout(timeout); };
  }, [customer, quoteSignature, quoteRetry, t]);
  const panel = [styles.panel, { backgroundColor: colors.surface }];
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  async function submit() {
    if (operation.current || !validFulfillment || !quote || !lines.length) return;
    operation.current = true;
    setBusy(true);
    const signature = JSON.stringify([table.trim(), lines.map((line) => line.id), allergyNotice.trim(), tipPercent, fulfillment, addressSignature]);
    if (request.current?.signature !== signature) {
      request.current = { signature, key: Date.now().toString(36) + Math.random().toString(36).slice(2) };
    }
    try {
      const order = await sendTableOrder(fulfillment === 'dine_in' ? table.trim().toUpperCase() : null, request.current.key, lines, allergyNotice, tipPercent, {
        fulfillment, address_confirmed: addressConfirmed, expected_total: quote.total,
      });
      remove(lines.map((line) => line.id));
      request.current = null;
      setAllergyNotice('');
      setTipPercent(0);
      await refresh();
      Alert.alert(t('Order sent'), `#${order.id}`);
    } catch (err) {
      setQuoteRetry((current) => current + 1);
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
      await updateOrderLine(orderId, lineId, status);
      await refresh();
    } catch (err) {
      Alert.alert(t('Could not update the order'), err instanceof Error ? err.message : '');
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  function confirmDelivery(id: number, accept: boolean) {
    Alert.alert(t(accept ? 'Confirm delivery address' : 'Reject delivery'), t('Verify the address and contact phone with the customer.'), [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Confirm'), onPress: async () => {
        if (operation.current) return;
        operation.current = true;
        setBusy(true);
        try {
          await reviewDelivery(id, accept);
          await refresh();
        } catch (err) {
          Alert.alert(t('Error'), err instanceof Error ? err.message : '');
        } finally {
          operation.current = false;
          setBusy(false);
        }
      } },
    ]);
  }

  function confirmReview(orderId: number, lineId: number, allergy: string) {
    Alert.alert(t('Confirm restaurant review'), t(allergy ? 'Confirm only after checking ingredients and the risk of cross-contact.' : 'Confirm that the requested adaptation can be prepared.'), [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Confirm'), onPress: () => void changeStatus(orderId, lineId, 'received') },
    ]);
  }

  function lineNotes(removals: string[], allergy: string, selections: string[]) {
    return (
      <>
        {selections.length ? <Text style={{ color: colors.text }}>{selections.map(t).join(', ')}</Text> : null}
        {removals.length ? <Text style={{ color: colors.text }}>{t('Without')} {removals.map(t).join(', ')}</Text> : null}
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
              <Text style={{ color: colors.text, fontWeight: '700' }}>{line.quantity} × {t(line.title)}</Text>
              <Text style={{ color: colors.text }}>${(Number(line.price) * line.quantity).toFixed(2)} MXN</Text>
              {lineNotes(line.removals, line.allergy, line.selections.map((selection) => selection.label))}
              <Button color={colors.accent} title={t('Remove from cart')} disabled={busy} onPress={() => remove([line.id])} />
            </View>
          ))}
          {lines.length ? (
            <>
              <Text style={{ color: colors.text }}>{t('Food allergy notice for the restaurant (optional)')}</Text>
              <TextInput
                accessibilityLabel={t('Food allergy notice for the restaurant (optional)')}
                placeholder={t('Tell the restaurant about a food allergy')}
                placeholderTextColor={colors.muted}
                value={allergyNotice}
                onChangeText={setAllergyNotice}
                editable={!busy}
                maxLength={180}
                style={[styles.input, { color: colors.text, borderColor: colors.muted }]}
              />
              <Text style={{ color: colors.text, fontWeight: '700' }}>{t('Optional tip suggestion')}</Text>
              <Text style={{ color: colors.muted }}>{t('Choose freely. You can confirm the tip when paying.')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[0, 10, 15, 20].map((percent) => (
                  <Button key={percent} color={colors.accent} title={(tipPercent === percent ? '✓ ' : '') + (percent ? percent + '%' : t('No tip'))}
                    disabled={busy} onPress={() => setTipPercent(percent)} />
                ))}
              </View>
              {quote ? (
                <View style={{ gap: 6 }}>
                  <Text style={{ color: colors.text }}>{t('Subtotal')} · ${Number(quote.subtotal).toFixed(2)} MXN</Text>
                  {Number(quote.discount) > 0 ? <Text style={{ color: colors.olive, fontWeight: '700' }}>{t('Monday 2-for-1 discount')} · −${Number(quote.discount).toFixed(2)} MXN</Text> : null}
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{t('Amount to pay')} · ${Number(quote.total).toFixed(2)} MXN</Text>
                  <Text style={{ color: colors.muted }}>{t('Suggested tip')} · ${Number(quote.tip).toFixed(2)} MXN</Text>
                  <Text style={{ color: colors.text }}>{t('Estimated total including tip')} · ${Number(quote.grand_total).toFixed(2)} MXN</Text>
                </View>
              ) : <Text style={{ color: colors.muted }}>{t('Calculating the current bill...')}</Text>}
              {quoteError ? <>
                <Text style={{ color: colors.accent }}>{quoteError}</Text>
                <Button color={colors.accent} title={t('Retry')} onPress={() => setQuoteRetry((current) => current + 1)} />
              </> : null}
              <Text style={{ color: colors.text, fontWeight: '700' }}>{t('Order type')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {([{ value: 'dine_in', label: 'At a table' }, { value: 'pickup', label: 'For pickup' }, { value: 'delivery', label: 'Home delivery' }] as const).map((option) => (
                  <Button key={option.value} color={colors.accent} title={(fulfillment === option.value ? '✓ ' : '') + t(option.label)} disabled={busy} onPress={() => setFulfillment(option.value)} />
                ))}
              </View>
              {fulfillment === 'delivery' ? (
                <View style={{ gap: 10 }}>
                  <Text style={{ color: colors.olive }}>{t('Free delivery')}</Text>
                  {completeAddress(user?.address) ? <Text style={{ color: colors.text }}>{addressText(user!.address!)}</Text> : <Text style={{ color: colors.accent }}>{t('Complete your delivery address in your profile.')}</Text>}
                  <Button color={colors.accent} title={t('Edit delivery address')} disabled={busy} onPress={() => router.navigate('/profile')} />
                  <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: addressConfirmed, disabled: !completeAddress(user?.address) || busy }}
                    disabled={!completeAddress(user?.address) || busy} onPress={() => setAddressConfirmed((current) => !current)}
                    style={{ minHeight: 48, justifyContent: 'center' }}
                  ><Text style={{ color: colors.text }}>{addressConfirmed ? '☑ ' : '☐ '}{t('I confirm this address and contact phone are correct.')}</Text></Pressable>
                  <Text style={{ color: colors.muted }}>{t('Preparation can start while the restaurant confirms delivery.')}</Text>
                </View>
              ) : null}
              {fulfillment === 'dine_in' ?
              <DiningTablePicker value={table} onChange={setTable} disabled={busy} /> : null}
              <Button color={colors.accent} title={t('Send order')} disabled={!validFulfillment || !quote || busy || Boolean(quoteError)} onPress={() => void submit()} />
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
      {(customer ? [...orders].sort((first, second) => second.id - first.id) : orders).map((order) => customer ? <CustomerOrderCard key={order.id} order={order} /> : (
        <View key={order.id} style={panel}>
          <Text style={[styles.heading, { color: colors.text }]}>#{order.id} · {t(order.fulfillment === 'delivery' ? 'Home delivery' : order.fulfillment === 'pickup' ? 'For pickup' : 'Table')} {order.table ?? ''}</Text>
          {order.fulfillment === 'delivery' ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.text }}>{t('Free delivery')} · {t(order.delivery_status === 'accepted' ? 'Address confirmed' : order.delivery_status === 'rejected' ? 'Delivery rejected' : 'Delivery address pending review')}</Text>
              {order.delivery_address?.street ? <Text style={{ color: colors.muted }}>{addressText(order.delivery_address)}</Text> : null}
              {user?.can_view_business && order.delivery_status === 'pending' ? <>
                <Button title={t('Confirm delivery address')} color={colors.accent} disabled={busy} onPress={() => confirmDelivery(order.id, true)} />
                <Button title={t('Reject delivery')} color={colors.accent} disabled={busy || order.lines.some((line) => ['preparing', 'ready', 'served'].includes(line.status))} onPress={() => confirmDelivery(order.id, false)} />
              </> : null}
            </View>
          ) : null}
          {user?.can_view_business && order.fulfillment === 'delivery' && order.delivery_status === 'accepted' && deliveryReady(order) ? (
            <Button color={colors.accent} disabled={busy}
              title={t(order.dispatched_at ? 'Confirm delivery completed' : 'Send out for delivery')}
              onPress={() => {
                if (operation.current) return;
                operation.current = true;
                setBusy(true);
                void updateDeliveryProgress(order.id, order.dispatched_at ? 'delivered' : 'dispatched')
                  .then(() => refresh())
                  .catch((err) => Alert.alert(t('Error'), err instanceof Error ? err.message : ''))
                  .finally(() => { operation.current = false; setBusy(false); });
              }} />
          ) : null}
          {order.pricing ? <View style={{ gap: 5 }}>
            <Text style={{ color: colors.text }}>{t('Subtotal')} · ${Number(order.pricing.subtotal).toFixed(2)} MXN</Text>
            {Number(order.pricing.discount) > 0 ? <Text style={{ color: colors.olive }}>{t('Monday 2-for-1 discount')} · −${Number(order.pricing.discount).toFixed(2)} MXN</Text> : null}
            <Text style={{ color: colors.text, fontWeight: '700' }}>{t(order.pricing.paid ? 'Paid consumption' : 'Amount to pay')} · ${Number(order.pricing.total).toFixed(2)} MXN</Text>
          </View> : null}
          {order.tip_percent ? <Text style={{ color: colors.muted }}>{t('Suggested tip')} · {order.tip_percent}%</Text> : null}
          {order.lines.map((line) => {
            const next = order.fulfillment === 'delivery' && line.status === 'ready' ? undefined : nextStep[line.status];
            const waitingForStarters = (order.fulfillment === undefined || order.fulfillment === 'dine_in') && (line.course === 'main' || line.course === 'dessert')
              && order.lines.some((item) => item.course === 'starter' && !['served', 'declined'].includes(item.status));
            const courseLabels = { starter: 'Starter · serve first', main: 'Main course', dessert: 'Dessert', drink: 'Drink' };

            return (
              <View key={line.id} style={[styles.line, { borderColor: colors.muted }]}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{line.quantity} × {t(line.title)}</Text>
                {line.course ? <Text style={{ color: colors.accent, fontWeight: '700' }}>{t(courseLabels[line.course])}</Text> : null}
                {waitingForStarters ? <Text style={{ color: colors.muted }}>{t('Waiting for starters to be served')}</Text> : null}
                <Text style={{ color: colors.muted }}>{t(line.area === 'bar' ? 'Drinks bar' : line.area === 'sushi' ? 'Sushi' : 'Kitchen')} · {t(orderStatusLabels[line.status])}</Text>
                {customer ? (
                  <Text style={{ color: colors.text }}>${(Number(line.unit_price) * line.quantity).toFixed(2)} MXN</Text>
                ) : null}
                {lineNotes(line.removals, line.allergy, line.selections ?? [])}
                {!customer && next ? (
                  <>
                    <Button color={colors.accent} title={t(next.status === 'served' && order.fulfillment === 'pickup' ? 'Mark picked up' : next.label)} disabled={busy || loading || (line.status === 'received' && waitingForStarters) || (next.status === 'served' && order.fulfillment === 'delivery' && order.delivery_status !== 'accepted')} onPress={() =>
                      line.status === 'review' ? confirmReview(order.id, line.id, line.allergy) : void changeStatus(order.id, line.id, next.status)
                    } />
                    {line.status !== 'ready' ? <Button color={colors.accent} title={t(line.area === 'bar' ? 'Decline drink' : 'Decline dish')} disabled={busy || loading} onPress={() =>
                      Alert.alert(t(line.area === 'bar' ? 'Decline drink' : 'Decline dish'), line.title, [
                        { text: t('Cancel'), style: 'cancel' },
                        { text: t('Confirm'), style: 'destructive', onPress: () => void changeStatus(order.id, line.id, 'declined') },
                      ])
                    } /> : null}
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
