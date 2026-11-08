import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, Button, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../context/PreferencesContext';
import { DiningTablePicker } from '../../components/DiningTablePicker';
import { changeReservation, getReservations, requestReservation, reservationLabels, type DiningTable, type Reservation, type ReservationStatus } from '../../services/reservations';

export default function ReservationsScreen() {
  const { user } = useAuth();
  const { colors, t, preferences } = usePreferences();
  const manager = user?.role === 'owner' || user?.role === 'admin';
  const customer = user?.role === 'customer';
  const allowed = manager || customer;
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [table, setTable] = useState<DiningTable>();
  const [party, setParty] = useState('2');
  const [name, setName] = useState(user?.first_name || user?.username || '');
  const [phone, setPhone] = useState(user?.address?.phone || '');
  const [date, setDate] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()));
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [durations, setDurations] = useState<Record<number, string>>({});
  const [responses, setResponses] = useState<Record<number, string>>({});
  const operation = useRef(false);
  const attempt = useRef({ signature: '', key: '' });
  const refresh = useCallback(async () => {
    if (!allowed) { setLoading(false); return; }
    try { setItems(await getReservations()); setError(''); }
    catch (err) { setError(err instanceof Error ? err.message : t('Unknown error')); }
    finally { setLoading(false); }
  }, [allowed, t]);
  useFocusEffect(useCallback(() => { let active = true; void refresh(); const timer = setInterval(() => { if (active) void refresh(); }, 15000); return () => { active = false; clearInterval(timer); }; }, [refresh]));
  const inputStyle = { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 48 };
  function input(label: string, value: string, onChangeText: (value: string) => void, number = false) {
    return <View style={{ gap: 6 }}><Text style={{ color: colors.text }}>{t(label)}</Text><TextInput accessibilityLabel={t(label)} value={value} onChangeText={onChangeText} editable={!busy} keyboardType={number ? 'number-pad' : 'default'} placeholderTextColor={colors.muted} style={inputStyle} /></View>;
  }
  async function submit() {
    if (operation.current) return;
    if (!table || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !/^[1-9]\d?$/.test(party) || Number(party) > table.capacity) {
      Alert.alert(t('Error'), t('Check the table, party size, date and time.')); return;
    }
    const data = { table_id: table.id, party_size: Number(party), contact_name: name.trim(), phone, starts_at: `${date}T${time}:00`, notes: notes.trim() };
    const signature = JSON.stringify(data);
    if (attempt.current.signature !== signature) attempt.current = { signature, key: `${Date.now()}-${Math.random().toString(36).slice(2)}` };
    operation.current = true; setBusy(true);
    try { await requestReservation({ ...data, request_key: attempt.current.key }); setTime(''); setNotes(''); attempt.current = { signature: '', key: '' }; await refresh(); Alert.alert(t('Reservation requested'), t('Wait for confirmation from the restaurant.')); }
    catch (err) { Alert.alert(t('Error'), err instanceof Error ? err.message : ''); }
    finally { operation.current = false; setBusy(false); }
  }
  async function update(item: Reservation, status: ReservationStatus) {
    if (operation.current) return;
    const duration = durations[item.id];
    if (status === 'confirmed' && (!/^\d+$/.test(duration || '') || Number(duration) < 1 || Number(duration) > 1440)) { Alert.alert(t('Error'), t('Enter the agreed table duration in minutes.')); return; }
    operation.current = true; setBusy(true);
    try { await changeReservation(item.id, status, status === 'confirmed' ? Number(duration) : undefined, manager ? responses[item.id] : undefined); await refresh(); }
    catch (err) { Alert.alert(t('Error'), err instanceof Error ? err.message : ''); }
    finally { operation.current = false; setBusy(false); }
  }
  function confirm(item: Reservation, status: ReservationStatus) {
    Alert.alert(t(reservationLabels[status]), `${t('Table')} ${item.table.label} · ${item.contact_name}`, [{ text: t('Cancel'), style: 'cancel' }, { text: t('Confirm'), onPress: () => void update(item, status) }]);
  }
  function localTime(value: string) { return new Date(value).toLocaleString(preferences.language === 'es' ? 'es-MX' : 'en-US', { timeZone: 'America/Mexico_City' }); }
  if (!allowed) return <Text style={{ padding: 24, color: colors.text }}>{t('You do not have permission to perform this action.')}</Text>;
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 40 }}>
    <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 28, fontWeight: '700' }}>{t('Reservations')}</Text>
    <Text style={{ color: colors.muted }}>{t('Same-day requests are allowed. Times use Mexico City time. Confirmation is required.')}</Text>
    {customer ? <View style={{ gap: 14, padding: 18, backgroundColor: colors.surface, borderRadius: 18 }}>
      {input('Party size', party, setParty, true)}
      <DiningTablePicker value={table?.label || ''} onChange={(_, selected) => setTable(selected)} partySize={Number(party) || 1} disabled={busy} />
      {input('Contact name', name, setName)}{input('Contact phone', phone, setPhone, true)}
      {input('Date (YYYY-MM-DD)', date, setDate)}{input('Time (HH:MM, 24-hour)', time, setTime)}
      {input('Reservation notes', notes, setNotes)}
      <Text style={{ color: colors.muted }}>{t('A request does not hold the table until the restaurant confirms it.')}</Text>
      <Button title={t('Request reservation')} color={colors.accent} disabled={busy || !table} onPress={() => void submit()} />
    </View> : null}
    {loading ? <ActivityIndicator color={colors.accent} /> : null}
    {error ? <><Text style={{ color: colors.accent }}>{error}</Text><Button title={t('Retry')} onPress={() => void refresh()} /></> : null}
    {!loading && !items.length ? <Text style={{ color: colors.muted }}>{t('No reservations yet.')}</Text> : null}
    {items.map((item) => <View key={item.id} style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 18, gap: 10 }}>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>#{item.id} · {t('Table')} {item.table.label} · {t(item.table.zone === 'terrace' ? 'Terrace' : 'Dining room')}</Text>
      <Text style={{ color: colors.text }}>{item.party_size} {t('people')} · {localTime(item.starts_at)}</Text>
      {item.ends_at ? <Text style={{ color: colors.muted }}>{t('Until')} {localTime(item.ends_at)}</Text> : null}
      <Text style={{ color: colors.accent, fontWeight: '700' }}>{t(reservationLabels[item.status])}</Text>
      {manager ? <Text style={{ color: colors.text }}>{item.contact_name} · {item.phone}</Text> : null}
      {item.notes ? <Text style={{ color: colors.text }}>{item.notes}</Text> : null}
      {item.response_note ? <Text style={{ color: colors.text }}>{t('Restaurant response')}: {item.response_note}</Text> : null}
      {manager && item.status === 'pending' ? <>
        {input('Agreed duration (minutes)', durations[item.id] || '', (value) => setDurations((current) => ({ ...current, [item.id]: value })), true)}
        {input('Restaurant response', responses[item.id] || '', (value) => setResponses((current) => ({ ...current, [item.id]: value })))}
        <Button title={t('Confirm reservation')} disabled={busy} color={colors.accent} onPress={() => confirm(item, 'confirmed')} />
        <Button title={t('Reject reservation')} disabled={busy} color={colors.accent} onPress={() => confirm(item, 'rejected')} />
      </> : null}
      {manager && item.status === 'confirmed' ? <Button title={t('Mark arrival')} color={colors.accent} disabled={busy} onPress={() => confirm(item, 'arrived')} /> : null}
      {manager && item.status === 'arrived' ? <Button title={t('Complete reservation')} color={colors.accent} disabled={busy} onPress={() => confirm(item, 'completed')} /> : null}
      {['pending', 'confirmed'].includes(item.status) ? <Button title={t('Cancel reservation')} disabled={busy} color={colors.accent} onPress={() => confirm(item, 'cancelled')} /> : null}
    </View>)}
  </ScrollView>;
}
