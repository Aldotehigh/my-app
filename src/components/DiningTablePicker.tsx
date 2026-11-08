import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, Text, View } from 'react-native';
import CategorySelector from './CategorySelector';
import { usePreferences } from '../context/PreferencesContext';
import { getDiningTables, type DiningTable } from '../services/reservations';

export function DiningTablePicker({ value, onChange, partySize = 1, disabled = false }: {
  value: string; onChange: (label: string, table?: DiningTable) => void; partySize?: number; disabled?: boolean;
}) {
  const { colors, t } = usePreferences();
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [zone, setZone] = useState<'terrace' | 'salon'>('terrace');
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    getDiningTables().then((data) => { if (active) setTables(data); })
      .catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);
  const selected = tables.find((table) => table.label === value);
  const visible = tables.filter((table) => table.zone === zone && table.capacity >= partySize);
  useEffect(() => {
    if (selected && selected.capacity < partySize) onChange('');
  }, [selected, partySize, onChange]);
  return <View style={{ gap: 8, opacity: disabled ? 0.5 : 1 }} pointerEvents={disabled ? 'none' : 'auto'}>
    <Text style={{ color: colors.text, fontWeight: '700' }}>{t('Choose a table')}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {(['terrace', 'salon'] as const).map((item) => <Button key={item} color={colors.accent} title={(zone === item ? '✓ ' : '') + t(item === 'terrace' ? 'Terrace' : 'Dining room')} onPress={() => { setZone(item); onChange(''); }} />)}
    </View>
    {loading ? <ActivityIndicator color={colors.accent} /> : error ? <><Text style={{ color: colors.accent }}>{error}</Text><Button title={t('Retry')} onPress={() => setRetry((current) => current + 1)} /></> :
      <CategorySelector fieldLabel={t("Table")} collectionLabel={t("Tables")} searchLabel={t("Search tables")} emptyLabel={t('Select a table')} categories={visible.map((table) => ({ id: table.id, name: `${t('Table')} ${table.label} · ${table.capacity} ${t('people')}`, area: 'kitchen' as const }))} selectedId={selected?.id ?? null}
        onSelect={(id) => { const table = visible.find((item) => item.id === id); onChange(table?.label ?? '', table); }} />}
    {!loading && !error && !visible.length ? <Text style={{ color: colors.muted }}>{t('No table in this area fits your party.')}</Text> : null}
  </View>;
}
