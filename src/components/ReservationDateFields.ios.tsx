import { languageLocales } from '../utils/preferenceStorage';
import { useState } from 'react';
import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, environment } from '@expo/ui/swift-ui/modifiers';
import { Pressable, Text, View } from 'react-native';
import { usePreferences } from '../context/PreferencesContext';
import type { DateFieldsProps } from './ReservationDateFields';

const zone = 'America/Mexico_City';
const dateFormat = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' });
const timeFormat = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const mexicoTime = (date: string, time: string) => new Date(date + 'T' + time + ':00-06:00');

export function ReservationDateFields({ date, time, setDate, setTime, disabled }: DateFieldsProps) {
  const { colors, t, preferences, isDark } = usePreferences();
  const [open, setOpen] = useState<'date' | 'time'>();
  const locale = languageLocales[preferences.language];
  const selection = mexicoTime(date, time || '12:00');
  const today = mexicoTime(dateFormat.format(new Date()), '00:00');
  const dateLabel = selection.toLocaleDateString(locale, { timeZone: zone, dateStyle: 'long' });
  const timeLabel = time ? selection.toLocaleTimeString(locale, { timeZone: zone, hour: 'numeric', minute: '2-digit', hour12: true }) : t('Choose a time');
  const field = (name: 'date' | 'time', label: string, value: string) => (
    <View style={{ gap: 6 }}>
      <Text style={{ color: colors.text }}>{label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={label + ', ' + value} accessibilityState={{ expanded: open === name, disabled }}
        disabled={disabled} onPress={() => {
          if (name === 'time' && !time) setTime('12:00');
          setOpen(open === name ? undefined : name);
        }} style={{ borderColor: colors.border, borderWidth: 1, padding: 14, borderRadius: 12, backgroundColor: colors.surface }}>
        <Text style={{ color: colors.text }}>{value}</Text>
      </Pressable>
      {open === name ? <Host style={{ width: '100%', height: name === 'date' ? 340 : 190 }} colorScheme={isDark ? 'dark' : 'light'}>
        <DatePicker title={label} selection={selection}
          range={name === 'date' ? { start: today } : undefined}
          displayedComponents={[name === 'date' ? 'date' : 'hourAndMinute']}
          modifiers={[datePickerStyle(name === 'date' ? 'graphical' : 'wheel'), environment('locale', locale), environment('timeZone', zone)]}
          onDateChange={(value) => {
            if (name === 'date') { setDate(dateFormat.format(value)); setOpen(undefined); }
            else setTime(timeFormat.format(value));
          }} />
      </Host> : null}
    </View>
  );
  return <>{field('date', t('Reservation date'), dateLabel)}{field('time', t('Reservation time'), timeLabel)}</>;
}
