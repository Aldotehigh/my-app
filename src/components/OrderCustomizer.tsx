
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useCart } from '../context/CartContext';
import { usePreferences } from '../context/PreferencesContext';
import type { OrderChoice, OrderProfile, OrderOption } from '../types/CardItem';

interface Props {
  keepChoosing?: boolean;
  orderChoice?: OrderChoice | null;
  orderProfile?: OrderProfile;
  cardId: number;
  title: string;
  price: string;
  allowedRemovals: string[];
}

export function OrderCustomizer({ cardId, title, price, allowedRemovals, orderChoice, orderProfile, keepChoosing }: Props) {
  const { colors, t, isDark } = usePreferences();
  const { add, lines } = useCart();
  const router = useRouter();
  const [addedCount, setAddedCount] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [removals, setRemovals] = useState<string[]>([]);
  const [allergy, setAllergy] = useState('');
  const [choices, setChoices] = useState<Record<string, string[]>>({});

  const groups: OrderOption[] = orderProfile?.groups ?? (orderChoice ? [{
    ...orderChoice, key: 'legacy', optional: false, distinct: false,
  }] : []);

  const skewers = choices.skewers ?? [];
  const activeGroups = groups.filter((group) =>
    !group.requires_ids || group.requires_ids.some((id) => skewers.includes(id)),
  );
  const effectiveChoices = Object.fromEntries(
    activeGroups.map((group) => [group.key, choices[group.key] ?? []]),
  );
  const selectedOptions = activeGroups.flatMap((group) =>
    effectiveChoices[group.key].map((id) => group.options.find((option) => option.id === id)!),
  ).filter(Boolean);
  const complete = activeGroups.every((group) =>
    group.optional && !effectiveChoices[group.key].length || effectiveChoices[group.key].length >= (group.min_count ?? group.count) && effectiveChoices[group.key].length <= group.count,
  );
  const selectedPrices = selectedOptions.flatMap((option) => option.price ? [Number(option.price)] : []);
  const unitPrice = orderProfile?.highest_price && selectedPrices.length
    ? Math.max(...selectedPrices).toFixed(2) : price;
  const canAdd = lines.length < 30 && complete;
  const showAllergy = orderProfile?.show_allergy ?? true;
  const showRemovals = orderProfile?.show_removals ?? true;

  function select(key: string, values: string[]) {
    setChoices((current) => ({ ...current, [key]: values }));
  }

  function addSelection() {
    if (!canAdd) return;
    add({
      cardId, title, price: unitPrice, quantity,
      removals: showRemovals ? removals : [],
      allergy: showAllergy ? allergy.trim() : '',
      selections: selectedOptions,
      choices: orderProfile ? effectiveChoices : undefined,
      course: orderProfile?.course,
    });
    setAddedCount((count) => count + quantity);
  }

  return (
    <View style={[
      styles.panel,
      { backgroundColor: colors.soft },
      isDark && styles.darkPanel,
    ]}>
      <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>{t('Your selection')}</Text>
      {orderProfile?.notice ? <Text style={{ color: colors.text }}>{t(orderProfile.notice)}</Text> : null}

      {activeGroups.map((group) => {
        const values = choices[group.key] ?? [];
        return (
          <View key={group.key} style={{ gap: 8 }}>
            <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>{t(group.label)}</Text>
            {group.count > 1 ? <Text style={{ color: colors.text }}>{values.length} / {group.min_count ? group.min_count + '–' + group.count : group.count}</Text> : null}
            {group.warning && values.length === group.count ? <Text style={{ color: colors.accent }}>{t(group.warning)}</Text> : null}
            {!group.options.length ? <Text style={{ color: colors.text }}>{t('No options available')}</Text> : null}

            {group.options.map((option) => {
              const count = values.filter((value) => value === option.id).length;
              const label = t(option.label) + (option.price ? ' · $' + option.price : '');

              if (group.count === 1 || group.distinct) {
                const disabled = group.distinct && !count && values.length >= group.count;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole={group.count === 1 && !group.optional ? 'radio' : 'checkbox'}
                    accessibilityState={{ checked: Boolean(count), disabled }}
                    disabled={disabled}
                    style={[styles.choice, {
                      borderColor: count ? (isDark ? '#D8B067' : colors.accent): colors.muted,
                      backgroundColor: count ? colors.surface : 'transparent',
                      opacity: disabled ? 0.5 : 1,
                    }]}
                    onPress={() => {
                      if (group.count === 1) {
                        select(group.key, count && group.optional ? [] : [option.id]);
                      } else {
                        select(group.key, count ? values.filter((id) => id !== option.id) : [...values, option.id]);
                      }
                    }}
                  >
                    <Text style={{ color: count && isDark ? '#D8B067' : colors.text }}>{count ? '✓ ' : ''}{label}</Text>
                  </Pressable>
                );
              }

              return (
                <View key={option.id} style={styles.quantity}>
                  <Text style={{ flex: 1, color: colors.text }}>{label} · {count}</Text>

                  {isDark ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('Remove piece') + ' ' + label}
                      accessibilityState={{ disabled: !count }}
                      disabled={!count}
                      style={[styles.quantityButton, !count && styles.disabledButton]}
                      onPress={() => {
                        const index = values.indexOf(option.id);
                        select(group.key, values.filter((_, position) => position !== index));
                      }}
                    >
                      <Text style={styles.quantityButtonText}>−</Text>
                    </Pressable>
                  ) : (
                    <Button color={colors.accent} title="−" accessibilityLabel={t('Remove piece') + ' ' + label} disabled={!count} onPress={() => {
                      const index = values.indexOf(option.id);
                      select(group.key, values.filter((_, position) => position !== index));
                    }} />
                  )}

                  {isDark ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('Add piece') + ' ' + label}
                      accessibilityState={{ disabled: values.length >= group.count }}
                      disabled={values.length >= group.count}
                      style={[styles.quantityButton, values.length >= group.count && styles.disabledButton]}
                      onPress={() => select(group.key, [...values, option.id])}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </Pressable>
                  ) : (
                    <Button color={colors.accent} title="+" accessibilityLabel={t('Add piece') + ' ' + label} disabled={values.length >= group.count} onPress={() =>
                      select(group.key, [...values, option.id])
                    } />
                  )}
                </View>
              );
            })}
          </View>
        );
      })}

      {showRemovals ? allowedRemovals.map((ingredient) => {
        const checked = removals.includes(ingredient);
        return (
          <Pressable key={ingredient} accessibilityRole="checkbox" accessibilityState={{ checked }}
            style={[styles.choice, { borderColor: colors.muted }]}
            onPress={() => setRemovals((current) => checked ? current.filter((item) => item !== ingredient) : [...current, ingredient])}
          >
            <Text style={{ color: colors.text }}>{checked ? '☑' : '☐'} {t('Without')} {ingredient}</Text>
          </Pressable>
        );
      }) : null}

      {orderProfile?.alcohol_free ? <Text style={{ color: colors.muted }}>{t('Alcohol-free requests require confirmation from the bar. The listed price applies.')}</Text> : null}

      {showAllergy ? (
        <>
          <Text style={{ color: colors.text, fontWeight: '600' }}>{t('Report a food allergy')}</Text>
          <TextInput accessibilityLabel={t('Report a food allergy')}
            placeholder={t('Tell the restaurant about a food allergy')}
            placeholderTextColor={colors.muted} value={allergy} onChangeText={setAllergy}
            maxLength={200} multiline
            style={[styles.input, { color: colors.text, backgroundColor: colors.surface }]}
          />
          <Text style={{ color: colors.muted }}>{t('The restaurant reviews allergy alerts before preparing this item.')}</Text>
        </>
      ) : null}

      <View style={styles.quantity}>
        {isDark ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Decrease quantity')}
            accessibilityState={{ disabled: quantity <= 1 }}
            disabled={quantity <= 1}
            style={[styles.quantityButton, quantity <= 1 && styles.disabledButton]}
            onPress={() => setQuantity(quantity - 1)}
          >
            <Text style={styles.quantityButtonText}>−</Text>
          </Pressable>
        ) : (
          <Button color={colors.accent} accessibilityLabel={t('Decrease quantity')} title="−" disabled={quantity <= 1} onPress={() => setQuantity(quantity - 1)} />
        )}

        <Text style={{ color: colors.text }}>{t('Quantity')} · {quantity}</Text>

        {isDark ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Increase quantity')}
            accessibilityState={{ disabled: quantity >= 20 }}
            disabled={quantity >= 20}
            style={[styles.quantityButton, quantity >= 20 && styles.disabledButton]}
            onPress={() => setQuantity(quantity + 1)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </Pressable>
        ) : (
          <Button color={colors.accent} accessibilityLabel={t('Increase quantity')} title="+" disabled={quantity >= 20} onPress={() => setQuantity(quantity + 1)} />
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!canAdd}
        accessibilityState={{ disabled: !canAdd }}
        style={[
          styles.submit,
          {
            backgroundColor: isDark ? '#801C18' : colors.accent,
            opacity: canAdd ? 1 : 0.5,
          },
          isDark && styles.darkSubmit,
        ]}
        onPress={() => {
          addSelection();
          router.push('/table-orders');
        }}
      >
        <Text style={{ color: colors.onAccent, fontWeight: '700' }}>
          {t('Add to order')} · ${(Number(unitPrice) * quantity).toFixed(2)} MXN
        </Text>
      </Pressable>

      {keepChoosing ? (
        <>
          <Button color={colors.accent} title={t('Add and keep choosing')} disabled={!canAdd} onPress={addSelection} />
          {addedCount ? <Text accessibilityLiveRegion="polite" style={{ color: colors.text }}>{t('Added to cart')} · {addedCount}</Text> : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 16, gap: 12, borderRadius: 16 },
  heading: { fontWeight: '700', fontSize: 19 },
  choice: { minHeight: 48, justifyContent: 'center', padding: 10, borderWidth: 1, borderRadius: 10 },
  input: { minHeight: 48, padding: 12, borderRadius: 8 },
  quantity: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  submit: { borderRadius: 10, minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: 12 },

  // Dark mode: gold outline around selection
  darkPanel: {
    borderWidth: 1,
    borderColor: '#D8B067',
    borderRadius: 24,
    padding: 20,
  },

  // Dark mode: round wine-red quantity buttons
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#801C18',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#A34437',
    borderBottomWidth: 1,
    borderBottomColor: '#9B392A',
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderLeftColor: '#84241D',
    borderRightColor: '#84241D',
  },

  quantityButtonText: {
    color: '#F7E6D4',
    fontSize: 23,
    fontWeight: '700',
    lineHeight: 27,
    textAlign: 'center',
  },

  disabledButton: {
    opacity: 0.4,
  },

  // Dark mode: rounded add-to-order button
  darkSubmit: {
    minHeight: 52,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#D8B067',
    paddingHorizontal: 14,
  },
});
