import { Text, TextInput, View } from 'react-native';
import type { Address } from '../types/Address';
import { usePreferences } from '../context/PreferencesContext';

export function AddressEditor({ value, onChange, busy }: { value: Address; onChange: (address: Address) => void; busy: boolean }) {
  const { colors, t } = usePreferences();
  const fields = [
    ['recipient', 'Recipient'], ['phone', 'Contact phone'], ['street', 'Street'],
    ['number', 'Exterior number or S/N'], ['neighborhood', 'Neighborhood'],
    ['city', 'City or municipality'], ['state', 'State'], ['postal_code', 'Postal code'],
    ['references', 'Delivery references (optional)'],
  ] as const;
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: colors.muted }}>{t('Check each field. The restaurant will confirm the delivery address.')}</Text>
      {fields.map(([field, label]) => (
        <View key={field} style={{ gap: 5 }}>
          <Text style={{ color: colors.text }}>{t(label)}</Text>
          <TextInput accessibilityLabel={t(label)} value={value[field]} editable={!busy}
            onChangeText={(text) => onChange({ ...value, [field]: text })}
            keyboardType={field === 'phone' ? 'phone-pad' : field === 'postal_code' ? 'number-pad' : 'default'}
            maxLength={field === 'postal_code' ? 5 : field === 'phone' ? 25 : field === 'references' ? 200 : field === 'number' ? 20 : field === 'city' || field === 'state' || field === 'neighborhood' ? 80 : 100}
            multiline={field === 'references'}
            style={{ color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 48 }}
          />
        </View>
      ))}
    </View>
  );
}
