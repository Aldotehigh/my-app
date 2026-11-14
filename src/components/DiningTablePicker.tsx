
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Button,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import CategorySelector from './CategorySelector';
import { usePreferences } from '../context/PreferencesContext';
import { getDiningTables, type DiningTable } from '../services/reservations';

const GOLD = '#D8B067';
const WINE = '#801C18';

// =============================================
// BOTÓN DE ZONA CON ANIMACIÓN
// =============================================

function ZoneButton({
  label,
  selected,
  disabled,
  onPress,
  isDark,
  accentColor,
  reduceMotion,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
  isDark: boolean;
  accentColor: string;
  reduceMotion: boolean;
}) {
  const liftAnimation = useRef(
    new Animated.Value(selected ? 1 : 0)
  ).current;

  useEffect(() => {
    if (reduceMotion) {
      liftAnimation.setValue(selected ? 1 : 0);
      return;
    }

    const animation = Animated.timing(liftAnimation, {
      toValue: selected ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [selected, reduceMotion, liftAnimation]);

  const translateY = liftAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.zoneButton,
        {
          backgroundColor: isDark ? WINE : accentColor,
          borderWidth: isDark ? 1.5 : 0,
          borderColor: isDark
            ? selected ? GOLD : '#A34437'
            : 'transparent',
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Animated.View
        style={{ transform: [{ translateY }] }}
      >
        <Text
          style={styles.zoneButtonText}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// =============================================
// SELECTOR DE MESAS
// =============================================

export function DiningTablePicker({
  value,
  onChange,
  partySize = 1,
  disabled = false,
}: {
  value: string;
  onChange: (label: string, table?: DiningTable) => void;
  partySize?: number;
  disabled?: boolean;
}) {
  const { colors, t, isDark, reduceMotion } = usePreferences();

  const [tables, setTables] = useState<DiningTable[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [zone, setZone] = useState<'terrace' | 'salon'>('terrace');

  // ---------------------------------------------
  // CARGAR MESAS
  // ---------------------------------------------

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    getDiningTables()
      .then((data) => {
        if (active) setTables(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retry]);

  const selected = tables.find(
    (table) => table.label === value
  );

  const visible = tables.filter(
    (table) =>
      table.zone === zone &&
      table.capacity >= partySize
  );

  useEffect(() => {
    if (selected && selected.capacity < partySize) {
      onChange('');
    }
  }, [selected, partySize, onChange]);

  // ---------------------------------------------
  // CAMBIAR ZONA
  // ---------------------------------------------

  function selectZone(item: 'terrace' | 'salon') {
    setZone(item);
    onChange('');
  }

  return (
    <View
      style={[
        styles.container,
        { opacity: disabled ? 0.5 : 1 },
      ]}
      pointerEvents={disabled ? 'none' : 'auto'}
    >
      <Text
        style={[
          styles.heading,
          { color: colors.text },
        ]}
      >
        {t('Choose a table')}
      </Text>

      {/* TERRAZA Y SALÓN ANIMADOS */}

      <View style={styles.zoneRow}>
        {(['terrace', 'salon'] as const).map((item) => (
          <ZoneButton
            key={item}
            label={t(
              item === 'terrace'
                ? 'Terrace'
                : 'Dining room'
            )}
            selected={zone === item}
            disabled={disabled}
            isDark={isDark}
            accentColor={colors.accent}
            reduceMotion={reduceMotion}
            onPress={() => selectZone(item)}
          />
        ))}
      </View>

      {/* CARGANDO */}

      {loading ? (
        <ActivityIndicator color={colors.accent} />
      ) : error ? (
        <>
          <Text style={{ color: colors.accent }}>
            {error}
          </Text>

          <Button
            title={t('Retry')}
            onPress={() =>
              setRetry((current) => current + 1)
            }
          />
        </>
      ) : (
        <CategorySelector
          fieldLabel={t('Table')}
          collectionLabel={t('Tables')}
          searchLabel={t('Search tables')}
          emptyLabel={t('Select a table')}
          categories={visible.map((table) => ({
            id: table.id,
            name: `${t('Table')} ${table.label} · ${table.capacity} ${t('people')}`,
            area: 'kitchen' as const,
          }))}
          selectedId={selected?.id ?? null}
          onSelect={(id) => {
            const table = visible.find(
              (item) => item.id === id
            );

            onChange(
              table?.label ?? '',
              table
            );
          }}
        />
      )}

      {!loading && !error && !visible.length ? (
        <Text style={{ color: colors.muted }}>
          {t('No table in this area fits your party.')}
        </Text>
      ) : null}
    </View>
  );
}

// =============================================
// ESTILOS
// =============================================

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },

  heading: {
    fontSize: 16,
    fontWeight: '700',
  },

  zoneRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 10,
  },

  zoneButton: {
    minHeight: 46,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  zoneButtonText: {
    color: '#FFF1DF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
