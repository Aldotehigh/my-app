
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { languageLocales } from '../../utils/preferenceStorage';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';

import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../context/PreferencesContext';
import { DiningTablePicker } from '../../components/DiningTablePicker';

import {
  changeReservation,
  getReservations,
  requestReservation,
  reservationLabels,
  type DiningTable,
  type Reservation,
  type ReservationStatus,
} from '../../services/reservations';

// ============================================
// COLORES DE YOTSUBA
// ============================================

const GOLD = '#D8B067';
const WINE = '#801C18';
const TERRACOTTA = '#A34437';
const CREAM = '#F3DEC5';
const LIGHT_SOFT = '#F2DDD2';
const DARK_ICON_BG = '#493021';

type IconName = ComponentProps<typeof Ionicons>['name'];

// ============================================
// FUNCIONES DE FORMATO DE HORA
// ============================================

function formatTime(value: Date) {
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

function parseTime(value: string) {
  const selected = new Date();
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);

  if (match) {
    selected.setHours(
      Number(match[1]),
      Number(match[2]),
      0,
      0
    );
  } else {
    selected.setSeconds(0, 0);
  }

  return selected;
}

// ============================================
// ICONOS EN AMBOS MODOS
// ============================================

function FieldIcon({
  name,
  isDark,
}: {
  name: IconName;
  isDark: boolean;
}) {
  return (
    <View
      style={[
        styles.fieldIcon,
        {
          backgroundColor: isDark
            ? DARK_ICON_BG
            : LIGHT_SOFT,
        },
      ]}
    >
      <Ionicons
        name={name}
        size={23}
        color={isDark ? GOLD : WINE}
      />
    </View>
  );
}

// ============================================
// BOTONES COLOR VINO
// ============================================

function WineAction({
  title,
  onPress,
  disabled = false,
  isDark,
  icon,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  isDark: boolean;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        {
          borderColor: isDark ? GOLD : TERRACOTTA,
          opacity: disabled
            ? 0.45
            : pressed
              ? 0.8
              : 1,
        },
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={22}
          color={CREAM}
        />
      ) : null}

      <Text style={styles.actionText}>
        {title}
      </Text>
    </Pressable>
  );
}

// ============================================
// PANTALLA DE RESERVACIONES
// ============================================

