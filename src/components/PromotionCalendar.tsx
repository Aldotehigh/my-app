
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Alert,
  Animated,
  Button,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import {
  getPromotion,
  savePromotion,
  type PromotionStatus,
} from '../services/promotions';

import { restaurantBrand } from '../constants/restaurantBrand';
import { usePreferences } from '../context/PreferencesContext';

// =============================================
// COLORES DORADOS DE YOTSUBA
// =============================================

const GOLD = '#D8B067';
const GOLD_BORDER = '#78502D';
const CREAM = '#F3DEC5';

// Imagen PNG de ondas japonesas transparentes
const ondasJaponesas = require('../../assets/images/ondas_japonesas.png');

// =============================================
// CÍRCULO DORADO CON DEGRADADO
// =============================================

function GoldenPromotionIcon() {
  return (
    <View style={styles.goldIcon}>
      <Svg
        width={40}
        height={40}
        viewBox="0 0 40 40"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <RadialGradient
            id="goldGradient"
            cx="30%"
            cy="25%"
            rx="75%"
            ry="75%"
          >
            <Stop
              offset="0%"
              stopColor="#FFE5A8"
            />
            <Stop
              offset="55%"
              stopColor="#E8BB6D"
            />
            <Stop
              offset="100%"
              stopColor="#C68C38"
            />
          </RadialGradient>
        </Defs>

        <Circle
          cx={20}
          cy={20}
          r={20}
          fill="url(#goldGradient)"
        />
      </Svg>

      <Text style={styles.goldIconText}>
        %
      </Text>
    </View>
  );
}

// =============================================
// OBTENER EL SIGUIENTE LUNES
// =============================================

function nextMonday() {
  const date = new Date();

  date.setDate(
    date.getDate() + (8 - date.getDay()) % 7
  );

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

// =============================================
// CALENDARIO ADMINISTRATIVO ORIGINAL
// =============================================

export function PromotionCalendar() {
  const { colors, t } = usePreferences();

  const [data, setData] =
    useState<PromotionStatus | null>(null);

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
        <Text
          style={{
            color: colors.accent,
          }}
        >
          {error}
        </Text>
      ) : null}

      <Text
        style={{
          color: colors.text,
        }}
      >
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
          accessibilityState={{
            checked: eligible === value,
          }}
          disabled={busy}
          onPress={() => setEligible(value)}
          style={{
            paddingVertical: 12,
          }}
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
          style={{
            paddingVertical: 8,
          }}
        >
          <Text
            style={{
              color: day.eligible
                ? colors.olive
                : colors.accent,
            }}
          >
            {day.date} ·{' '}
            {t(
              day.eligible
                ? 'Offer enabled'
                : 'Offer suspended'
            )}
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

// =============================================
// PROMOCIÓN LUNES 2X1 DESPLEGABLE
// =============================================

