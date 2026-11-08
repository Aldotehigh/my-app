import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Button, Pressable, Text, TextInput, View } from 'react-native';
import { getPromotion, savePromotion, type PromotionStatus } from '../services/promotions';
import { usePreferences } from '../context/PreferencesContext';

function nextMonday() {
  const date = new Date();
  date.setDate(date.getDate() + (8 - date.getDay()) % 7);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function PromotionCalendar() {
  const { colors, t } = usePreferences();
  const [data, setData] = useState<PromotionStatus | null>(null);
  const [date, setDate] = useState(nextMonday);
  const [eligible, setEligible] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => {
    let active = true;
    getPromotion().then((value) => { if (active) { setData(value); setError(''); } })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : t('Could not load promotion.')); });
    return () => { active = false; };
  }, [t]));

  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      await savePromotion(date, eligible, reason);
      setData(await getPromotion());
      setError('');
      Alert.alert(t('Promotion calendar saved'));
    } catch (err) {
      Alert.alert(t('Error'), err instanceof Error ? err.message : t('Could not save promotion.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 12, padding: 16, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16 }}>
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 21 }}>{t('Monday 2-for-1 calendar')}</Text>
      <Text style={{ color: colors.muted }}>{t('Confirm normal school Mondays. Holidays, school closures and unconfirmed dates do not activate the offer.')}</Text>
      {error ? <Text style={{ color: colors.accent }}>{error}</Text> : null}
      <Text style={{ color: colors.text }}>{t('Monday date')} · YYYY-MM-DD</Text>
      <TextInput accessibilityLabel={t('Monday date')} value={date} onChangeText={setDate} maxLength={10} editable={!busy}
        style={{ color: colors.text, padding: 12, minHeight: 48, borderColor: colors.border, borderWidth: 1, borderRadius: 8 }} />
      {([true, false] as const).map((value) => <Pressable key={String(value)} accessibilityRole="radio" accessibilityState={{ checked: eligible === value }}
        disabled={busy} onPress={() => setEligible(value)} style={{ paddingVertical: 12 }}>
        <Text style={{ color: colors.text }}>{eligible === value ? '✓ ' : ''}{t(value ? 'Normal school day: enable offer' : 'Holiday or school closure: disable offer')}</Text>
      </Pressable>)}
      <TextInput accessibilityLabel={t('Calendar reason')} placeholder={t('Calendar reason')} placeholderTextColor={colors.muted}
        value={reason} onChangeText={setReason} maxLength={200} editable={!busy}
        style={{ color: colors.text, padding: 12, minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 8 }} />
      <Button title={t('Save promotion date')} color={colors.accent} disabled={busy || !/^\d{4}-\d{2}-\d{2}$/.test(date) || (!eligible && !reason.trim())} onPress={() => void save()} />
      {data?.calendar?.map((day) => <Pressable key={day.date} accessibilityRole="button" disabled={busy}
        onPress={() => { setDate(day.date); setEligible(day.eligible); setReason(day.reason); }} style={{ paddingVertical: 8 }}>
        <Text style={{ color: day.eligible ? colors.olive : colors.accent }}>{day.date} · {t(day.eligible ? 'Offer enabled' : 'Offer suspended')}</Text>
        {day.reason ? <Text style={{ color: colors.muted }}>{day.reason}</Text> : null}
      </Pressable>)}
    </View>
  );
}

export function PromotionNotice() {
  const { colors, t } = usePreferences();
  const [promotion, setPromotion] = useState<PromotionStatus | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    getPromotion().then((value) => { if (active) setPromotion(value); }).catch(() => { if (active) setPromotion(null); });
    return () => { active = false; };
  }, []));
  return (
    <View style={{ padding: 14, marginTop: 16, gap: 6, borderRadius: 14, backgroundColor: colors.soft }}>
      <Text style={{ color: colors.accent, fontWeight: '700' }}>{t(promotion?.state === 'active' ? 'Monday 2-for-1 is active today'
        : promotion?.state === 'suspended' ? 'The Monday offer is suspended today'
        : promotion?.state === 'calendar_unconfirmed' ? 'The Monday offer has not been confirmed today'
        : 'Monday 2-for-1 on eligible dates')}</Text>
      <Text style={{ color: colors.text, fontSize: 12 }}>{t('Full makimono orders only. Mix rolls and pay the higher price of each pair.')}</Text>
      <Text style={{ color: colors.muted, fontSize: 12 }}>{t('Excludes Coco, Don Jorge, Roca/Rocca, Tesoro and Crunchy. No holidays or school closures.')}</Text>
    </View>
  );
}
