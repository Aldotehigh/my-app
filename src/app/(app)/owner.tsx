import { PromotionCalendar } from '../../components/PromotionCalendar';
import { BusinessCharts } from '../../components/BusinessCharts';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../context/PreferencesContext';
import { collectPayment, getBills, getBusiness, type Bill, type BusinessSummary } from '../../services/business';

function today() {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

const money = (amount: string | number) => '$' + Number(amount).toFixed(2) + ' MXN';

export default function OwnerScreen() {
  const { user } = useAuth();
  const { colors, t } = usePreferences();
  const router = useRouter();
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [range, setRange] = useState({ start: today(), end: today() });
  const [summary, setSummary] = useState<BusinessSummary | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Bill | null>(null);
  const [tip, setTip] = useState('0');
  const [customDates, setCustomDates] = useState(false);
  const [allProducts, setAllProducts] = useState(false);
  const [showPromotionCalendar, setShowPromotionCalendar] = useState(false);
  const [method, setMethod] = useState<'cash' | 'card' | 'mixed'>('cash');
  const [cashPart, setCashPart] = useState('');
  const [received, setReceived] = useState('');
  const operation = useRef(false);
  const sequence = useRef(0);
  const allowed = Boolean(user?.can_view_business);

  const refresh = useCallback(async () => {
    if (!allowed) { setLoading(false); return; }
    const version = ++sequence.current;
    setLoading(true);
    setError('');
    try {
      const [fresh, openBills] = await Promise.all([getBusiness(range.start, range.end), getBills()]);
      if (version !== sequence.current) return;
      setSummary(fresh);
      setBills(openBills);
    } catch (err) {
      if (version === sequence.current) setError(err instanceof Error ? err.message : t('Could not load dashboard.'));
    } finally {
      if (version === sequence.current) setLoading(false);
    }
  }, [allowed, range, t]);

  useFocusEffect(useCallback(() => {
    void refresh();
    return () => { sequence.current++; };
  }, [refresh]));

  const mealTotal = Number(selected?.total ?? 0);
  const tipValue = Number(tip.replace(',', '.'));
  const total = Number((mealTotal + tipValue).toFixed(2));
  const cash = method === 'card' ? 0 : method === 'cash' ? total : Number(cashPart.replace(',', '.'));
  const card = total - cash;
  const tendered = method === 'card' ? 0 : Number(received.replace(',', '.'));
  const validMoney = (value: string) => /^\d{1,10}([.,]\d{1,2})?$/.test(value);
  const canCollect = Boolean(selected?.can_pay && !busy && cash >= 0 && card >= 0 && tendered >= cash
    && validMoney(tip) && tipValue >= 0 && (method === 'card' || validMoney(received)) && (method !== 'mixed' || validMoney(cashPart)));
  const panel = [styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }];
  const input = [styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }];

  async function pay() {
    if (!selected || operation.current || !canCollect) return;
    operation.current = true;
    setBusy(true);
    try {
      const result = await collectPayment(selected.id, selected.total, cash.toFixed(2), card.toFixed(2), tendered.toFixed(2), tipValue.toFixed(2));
      setSelected(null);
      await refresh();
      Alert.alert(t('Payment recorded'), t('Change') + ' · ' + money(result.change));
    } catch (err) {
      Alert.alert(t('Error'), err instanceof Error ? err.message : t('Could not record payment.'));
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  if (!allowed) return <Text style={{ padding: 24, color: colors.text }}>{t('Owner access required.')}</Text>;
  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>{t('Owner dashboard')}</Text>
      <Text style={{ color: colors.muted }}>{t('Sales are based on recorded payments.')}</Text>
      <Button title={t('Configure Monday offer')} color={colors.accent} onPress={() => setShowPromotionCalendar((value) => !value)} />
      <Button title={t("Reservations")} color={colors.accent} onPress={() => router.push("/reservations")} />
      {showPromotionCalendar ? <PromotionCalendar /> : null}
      <View style={panel}>
        <View style={styles.methods}>
          {[{ days: 1, label: 'Today' }, { days: 7, label: 'Last 7 days' }, { days: 30, label: 'Last 30 days' }].map((preset) => (
            <Button key={preset.days} title={t(preset.label)} color={colors.accent} disabled={loading || busy} onPress={() => {
              const date = new Date(); date.setDate(date.getDate() - preset.days + 1);
              const from = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
              const to = today();
              setStart(from); setEnd(to); setRange({ start: from, end: to });
            }} />
          ))}
        </View>
        <Text style={{ color: colors.text }}>{range.start} — {range.end}</Text>
        <Button title={t('Custom dates')} color={colors.accent} onPress={() => setCustomDates((value) => !value)} />
        {customDates ? <>
        <Text style={{ color: colors.text }}>{t('Date range')} · YYYY-MM-DD</Text>
        {summary ? <Text style={{ color: colors.muted }}>{summary.timezone}</Text> : null}
        <TextInput accessibilityLabel={t('Start date')} value={start} onChangeText={setStart} maxLength={10} style={input} />
        <TextInput accessibilityLabel={t('End date')} value={end} onChangeText={setEnd} maxLength={10} style={input} />
        <Button title={t('Apply dates')} color={colors.accent} disabled={loading || busy} onPress={() => {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || start > end) {
            Alert.alert(t('Error'), t('Check the date range.'));
            return;
          }
          setRange({ start, end });
        }} />
        </> : null}
        <Button title={t('Refresh')} color={colors.accent} disabled={loading || busy} onPress={() => void refresh()} />
      </View>
      {loading || busy ? <ActivityIndicator color={colors.accent} /> : null}
      {error ? <Text accessibilityRole="alert" style={{ color: colors.accent }}>{error}</Text> : null}
      {summary ? (
        <>
          <View style={[panel, { backgroundColor: colors.soft }]}>
            <Text style={{ color: colors.muted }}>{t('At a glance')}</Text>
            <Text style={[styles.value, { color: colors.accent }]}>{money(summary.total)}</Text>
            <Text style={{ color: colors.text }}>{t('Food and drink sales in this period')}</Text>
            <Text style={{ color: colors.muted }}>{t('Tips')} · {money(summary.tip_total)} · {t('Paid orders')} · {summary.paid_orders}</Text>
          </View>
          <BusinessCharts summary={summary} />
          <View style={styles.metrics}>
            {[
              ['Cash', money(summary.cash)],
              ['Card payments', money(summary.card)], ['Paid orders', String(summary.paid_orders)],
              ['Average ticket', money(summary.average_ticket)], ['Tips', money(summary.tip_total)], ['Promotion discounts', money(summary.discount_total ?? '0')], ['Pending supplies', String(summary.pending_supplies)],
            ].map(([label, value]) => <View key={label} style={[panel, styles.metric]}>
              <Text style={{ color: colors.muted }}>{t(label)}</Text>
              <Text style={[styles.value, { color: colors.accent }]}>{value}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{t({
                Cash: 'Cash received, including tips.',
                'Card payments': 'Card payments, including tips.',
                'Paid orders': 'Number of settled bills.',
                'Average ticket': 'Food and drink sales per settled bill.',
                Tips: 'Voluntary tips confirmed at payment.',
                'Promotion discounts': 'Discounts already deducted from food and drink sales.',
                'Pending supplies': 'Supply items not yet received.',
              }[label] ?? '')}</Text>
            </View>)}
          </View>
          <View style={panel}>
            <Button title={t('Inventory') + ' · ' + summary.low_stock.length + ' ' + t('Low stock')} color={colors.accent} onPress={() => router.navigate('/inventory')} />
            <Button title={t('Supplies')} color={colors.accent} onPress={() => router.navigate('/supplies')} />
          </View>
          <View style={panel}>
            <Button title={t(allProducts ? 'Hide product details' : 'View all sold products')} color={colors.accent} onPress={() => setAllProducts((value) => !value)} />
            {allProducts ? <>
            <Text style={[styles.title, { color: colors.text }]}>{t('Best-selling products')}</Text>
            {!summary.products.length ? <Text style={{ color: colors.muted }}>{t('No recorded sales in this period.')}</Text> : null}
            {summary.products.map((product, index) => <View key={index} style={styles.line}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{product.title}</Text>
              <Text style={{ color: colors.muted }}>{product.units} {t('Units')} · {money(product.revenue)}</Text>
            </View>)}
            </> : null}
          </View>
          <View style={panel}>
            <Text style={[styles.title, { color: colors.text }]}>{t('Sales by table')}</Text>
            <Text style={{ color: colors.muted }}>{t('Tables with settled bills in this period.')}</Text>
            {summary.tables.map((table) => <Text key={table.order__table} style={{ color: colors.text }}>
              {t('Table')} {table.order__table} · {table.bills} {t('Paid orders')} · {money(table.total)}
            </Text>)}
          </View>
        </>
      ) : null}
      <Text style={[styles.title, { color: colors.text }]}>{t('Open bills')}</Text>
      {bills.map((bill) => (
        <View key={bill.id} style={panel}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>{t(bill.fulfillment === 'delivery' ? 'Home delivery' : bill.fulfillment === 'pickup' ? 'For pickup' : 'Table')} {bill.table ?? ''} · #{bill.id} · {money(bill.total)}</Text>
          {Number(bill.discount) > 0 ? <Text style={{ color: colors.olive }}>{t('Monday 2-for-1 discount')} · −{money(bill.discount!)} · {t('Before discount')} {money(bill.subtotal!)}</Text> : null}
          {bill.lines.map((line, index) => <Text key={index} style={{ color: colors.muted }}>{line.quantity} × {line.title}</Text>)}
          <Button title={t(bill.can_pay ? 'Register payment' : 'Waiting for service')} color={colors.accent} disabled={!bill.can_pay || busy} onPress={() => {
            const suggested = bill.tip_suggestion ?? '0';
            const grandTotal = (Number(bill.total) + Number(suggested)).toFixed(2);
            setSelected(bill); setTip(suggested); setMethod('cash'); setCashPart(grandTotal); setReceived(grandTotal);
          }} />
          {selected?.id === bill.id ? (
            <View style={{ gap: 10 }}>
              <Text style={{ color: colors.muted }}>{t('Record the payment collected in cash or at your card terminal.')}</Text>
              <Text style={{ color: colors.text }}>{t('Voluntary tip agreed with the guest')}</Text>
              <TextInput accessibilityLabel={t('Tip')} value={tip} onChangeText={setTip} keyboardType="decimal-pad" editable={!busy} style={input} />
              <Text style={{ color: colors.text }}>{t('Subtotal')}: {money(mealTotal)} · {t('Total including tip')}: {Number.isFinite(total) ? money(total) : '—'}</Text>
              <View style={styles.methods}>
                {(['cash', 'card', 'mixed'] as const).map((value) => <Pressable key={value} accessibilityRole="radio"
                  accessibilityState={{ checked: method === value }} disabled={busy}
                  onPress={() => setMethod(value)} style={[styles.method, { backgroundColor: method === value ? colors.accent : colors.soft }]}
                ><Text style={{ color: method === value ? colors.onAccent : colors.text }}>{t({ cash: 'Cash', card: 'Card', mixed: 'Mixed payment' }[value])}</Text></Pressable>)}
              </View>
              {method === 'mixed' ? <TextInput accessibilityLabel={t('Cash portion')} placeholder={t('Cash portion')} placeholderTextColor={colors.muted} value={cashPart} onChangeText={setCashPart} keyboardType="decimal-pad" editable={!busy} style={input} /> : null}
              {method !== 'card' ? <TextInput accessibilityLabel={t('Cash received')} placeholder={t('Cash received')} placeholderTextColor={colors.muted} value={received} onChangeText={setReceived} keyboardType="decimal-pad" editable={!busy} style={input} /> : null}
              <Text style={{ color: colors.text }}>{t('Card')}: {Number.isFinite(card) ? money(card) : '—'} · {t('Change')}: {Number.isFinite(tendered - cash) ? money(tendered - cash) : '—'}</Text>
              <Button title={t('Confirm payment')} color={colors.accent} disabled={!canCollect} onPress={() =>
                Alert.alert(t('Confirm payment'), money(total), [
                  { text: t('Cancel'), style: 'cancel' }, { text: t('Confirm'), onPress: () => void pay() },
                ])
              } />
              <Button title={t('Cancel')} disabled={busy} color={colors.accent} onPress={() => setSelected(null)} />
            </View>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 16 },
  heading: { fontSize: 30, fontWeight: '700' },
  title: { fontSize: 21, fontWeight: '700' },
  panel: { padding: 16, gap: 10, borderRadius: 16, borderWidth: 1 },
  input: { padding: 12, borderRadius: 10, minHeight: 48, borderWidth: 1 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: { flexGrow: 1, flexBasis: 140 },
  value: { fontSize: 22, fontWeight: '700' },
  line: { gap: 4, paddingVertical: 7 },
  methods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  method: { padding: 12, minHeight: 44, borderRadius: 12 },
});
