import { Text, TextInput, View } from 'react-native';
import { usePreferences } from '../context/PreferencesContext';

export interface DateFieldsProps {
  date: string;
  time: string;
  setDate: (value: string) => void;
  setTime: (value: string) => void;
  disabled: boolean;
}

export function ReservationDateFields({ date, time, setDate, setTime, disabled }: DateFieldsProps) {
  const { colors, t } = usePreferences();
  return <>{[
    { label: 'Date (YYYY-MM-DD)', value: date, change: setDate },
    { label: 'Time (HH:MM, 24-hour)', value: time, change: setTime },
  ].map(({ label, value, change }) => (
    <View key={label} style={{ gap: 6 }}>
      <Text style={{ color: colors.text }}>{t(label)}</Text>
      <TextInput accessibilityLabel={t(label)} value={value} onChangeText={change} editable={!disabled}
        style={{ color: colors.text, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 14 }} />
    </View>
  ))}</>;
}
