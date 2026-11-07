import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useCart } from '../context/CartContext';
import { usePreferences } from '../context/PreferencesContext';

import type { OrderChoice } from '../types/CardItem';

interface Props {
  orderChoice?: OrderChoice | null;
  cardId: number;
  title: string;
  price: string;
  allowedRemovals: string[];
}

export function OrderCustomizer({ cardId, title, price, allowedRemovals, orderChoice }: Props) {
  const { colors, t } = usePreferences();
  const { add, lines } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [removals, setRemovals] = useState<string[]>([]);
  const [allergy, setAllergy] = useState('');
  const [selections, setSelections] = useState<OrderChoice['options']>([]);
  const required = orderChoice?.count ?? 0;
  const canAdd = lines.length < 30 && selections.length === required;

  return (
    <View style={[styles.panel, { backgroundColor: colors.soft }]}>
      <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>{t('Customize your order')}</Text>
      {orderChoice ? (
        <View style={{ gap: 8 }}>
          <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>{t(orderChoice.label)}</Text>
          {required > 1 ? <Text style={{ color: colors.text }}>{selections.length} / {required}</Text> : null}
          {!orderChoice.options.length ? <Text style={{ color: colors.text }}>{t('No options available')}</Text> : null}
          {orderChoice.options.map((option) => {
            const count = selections.filter((selection) => selection.id === option.id).length;
            return required === 1 ? (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: count === 1 }}
                style={styles.choice}
                onPress={() => setSelections([option])}
              >
                <Text style={{ color: colors.text }}>{count ? '✓ ' : ''}{t(option.label)}</Text>
              </Pressable>
            ) : (
              <View key={option.id} style={styles.quantity}>
                <Text style={{ flex: 1, color: colors.text }}>{option.label} · {count}</Text>
                <Button color={colors.accent} title="−" accessibilityLabel={t('Remove piece') + ' ' + option.label} disabled={!count} onPress={() =>
                  setSelections((current) => {
                    const index = current.findIndex((selection) => selection.id === option.id);
                    return current.filter((_, position) => position !== index);
                  })
                } />
                <Button color={colors.accent} title="+" accessibilityLabel={t('Add piece') + ' ' + option.label} disabled={selections.length >= required} onPress={() =>
                  setSelections((current) => current.length < required ? [...current, option] : current)
                } />
              </View>
            );
          })}
        </View>
      ) : null}
      {allowedRemovals.map((ingredient) => {
        const checked = removals.includes(ingredient);
        return (
          <Pressable
            key={ingredient}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            style={styles.choice}
            onPress={() => setRemovals((current) =>
              checked ? current.filter((item) => item !== ingredient) : [...current, ingredient],
            )}
          >
            <Text style={{ color: colors.text }}>{checked ? '☑' : '☐'} {t('Without')} {ingredient}</Text>
          </Pressable>
        );
      })}
      <Text style={{ color: colors.text, fontWeight: '600' }}>{t('Report a food allergy')}</Text>
      <TextInput
        accessibilityLabel={t('Report a food allergy')}
        placeholder={t('Example: shrimp allergy')}
        placeholderTextColor={colors.muted}
        value={allergy}
        onChangeText={setAllergy}
        maxLength={200}
        multiline
        style={[styles.input, { color: colors.text, backgroundColor: colors.surface }]}
      />
      <Text style={{ color: colors.muted }}>{t('The restaurant reviews allergy alerts before preparing this item.')}</Text>
      <View style={styles.quantity}>
        <Button color={colors.accent} accessibilityLabel={t('Decrease quantity')} title="−" disabled={quantity <= 1} onPress={() => setQuantity(quantity - 1)} />
        <Text style={{ color: colors.text }}>{t('Quantity')} · {quantity}</Text>
        <Button color={colors.accent} accessibilityLabel={t('Increase quantity')} title="+" disabled={quantity >= 20} onPress={() => setQuantity(quantity + 1)} />
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={!canAdd}
        accessibilityState={{ disabled: !canAdd }}
        style={[styles.submit, { backgroundColor: colors.accent, opacity: canAdd ? 1 : 0.5 }]}
        onPress={() => {
          add({ cardId, title, price, quantity, removals, selections, allergy: allergy.trim() });
          router.push('/table-orders');
        }}
      >
        <Text style={{ color: colors.onAccent, fontWeight: '700' }}>{t('Add to order')} · ${(Number(price) * quantity).toFixed(2)} MXN</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 16, gap: 10, borderRadius: 16 },
  heading: { fontWeight: '700', fontSize: 20 },
  choice: { minHeight: 44, justifyContent: 'center' },
  input: { minHeight: 48, padding: 12, borderRadius: 8 },
  quantity: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  submit: { borderRadius: 10, minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: 12 },
});