export default function ReservationsScreen() {
  const { user } = useAuth();

  const {
    colors,
    t,
    preferences,
    isDark,
  } = usePreferences();

  const manager =
    user?.role === 'owner' ||
    user?.role === 'admin';

  const customer = user?.role === 'customer';
  const allowed = manager || customer;

  // ============================================
  // ESTADOS DEL FORMULARIO
  // ============================================

  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [table, setTable] = useState<DiningTable>();
  const [party, setParty] = useState('2');

  const [name, setName] = useState(
    user?.first_name || user?.username || ''
  );

  const [phone, setPhone] = useState(
    user?.address?.phone || ''
  );

  const [date, setDate] = useState(() =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  );

  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  // ============================================
  // ESTADOS PARA EL SELECTOR DE HORA
  // ============================================

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [draftTime, setDraftTime] = useState(new Date());

  // ============================================
  // ESTADOS DE ADMINISTRACIÓN
  // ============================================

  const [durations, setDurations] = useState<
    Record<number, string>
  >({});

  const [responses, setResponses] = useState<
    Record<number, string>
  >({});

  const operation = useRef(false);

  const attempt = useRef({
    signature: '',
    key: '',
  });

  // ============================================
  // COLORES SEGÚN EL TEMA
  // ============================================

  const detailColor = isDark ? GOLD : TERRACOTTA;
  const iconColor = isDark ? GOLD : WINE;

  const panelStyle = [
    styles.panel,
    {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: detailColor,
    },
  ];

  const inputStyle = [
    styles.input,
    {
      color: colors.text,
      backgroundColor: colors.surface,
      borderColor: detailColor,
      borderWidth: 1.5,
    },
  ];

  // ============================================
  // CARGAR RESERVACIONES
  // ============================================

  const refresh = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      return;
    }

    try {
      setItems(await getReservations());
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('Unknown error')
      );
    } finally {
      setLoading(false);
    }
  }, [allowed, t]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void refresh();

      const timer = setInterval(() => {
        if (active) {
          void refresh();
        }
      }, 15000);

      return () => {
        active = false;
        clearInterval(timer);
      };
    }, [refresh])
  );

  // ============================================
  // ABRIR SELECTOR DE HORA
  // ============================================

  function openTimePicker() {
    if (busy) return;

    const selected = parseTime(time);

    setDraftTime(selected);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: selected,
        mode: 'time',
        display: 'spinner',
        is24Hour: true,

        onChange: (event, selectedTime) => {
          if (
            event.type === 'set' &&
            selectedTime
          ) {
            setTime(formatTime(selectedTime));
          }
        },
      });
    } else {
      setShowTimePicker(true);
    }
  }

  // ============================================
  // CONFIRMAR HORA EN IPHONE
  // ============================================

  function confirmTime() {
    setTime(formatTime(draftTime));
    setShowTimePicker(false);
  }

  // ============================================
  // CANCELAR SELECCIÓN DE HORA
  // ============================================

  function cancelTime() {
    setShowTimePicker(false);
  }

  // ============================================
  // CAMPOS DEL FORMULARIO
  // ============================================

  function input(
    label: string,
    value: string,
    onChangeText: (value: string) => void,
    number = false,
    icon?: IconName,
    multiline = false
  ) {
    return (
      <View style={styles.fieldRow}>
        {icon ? (
          <FieldIcon
            name={icon}
            isDark={isDark}
          />
        ) : null}

        <View style={styles.fieldContent}>
          <Text
            style={[
              styles.fieldLabel,
              { color: colors.text },
            ]}
          >
            {t(label)}
          </Text>

          <TextInput
            accessibilityLabel={t(label)}
            value={value}
            onChangeText={onChangeText}
            editable={!busy}
            keyboardType={
              number ? 'number-pad' : 'default'
            }
            placeholderTextColor={colors.muted}
            multiline={multiline}
            textAlignVertical={
              multiline ? 'top' : 'center'
            }
            style={[
              inputStyle,
              multiline && styles.multilineInput,
            ]}
          />
        </View>
      </View>
    );
  }

  // ============================================
  // SEPARADORES ADAPTADOS AL TEMA
  // ============================================

  function divider() {
    return (
      <View
        style={[
          styles.divider,
          {
            backgroundColor: isDark
              ? 'rgba(216,176,103,0.42)'
              : 'rgba(163,68,55,0.28)',
          },
        ]}
      />
    );
  }

  // ============================================
  // CONTADOR DE PERSONAS
  // ============================================

  function changeParty(amount: number) {
    if (busy) return;

    const current = Number(party) || 1;

    const next = Math.max(
      1,
      Math.min(99, current + amount)
    );

    setParty(String(next));
  }

  function partySelector() {
    return (
      <View style={styles.partyRow}>
        <FieldIcon
          name="people-outline"
          isDark={isDark}
        />

        <Text
          style={[
            styles.partyLabel,
            { color: colors.text },
          ]}
          numberOfLines={2}
        >
          {t('Party size')}
        </Text>

        <View style={styles.counter}>
          {/* BOTÓN RESTAR */}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(
              'Decrease party size'
            )}
            disabled={busy || Number(party) <= 1}
            onPress={() => changeParty(-1)}
            style={({ pressed }) => [
              styles.counterButton,
              {
                opacity:
                  busy || Number(party) <= 1
                    ? 0.45
                    : pressed
                      ? 0.75
                      : 1,
              },
            ]}
          >
            <Ionicons
              name="remove"
              size={21}
              color={CREAM}
            />
          </Pressable>

          {/* CANTIDAD */}

          <Text
            style={[
              styles.counterNumber,
              { color: colors.text },
            ]}
          >
            {party}
          </Text>

          {/* BOTÓN SUMAR */}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(
              'Increase party size'
            )}
            disabled={busy || Number(party) >= 99}
            onPress={() => changeParty(1)}
            style={({ pressed }) => [
              styles.counterButton,
              {
                opacity:
                  busy || Number(party) >= 99
                    ? 0.45
                    : pressed
                      ? 0.75
                      : 1,
              },
            ]}
          >
            <Ionicons
              name="add"
              size={21}
              color={CREAM}
            />
          </Pressable>
        </View>
      </View>
    );
  }

  // ============================================
  // SOLICITAR RESERVACIÓN
  // ============================================

  async function submit() {
    if (operation.current) return;

    if (
      !table ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
      !/^[1-9]\d?$/.test(party) ||
      Number(party) > table.capacity
    ) {
      Alert.alert(
        t('Error'),
        t(
          'Check the table, party size, date and time.'
        )
      );
      return;
    }

    const data = {
      table_id: table.id,
      party_size: Number(party),
      contact_name: name.trim(),
      phone,
      starts_at: `${date}T${time}:00`,
      notes: notes.trim(),
    };

    const signature = JSON.stringify(data);

    if (
      attempt.current.signature !== signature
    ) {
      attempt.current = {
        signature,
        key:
          `${Date.now()}-` +
          Math.random().toString(36).slice(2),
      };
    }

    operation.current = true;
    setBusy(true);

    try {
      await requestReservation({
        ...data,
        request_key: attempt.current.key,
      });

      setTime('');
      setNotes('');

      attempt.current = {
        signature: '',
        key: '',
      };

      await refresh();

      Alert.alert(
        t('Reservation requested'),
        t(
          'Wait for confirmation from the restaurant.'
        )
      );
    } catch (err) {
      Alert.alert(
        t('Error'),
        err instanceof Error
          ? err.message
          : ''
      );
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  // ============================================
  // ACTUALIZAR RESERVACIÓN
  // ============================================

  async function update(
    item: Reservation,
    status: ReservationStatus
  ) {
    if (operation.current) return;

    const duration = durations[item.id];

    if (
      status === 'confirmed' &&
      (
        !/^\d+$/.test(duration || '') ||
        Number(duration) < 1 ||
        Number(duration) > 1440
      )
    ) {
      Alert.alert(
        t('Error'),
        t(
          'Enter the agreed table duration in minutes.'
        )
      );
      return;
    }

    operation.current = true;
    setBusy(true);

    try {
      await changeReservation(
        item.id,
        status,
        status === 'confirmed'
          ? Number(duration)
          : undefined,
        manager
          ? responses[item.id]
          : undefined
      );

      await refresh();
    } catch (err) {
      Alert.alert(
        t('Error'),
        err instanceof Error
          ? err.message
          : ''
      );
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  // ============================================
  // CONFIRMAR ACCIONES
  // ============================================

  function confirm(
    item: Reservation,
    status: ReservationStatus
  ) {
    Alert.alert(
      t(reservationLabels[status]),
      `${t('Table')} ${item.table.label} · ${item.contact_name}`,
      [
        {
          text: t('Cancel'),
          style: 'cancel',
        },
        {
          text: t('Confirm'),
          onPress: () =>
            void update(item, status),
        },
      ]
    );
  }

  function localTime(value: string) {
    return new Date(value).toLocaleString(
      languageLocales[preferences.language],
      {
        timeZone: 'America/Mexico_City',
      }
    );
  }

  // ============================================
  // PANTALLA PRINCIPAL
  // ============================================

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      {/* =====================================
          LÍNEA DECORATIVA DEL ENCABEZADO
          LAS ONDAS SE CONTROLAN EN _layout.tsx
      ===================================== */}

      <View
        pointerEvents="none"
        style={[
          styles.headerLine,
          {
            backgroundColor: isDark
              ? GOLD
              : TERRACOTTA,
          },
        ]}
      />

      {!allowed ? (
        <Text
          style={{
            padding: 24,
            color: colors.text,
          }}
        >
          {t(
            'You do not have permission to perform this action.'
          )}
        </Text>
      ) : (
        <ScrollView
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {/* TÍTULO */}

          <Text
            accessibilityRole="header"
            style={[
              styles.screenTitle,
              { color: colors.text },
            ]}
          >
            {t('Reservations')}
          </Text>

          <Text
            style={[
              styles.description,
              { color: colors.muted },
            ]}
          >
            {t(
              'Same-day requests are allowed. Times use Mexico City time. Confirmation is required.'
            )}
          </Text>

          {/* =====================================
              FORMULARIO DEL CLIENTE
          ===================================== */}

          {customer ? (
            <View style={panelStyle}>
              {/* NÚMERO DE PERSONAS */}

              {partySelector()}

              {/* PRIMER SEPARADOR */}

              {divider()}

              {/* SELECCIÓN DE MESA */}

              <View style={styles.fieldRow}>
                <FieldIcon
                  name="restaurant-outline"
                  isDark={isDark}
                />

                <View style={styles.fieldContent}>
                  <DiningTablePicker
                    value={table?.label || ''}
                    onChange={(_, selected) =>
                      setTable(selected)
                    }
                    partySize={Number(party) || 1}
                    disabled={busy}
                  />
                </View>
              </View>

              {/* SEGUNDO Y ÚLTIMO SEPARADOR */}

              {divider()}

              {/* =================================
                  CAMPOS SIN LÍNEAS DIVISORIAS
              ================================= */}

              <View style={styles.detailsGroup}>
                {/* NOMBRE */}

                {input(
                  'Contact name',
                  name,
                  setName,
                  false,
                  'person-outline'
                )}

                {/* TELÉFONO */}

                {input(
                  'Contact phone',
                  phone,
                  setPhone,
                  true,
                  'call-outline'
                )}

                {/* FECHA */}

                <View style={styles.fieldRow}>
                  <FieldIcon
                    name="calendar-outline"
                    isDark={isDark}
                  />

                  <View style={styles.fieldContent}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: colors.text },
                      ]}
                    >
                      {t('Date')}
                    </Text>

                    <TextInput
                      accessibilityLabel={t('Date')}
                      placeholder="AAAA-MM-DD"
                      placeholderTextColor={colors.muted}
                      value={date}
                      onChangeText={setDate}
                      editable={!busy}
                      autoCapitalize="none"
                      keyboardType="numbers-and-punctuation"
                      maxLength={10}
                      style={inputStyle}
                    />
                  </View>
                </View>

                {/* =================================
                    HORA CON SELECTOR
                ================================= */}

                <View style={styles.fieldRow}>
                  <FieldIcon
                    name="time-outline"
                    isDark={isDark}
                  />

                  <View style={styles.fieldContent}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: colors.text },
                      ]}
                    >
                      {t('Time')}
                    </Text>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('Time')}
                      accessibilityHint="Seleccionar horas y minutos"
                      disabled={busy}
                      onPress={openTimePicker}
                      style={({ pressed }) => [
                        styles.timeButton,
                        {
                          backgroundColor: colors.surface,
                          borderColor: detailColor,
                          opacity: busy
                            ? 0.5
                            : pressed
                              ? 0.8
                              : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.timeValue,
                          {
                            color: time
                              ? colors.text
                              : colors.muted,
                          },
                        ]}
                      >
                        {time || 'HH:MM (24 h)'}
                      </Text>

                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color={iconColor}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* NOTAS DE RESERVACIÓN */}

                {input(
                  'Reservation notes',
                  notes,
                  setNotes,
                  false,
                  'document-text-outline',
                  true
                )}
              </View>

              {/* AVISO */}

              <Text
                style={[
                  styles.notice,
                  { color: colors.muted },
                ]}
              >
                {t(
                  'A request does not hold the table until the restaurant confirms it.'
                )}
              </Text>

              {/* BOTÓN DE SOLICITUD */}

              <WineAction
                title={t('Request reservation')}
                icon="calendar-outline"
                isDark={isDark}
                disabled={busy || !table}
                onPress={() => void submit()}
              />
            </View>
          ) : null}

          {/* =====================================
              CARGA Y ERRORES
          ===================================== */}

          {loading ? (
            <ActivityIndicator
              color={colors.accent}
            />
          ) : null}

          {error ? (
            <>
              <Text
                style={{
                  color: colors.accent,
                }}
              >
                {error}
              </Text>

              <WineAction
                title={t('Retry')}
                isDark={isDark}
                onPress={() => void refresh()}
              />
            </>
          ) : null}

          {!loading && !items.length ? (
            <Text style={{ color: colors.muted }}>
              {t('No reservations yet.')}
            </Text>
          ) : null}

          {/* =====================================
              LISTA DE RESERVACIONES
          ===================================== */}

          {items.map((item) => (
            <View
              key={item.id}
              style={panelStyle}
            >
              <Text
                style={[
                  styles.reservationTitle,
                  { color: colors.text },
                ]}
              >
                #{item.id} · {t('Table')}{' '}
                {item.table.label} ·{' '}
                {t(
                  item.table.zone === 'terrace'
                    ? 'Terrace'
                    : 'Dining room'
                )}
              </Text>

              <Text style={{ color: colors.text }}>
                {item.party_size} {t('people')} ·{' '}
                {localTime(item.starts_at)}
              </Text>

              {item.ends_at ? (
                <Text style={{ color: colors.muted }}>
                  {t('Until')}{' '}
                  {localTime(item.ends_at)}
                </Text>
              ) : null}

              <Text
                style={{
                  color: colors.accent,
                  fontWeight: '700',
                }}
              >
                {t(reservationLabels[item.status])}
              </Text>

              {manager ? (
                <Text style={{ color: colors.text }}>
                  {item.contact_name} · {item.phone}
                </Text>
              ) : null}

              {item.notes ? (
                <Text style={{ color: colors.text }}>
                  {item.notes}
                </Text>
              ) : null}

              {item.response_note ? (
                <Text style={{ color: colors.text }}>
                  {t('Restaurant response')}:{' '}
                  {item.response_note}
                </Text>
              ) : null}

              {/* ACCIONES DEL ADMINISTRADOR */}

              {manager && item.status === 'pending' ? (
                <>
                  {input(
                    'Agreed duration (minutes)',
                    durations[item.id] || '',
                    (value) =>
                      setDurations((current) => ({
                        ...current,
                        [item.id]: value,
                      })),
                    true,
                    'time-outline'
                  )}

                  {input(
                    'Restaurant response',
                    responses[item.id] || '',
                    (value) =>
                      setResponses((current) => ({
                        ...current,
                        [item.id]: value,
                      })),
                    false,
                    'document-text-outline'
                  )}

                  <WineAction
                    title={t('Confirm reservation')}
                    icon="checkmark-circle-outline"
                    isDark={isDark}
                    disabled={busy}
                    onPress={() =>
                      confirm(item, 'confirmed')
                    }
                  />

                  <WineAction
                    title={t('Reject reservation')}
                    icon="close-circle-outline"
                    isDark={isDark}
                    disabled={busy}
                    onPress={() =>
                      confirm(item, 'rejected')
                    }
                  />
                </>
              ) : null}

              {manager &&
              item.status === 'confirmed' ? (
                <WineAction
                  title={t('Mark arrival')}
                  icon="checkmark-circle-outline"
                  isDark={isDark}
                  disabled={busy}
                  onPress={() =>
                    confirm(item, 'arrived')
                  }
                />
              ) : null}

              {manager &&
              item.status === 'arrived' ? (
                <WineAction
                  title={t('Complete reservation')}
                  icon="checkmark-done-outline"
                  isDark={isDark}
                  disabled={busy}
                  onPress={() =>
                    confirm(item, 'completed')
                  }
                />
              ) : null}

              {['pending', 'confirmed'].includes(
                item.status
              ) ? (
                <WineAction
                  title={t('Cancel reservation')}
                  icon="close-circle-outline"
                  isDark={isDark}
                  disabled={busy}
                  onPress={() =>
                    confirm(item, 'cancelled')
                  }
                />
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}

      {/* =====================================
          SELECTOR DE HORA PARA IPHONE
          ADAPTADO A AMBOS MODOS
      ===================================== */}

      {Platform.OS === 'ios' ? (
        <Modal
          visible={showTimePicker}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={cancelTime}
        >
          <View style={styles.timeModalOverlay}>
            <View
              style={[
                styles.timeModalCard,
                {
                  backgroundColor: isDark
                    ? '#30211B'
                    : '#FFF9F0',
                  borderColor: detailColor,
                },
              ]}
            >
              {/* TÍTULO DEL MODAL */}

              <View style={styles.timeModalHeader}>
                <View
                  style={[
                    styles.timeModalIcon,
                    {
                      backgroundColor: isDark
                        ? DARK_ICON_BG
                        : LIGHT_SOFT,
                    },
                  ]}
                >
                  <Ionicons
                    name="time-outline"
                    size={24}
                    color={iconColor}
                  />
                </View>

                <Text
                  style={[
                    styles.timeModalTitle,
                    { color: colors.text },
                  ]}
                >
                  {t('Time')}
                </Text>
              </View>

              {/* RUEDA DE HORAS Y MINUTOS */}

              <DateTimePicker
                value={draftTime}
                mode="time"
                display="spinner"
                is24Hour={true}
                locale="en_GB"
                themeVariant={
                  isDark ? 'dark' : 'light'
                }
                textColor={
                  isDark ? CREAM : '#33231E'
                }
                onChange={(_, selected) => {
                  if (selected) {
                    setDraftTime(selected);
                  }
                }}
                style={styles.timePicker}
              />

              {/* HORA SELECCIONADA */}

              <Text
                style={[
                  styles.timePreview,
                  { color: iconColor },
                ]}
              >
                {formatTime(draftTime)}
              </Text>

              {/* BOTONES */}

              <View style={styles.timeModalActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={cancelTime}
                  style={[
                    styles.timeCancelButton,
                    {
                      borderColor: detailColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.timeCancelText,
                      { color: iconColor },
                    ]}
                  >
                    {t('Cancel')}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={confirmTime}
                  style={[
                    styles.timeConfirmButton,
                    {
                      borderColor: detailColor,
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark"
                    size={19}
                    color={CREAM}
                  />

                  <Text style={styles.timeConfirmText}>
                    {t('Confirm')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

// ============================================
// ESTILOS GENERALES
// ============================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 18,
  },

  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
  },

  headerLine: {
    width: '100%',
    height: 2,
    backgroundColor: GOLD,
  },

  panel: {
    padding: 16,
    borderRadius: 20,
    gap: 16,
  },


  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
  },

  fieldContent: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },

  fieldLabel: {
    fontSize: 15,
    lineHeight: 20,
  },

  // ============================================
  // ICONOS CIRCULARES
  // ============================================

  fieldIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: DARK_ICON_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  // ============================================
  // SEPARADORES
  // ============================================

  divider: {
    height: 1,
    width: '100%',
    backgroundColor: GOLD,
    marginVertical: 3,
  },

  detailsGroup: {
    gap: 18,
    width: '100%',
  },

  // ============================================
  // ENTRADAS DE TEXTO
  // ============================================

  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 13,
    fontSize: 16,
    width: '100%',
  },

  multilineInput: {
    minHeight: 100,
    paddingTop: 12,
  },

  // ============================================
  // BOTÓN SELECTOR DE HORA
  // ============================================

  timeButton: {
    minHeight: 50,
    borderWidth: 1.5,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
  },

  timeValue: {
    fontSize: 16,
    flex: 1,
  },

  // ============================================
  // CONTADOR DE PERSONAS
  // ============================================

  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
  },

  partyLabel: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    flexShrink: 1,
  },

  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: WINE,
    borderWidth: 1.5,
    borderColor: TERRACOTTA,
    alignItems: 'center',
    justifyContent: 'center',
  },

  counterNumber: {
    fontSize: 20,
    fontWeight: '700',
    minWidth: 22,
    textAlign: 'center',
  },

  // ============================================
  // AVISO
  // ============================================

  notice: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },

  // ============================================
  // BOTONES COLOR VINO
  // ============================================

  actionButton: {
    backgroundColor: WINE,
    borderRadius: 999,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: GOLD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  actionText: {
    color: CREAM,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },

  // ============================================
  // TARJETAS DE RESERVACIONES
  // ============================================

  reservationTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 27,
  },

  // ============================================
  // MODAL DE SELECCIÓN DE HORA
  // ============================================

  timeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  timeModalCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 18,
    overflow: 'hidden',
  },

  timeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },

  timeModalIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  timeModalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },

  timePicker: {
    width: '100%',
    height: 200,
  },

  timePreview: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },

  timeModalActions: {
    flexDirection: 'row',
    gap: 12,
  },

  timeCancelButton: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1.5,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  timeCancelText: {
    fontSize: 15,
    fontWeight: '700',
  },

  timeConfirmButton: {
    flex: 1,
    minHeight: 46,
    backgroundColor: WINE,
    borderWidth: 1.5,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 12,
  },

  timeConfirmText: {
    color: CREAM,
    fontSize: 15,
    fontWeight: '700',
  },
});