export function PromotionNotice() {
  const { colors, t, isDark } = usePreferences();

  const [promotion, setPromotion] =
    useState<PromotionStatus | null>(null);

  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const animation = useRef(
    new Animated.Value(0)
  ).current;

  // Consultar promoción desde Django
  useFocusEffect(
    useCallback(() => {
      let active = true;

      getPromotion()
        .then((value) => {
          if (active) {
            setPromotion(value);
          }
        })
        .catch(() => {
          if (active) {
            setPromotion(null);
          }
        });

      return () => {
        active = false;
      };
    }, [])
  );

  // =========================================
  // ANIMACIÓN DE APERTURA Y CIERRE
  // =========================================

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

  // =========================================
  // TÉRMINOS Y CONDICIONES TRADUCIBLES
  // =========================================

  const conditions = [
    t(
      'Valid only on authorized Mondays. Not valid on holidays or days without classes.'
    ),
    t(
      'Applies to full makimono orders only. Different rolls may be combined; the higher-priced roll in each pair will be charged.'
    ),
    t(
      'Coco, Don Jorge, Roca, Tesoro and Crunchy are excluded.'
    ),
    t(
      'Dine-in only. Leftover food from this promotion cannot be taken away.'
    ),
  ];

  // =========================================
  // ESTADO ACTUAL DE LA PROMOCIÓN
  // =========================================

  const status =
    promotion?.state === 'active'
      ? t('Monday 2-for-1 is active today')
      : promotion?.state === 'suspended'
        ? t('The Monday offer is suspended today')
        : promotion?.state === 'calendar_unconfirmed'
          ? t(
              'The Monday offer has not been confirmed today'
            )
          : null;

  // =========================================
  // TARJETA DE LA PROMOCIÓN
  // =========================================

  return (
    <View
      style={[
        styles.promotionContainer,
        {
          backgroundColor: isDark
            ? '#2E1B14'
            : colors.soft,

          borderColor: isDark
            ? GOLD_BORDER
            : 'transparent',

          borderWidth: isDark ? 1 : 0,
        },
      ]}
    >
      {/* ENCABEZADO COMPACTO */}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={toggle}
        style={[
          styles.promotionHeader,
          {
            minHeight: isDark ? 58 : 64,
            paddingHorizontal: isDark ? 16 : 14,
            paddingVertical: isDark ? 7 : 12,
          },
        ]}
      >
        {/* ================================= */}
        {/* ONDAS PNG SOLO EN MODO OSCURO */}
        {/* ================================= */}

        {isDark ? (
          <View
            pointerEvents="none"
            style={styles.promotionWaves}
          >
            <Image
              source={ondasJaponesas}
              resizeMode="contain"
              accessible={false}
              style={styles.promotionWavesImage}
            />
          </View>
        ) : null}

        {/* CÍRCULO DE PROMOCIÓN */}
        {isDark ? (
          <GoldenPromotionIcon />
        ) : (
          <View
            style={[
              styles.lightIcon,
              {
                backgroundColor: colors.accent,
              },
            ]}
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
        )}

        {/* TÍTULO Y SUBTÍTULO */}
        <View style={styles.headerText}>
          <Text
            numberOfLines={1}
            style={{
              color: isDark
                ? CREAM
                : colors.accent,

              fontSize: isDark ? 17 : 16,

              fontFamily: isDark
                ? restaurantBrand.serif
                : undefined,

              fontWeight: isDark ? '500' : '700',
            }}
          >
            {t('Monday 2-for-1')}
          </Text>

          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              color: isDark
                ? '#D4BEA9'
                : colors.muted,

              fontSize: isDark ? 11 : 12,
              marginTop: 2,
            }}
          >
            {t('Subject to terms and conditions')}
          </Text>
        </View>

        {/* BOTÓN MÁS / MENOS */}
        <Text
          style={{
            color: isDark ? GOLD : colors.accent,
            fontSize: isDark ? 21 : 22,
            fontWeight: '500',
            marginLeft: 5,
            zIndex: 2,
          }}
        >
          {expanded ? '−' : '+'}
        </Text>
      </Pressable>

      {/* ===================================== */}
      {/* CONTENIDO DESPLEGABLE */}
      {/* ===================================== */}

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
            const height =
              event.nativeEvent.layout.height;

            if (height !== contentHeight) {
              setContentHeight(height);
            }
          }}
          style={styles.conditionsContent}
        >
          {/* SEPARADOR */}
          <View
            style={{
              height: 1,
              backgroundColor: isDark
                ? GOLD_BORDER
                : colors.border,
              marginBottom: 3,
              opacity: isDark ? 0.55 : 1,
            }}
          />

          {/* TÍTULO DE LAS CONDICIONES */}
          <Text
            style={{
              color: isDark ? CREAM : colors.text,
              fontWeight: '700',
              fontSize: 14,
            }}
          >
            {t('Terms and conditions')}
          </Text>

          {/* CONDICIONES */}
          {conditions.map((condition, index) => (
            <View
              key={index}
              style={styles.conditionRow}
            >
              <Text
                style={{
                  color: isDark ? GOLD : colors.accent,
                  fontSize: 15,
                  fontWeight: '700',
                }}
              >
                ✓
              </Text>

              <Text
                style={{
                  flex: 1,
                  color: isDark
                    ? '#E5D1BF'
                    : colors.text,
                  fontSize: 12,
                  lineHeight: 19,
                }}
              >
                {condition}
              </Text>
            </View>
          ))}

          {/* ESTADO ACTUAL */}
          {status ? (
            <Text
              style={{
                color: isDark
                  ? '#BDA58F'
                  : colors.muted,
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

// =============================================
// ESTILOS
// =============================================

const styles = StyleSheet.create({
  promotionContainer: {
    marginTop: 5,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },

  promotionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    zIndex: 1,
    overflow: 'hidden',
  },

  headerText: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    zIndex: 2,
  },

  // PNG decorativo detrás del texto
  promotionWaves: {
    position: 'absolute',
    width: 185,
    height: 62,
    right: 20,
    bottom: -8,
    opacity: 0.35,
    zIndex: 0,
  },

  promotionWavesImage: {
    width: '100%',
    height: '100%',
  },

  goldIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 2,
  },

  goldIconText: {
    color: '#301A14',
    fontSize: 22,
    fontFamily: restaurantBrand.serif,
    zIndex: 1,
  },

  lightIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  conditionsContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 11,
  },

  conditionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
});
