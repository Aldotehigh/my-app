
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Button,
  Easing,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  getPromotion,
  savePromotion,
  type PromotionStatus,
} from '../services/promotions';
import { usePreferences } from '../context/PreferencesContext';

function nextMonday() {
  const date = new Date();
  date.setDate(date.getDate() + (8 - date.getDay()) % 7);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function PromotionCalendar() {
  const { colors, t } = usePreferences();
  const [data, setData] = useState<PromotionStatus | null>(null);
  const [date, setDate] = useState(nextMonday);
  const [eligible, setEligible] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getPromotion()
        .then((value) => {
          if (active) {
            setData(value);
            setError('');
          }
        })
        .catch((err) => {
          if (active) {
            setError(
              err instanceof Error
                ? err.message
                : t('Could not load promotion.')
            );
          }
        });

      return () => {
        active = false;
      };
    }, [t])
  );

  async function save() {
    if (busy) return;
    setBusy(true);

    try {
      await savePromotion(date, eligible, reason);
      setData(await getPromotion());
      setError('');
      Alert.alert(t('Promotion calendar saved'));
    } catch (err) {
      Alert.alert(
        t('Error'),
        err instanceof Error
          ? err.message
          : t('Could not save promotion.')
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View
      style={{
        gap: 12,
        padding: 16,
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 16,
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontWeight: '700',
          fontSize: 21,
        }}
      >
        {t('Monday 2-for-1 calendar')}
      </Text>

      <Text style={{ color: colors.muted }}>
        {t(
          'Confirm normal school Mondays. Holidays, school closures and unconfirmed dates do not activate the offer.'
        )}
      </Text>

      {error ? (
        <Text style={{ color: colors.accent }}>{error}</Text>
      ) : null}

      <Text style={{ color: colors.text }}>
        {t('Monday date')} · YYYY-MM-DD
      </Text>

      <TextInput
        accessibilityLabel={t('Monday date')}
        value={date}
        onChangeText={setDate}
        maxLength={10}
        editable={!busy}
        style={{
          color: colors.text,
          padding: 12,
          minHeight: 48,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 8,
        }}
      />

      {([true, false] as const).map((value) => (
        <Pressable
          key={String(value)}
          accessibilityRole="radio"
          accessibilityState={{ checked: eligible === value }}
          disabled={busy}
          onPress={() => setEligible(value)}
          style={{ paddingVertical: 12 }}
        >
          <Text style={{ color: colors.text }}>
            {eligible === value ? '✓ ' : ''}
            {t(
              value
                ? 'Normal school day: enable offer'
                : 'Holiday or school closure: disable offer'
            )}
          </Text>
        </Pressable>
      ))}

      <TextInput
        accessibilityLabel={t('Calendar reason')}
        placeholder={t('Calendar reason')}
        placeholderTextColor={colors.muted}
        value={reason}
        onChangeText={setReason}
        maxLength={200}
        editable={!busy}
        style={{
          color: colors.text,
          padding: 12,
          minHeight: 48,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
        }}
      />

      <Button
        title={t('Save promotion date')}
        color={colors.accent}
        disabled={
          busy ||
          !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          (!eligible && !reason.trim())
        }
        onPress={() => void save()}
      />

      {data?.calendar?.map((day) => (
        <Pressable
          key={day.date}
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            setDate(day.date);
            setEligible(day.eligible);
            setReason(day.reason);
          }}
          style={{ paddingVertical: 8 }}
        >
          <Text
            style={{
              color: day.eligible ? colors.olive : colors.accent,
            }}
          >
            {day.date} ·{' '}
            {t(day.eligible ? 'Offer enabled' : 'Offer suspended')}
          </Text>

          {day.reason ? (
            <Text style={{ color: colors.muted }}>
              {day.reason}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

export function PromotionNotice() {
  const { colors, t } = usePreferences();

  const [promotion, setPromotion] =
    useState<PromotionStatus | null>(null);

  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const animation = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getPromotion()
        .then((value) => {
          if (active) setPromotion(value);
        })
        .catch(() => {
          if (active) setPromotion(null);
        });

      return () => {
        active = false;
      };
    }, [])
  );

  useEffect(() => {
    const movement = Animated.timing(animation, {
      toValue: expanded ? 1 : 0,
      duration: 320,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });

    movement.start();

    return () => movement.stop();
  }, [expanded, animation]);

  const toggle = () => {
    setExpanded((current) => !current);
  };

  const conditions = [
    'Promoción válida únicamente los lunes autorizados. No aplica en días festivos ni en días sin clases.',
    'Aplica exclusivamente en órdenes completas de makimonos. Se pueden combinar diferentes rollos y se cobrará el de mayor precio de cada par.',
    'Quedan excluidas las variedades Coco, Don Jorge, Roca/Rocca, Tesoro y Crunchy.',
    'Promoción exclusiva para consumo dentro del restaurante. Los alimentos sobrantes de esta promoción no podrán solicitarse para llevar.',
  ];

  const status =
    promotion?.state === 'active'
      ? t('Monday 2-for-1 is active today')
      : promotion?.state === 'suspended'
        ? t('The Monday offer is suspended today')
        : promotion?.state === 'calendar_unconfirmed'
          ? t('The Monday offer has not been confirmed today')
          : null;

  return (
    <View
      style={{
        marginTop: 16,
        borderRadius: 14,
        backgroundColor: colors.soft,
        overflow: 'hidden',
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={toggle}
        style={{
          minHeight: 64,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: colors.onAccent,
              fontSize: 18,
            }}
          >
            %
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.accent,
              fontSize: 16,
              fontWeight: '700',
            }}
          >
            Lunes 2×1
          </Text>

          <Text
            style={{
              color: colors.muted,
              fontSize: 12,
              marginTop: 3,
            }}
          >
            Sujeto a términos y condiciones
          </Text>
        </View>

        <Text
          style={{
            color: colors.accent,
            fontSize: 22,
            fontWeight: '500',
          }}
        >
          {expanded ? '−' : '+'}
        </Text>
      </Pressable>

      <Animated.View
        style={{
          height: animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, contentHeight],
          }),
          opacity: animation,
          overflow: 'hidden',
        }}
      >
        <View
          pointerEvents={expanded ? 'auto' : 'none'}
          onLayout={(event) => {
            const height = event.nativeEvent.layout.height;

            if (height !== contentHeight) {
              setContentHeight(height);
            }
          }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            paddingHorizontal: 16,
            paddingBottom: 16,
            gap: 11,
          }}
        >
          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginBottom: 3,
            }}
          />

          <Text
            style={{
              color: colors.text,
              fontWeight: '700',
              fontSize: 14,
            }}
          >
            Términos y condiciones
          </Text>

          {conditions.map((condition, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 9,
              }}
            >
              <Text
                style={{
                  color: colors.accent,
                  fontSize: 15,
                  fontWeight: '700',
                }}
              >
                ✓
              </Text>

              <Text
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 12,
                  lineHeight: 19,
                }}
              >
                {condition}
              </Text>
            </View>
          ))}

          {status ? (
            <Text
              style={{
                color: colors.muted,
                fontSize: 12,
                lineHeight: 18,
                marginTop: 3,
              }}
            >
              {status}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}
