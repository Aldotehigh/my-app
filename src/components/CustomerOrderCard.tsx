
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { languageLocales } from '../utils/preferenceStorage';
import { Text, View, StyleSheet } from 'react-native';
import { usePreferences } from '../context/PreferencesContext';
import type { TableOrder } from '../services/tableOrders';

const GOLD = '#D8B067';
const WINE = '#801C18';
const TERRACOTTA = '#A34437';
const LIGHT_SOFT = '#F2DDD2';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

// =============================================
// COMPROBAR SI EL PEDIDO ESTÁ LISTO
// =============================================

export function deliveryReady(order: TableOrder) {
  const available = order.lines.filter(
    (item) => item.status !== 'declined'
  );

  return (
    available.some((item) => item.status === 'ready') &&
    available.every((item) =>
      ['ready', 'served'].includes(item.status)
    )
  );
}

// =============================================
// ESTADO ACTUAL DEL PEDIDO
// =============================================

function customerStatus(order: TableOrder) {
  const available = order.lines.filter(
    (item) => item.status !== 'declined'
  );

  if (!available.length || order.delivery_status === 'rejected') {
    return 'Order declined';
  }

  const delivery = order.fulfillment === 'delivery';
  const pickup = order.fulfillment === 'pickup';

  if (available.every((item) => item.status === 'served')) {
    return delivery
      ? 'Delivered'
      : pickup
        ? 'Picked up'
        : 'Served at your table';
  }

  if (delivery && order.dispatched_at) {
    return 'On the way';
  }

  if (
    available.every(
      (item) => item.status === 'ready' || item.status === 'served'
    )
  ) {
    if (delivery) {
      return order.delivery_status === 'accepted'
        ? 'Ready to dispatch'
        : 'Ready · address confirmation pending';
    }

    return pickup ? 'Ready for pickup' : 'Ready to serve';
  }

  if (
    available.some((item) =>
      ['preparing', 'ready', 'served'].includes(item.status)
    )
  ) {
    return 'Preparing your order';
  }

  if (available.some((item) => item.status === 'review')) {
    return 'Restaurant reviewing your order';
  }

  return 'Order received';
}

// =============================================
// ICONOS SEGÚN EL TIPO DE PEDIDO
// =============================================

function orderIcon(order: TableOrder): IconName {
  if (order.fulfillment === 'delivery') {
    return 'bike';
  }

  if (order.fulfillment === 'pickup') {
    return 'shopping-outline';
  }

  return 'silverware-fork-knife';
}

// =============================================
// COLORES ORIGINALES DE LOS ESTADOS
// SE CONSERVAN EN MODO CLARO Y OSCURO
// =============================================

function statusAppearance(status: string): {
  icon: IconName;
  background: string;
  border: string;
  text: string;
} {
  switch (status) {
    // VERDE: ENTREGADO

    case 'Delivered':
    case 'Picked up':
      return {
        icon: 'check',
        background: '#344718',
        border: '#62832B',
        text: '#E4F4C7',
      };

    // ÁMBAR: SERVIDO EN MESA

    case 'Served at your table':
      return {
        icon: 'room-service-outline',
        background: '#704A16',
        border: '#B78232',
        text: '#FFE3AC',
      };

    // ÁMBAR: LISTO

    case 'Ready for pickup':
    case 'Ready to serve':
    case 'Ready to dispatch':
      return {
        icon: 'check-circle-outline',
        background: '#704A16',
        border: '#B78232',
        text: '#FFE3AC',
      };

    // ROJO: RECHAZADO

    case 'Order declined':
      return {
        icon: 'alert-circle-outline',
        background: '#501B19',
        border: '#A6372D',
        text: '#FFC0B5',
      };

    // OTROS ESTADOS

    case 'On the way':
      return {
        icon: 'motorbike',
        background: '#42351D',
        border: GOLD,
        text: '#F5D89F',
      };

    case 'Preparing your order':
      return {
        icon: 'chef-hat',
        background: '#42351D',
        border: GOLD,
        text: '#F5D89F',
      };

    case 'Restaurant reviewing your order':
      return {
        icon: 'clipboard-check-outline',
        background: '#42351D',
        border: GOLD,
        text: '#F5D89F',
      };

    default:
      return {
        icon: 'clock-outline',
        background: '#42351D',
        border: GOLD,
        text: '#F5D89F',
      };
  }
}

// =============================================
// TARJETA DEL PEDIDO
// =============================================

export function CustomerOrderCard({
  order,
}: {
  order: TableOrder;
}) {
  const { colors, t, preferences, isDark } = usePreferences();

  const location =
    order.fulfillment === 'delivery'
      ? t('Home delivery')
      : order.fulfillment === 'pickup'
        ? t('For pickup')
        : t('Table') + ' ' + (order.table ?? '');

  const date = new Date(order.created_at).toLocaleString(
    languageLocales[preferences.language],
    {
      timeZone: 'America/Mexico_City',
      dateStyle: 'medium',
      timeStyle: 'short',
    }
  );

  const status = customerStatus(order);
  const appearance = statusAppearance(status);

  const allergyNotes = [
    ...new Set(
      order.lines
        .map((line) => line.allergy?.trim())
        .filter((note): note is string => Boolean(note))
    ),
  ];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: isDark ? GOLD : TERRACOTTA,
        },
      ]}
    >
      {/* =====================================
          ENCABEZADO DEL PEDIDO
      ===================================== */}

      <View style={styles.headerRow}>
        {/* ICONOS EN AMBOS MODOS */}

        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isDark
                ? '#281810'
                : LIGHT_SOFT,
              borderColor: isDark
                ? '#A77B38'
                : TERRACOTTA,
            },
          ]}
        >
          {order.fulfillment === 'delivery' ||
          order.fulfillment === 'pickup' ? (
            <MaterialCommunityIcons
              name={orderIcon(order)}
              size={30}
              color={isDark ? GOLD : WINE}
            />
          ) : (
            <Ionicons
              name="restaurant-outline"
              size={30}
              color={isDark ? GOLD : WINE}
            />
          )}
        </View>

        <View style={styles.headerContent}>
          {/* TÍTULO */}

          <Text
            accessibilityRole="header"
            style={[
              styles.title,
              { color: colors.text },
            ]}
          >
            {t('Order')} #{order.id} · {location}
          </Text>

          {/* FECHA CON CALENDARIO */}

          <View style={styles.dateRow}>
            <Ionicons
              name="calendar"
              size={19}
              color={isDark ? GOLD : WINE}
            />

            <Text
              style={{
                color: colors.muted,
                fontSize: 14,
              }}
            >
              {date}
            </Text>
          </View>

          {/* =====================================
              ESTADO ORIGINAL CON SUS COLORES
              VERDE / ÁMBAR / ROJO
          ===================================== */}

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: appearance.background,
                borderColor: appearance.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={appearance.icon}
              size={21}
              color={appearance.text}
            />

            <Text
              accessibilityLiveRegion="polite"
              style={[
                styles.statusText,
                {
                  color: appearance.text,
                },
              ]}
            >
              {t(status)}
            </Text>
          </View>
        </View>
      </View>

      {/* =====================================
          SEPARADOR ADAPTADO AL TEMA
      ===================================== */}

      <View
        style={[
          styles.divider,
          {
            backgroundColor: isDark
              ? 'rgba(216,176,103,0.30)'
              : 'rgba(163,68,55,0.25)',
          },
        ]}
      />

      {/* =====================================
          PRODUCTOS DEL PEDIDO
      ===================================== */}

      <View style={styles.products}>
        {order.lines.map((line) => (
          <View
            key={line.id}
            style={styles.productItem}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
              }}
            >
              {line.quantity} × {t(line.title)}
            </Text>

            {line.status === 'declined' ? (
              <Text style={{ color: colors.muted }}>
                {t('Item unavailable')}
              </Text>
            ) : null}

            {/* MODIFICACIONES DE INGREDIENTES */}

            {(line.selections ?? []).map(
              (selection, index) => (
                <View
                  key={`selection-${line.id}-${index}`}
                  style={[
                    styles.selectionRow,
                    {
                      borderLeftColor: isDark
                        ? 'rgba(216,176,103,0.35)'
                        : 'rgba(163,68,55,0.30)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.selectionArrow,
                      {
                        color: isDark ? GOLD : WINE,
                      },
                    ]}
                  >
                    ↳
                  </Text>

                  <Text
                    style={[
                      styles.selectionText,
                      {
                        color: colors.muted,
                      },
                    ]}
                  >
                    {t(selection)}
                  </Text>
                </View>
              )
            )}

            {/* INGREDIENTES ELIMINADOS */}

            {line.removals.map((removal, index) => (
              <View
                key={`removal-${line.id}-${index}`}
                style={[
                  styles.selectionRow,
                  {
                    borderLeftColor: isDark
                      ? 'rgba(216,176,103,0.35)'
                      : 'rgba(163,68,55,0.30)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.selectionArrow,
                    {
                      color: isDark ? GOLD : WINE,
                    },
                  ]}
                >
                  ↳
                </Text>

                <Text
                  style={[
                    styles.selectionText,
                    {
                      color: colors.muted,
                    },
                  ]}
                >
                  {t('Without')} {t(removal)}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* =====================================
          TOTAL CON ICONO DE TICKET
      ===================================== */}

      {order.pricing ? (
        <View style={{ gap: 8 }}>
          {/* DESCUENTO */}

          {Number(order.pricing.discount) > 0 ? (
            <Text
              style={{
                color: colors.olive,
                fontWeight: '600',
              }}
            >
              {t('Monday 2-for-1 discount')} ·
              {' '}−${Number(
                order.pricing.discount
              ).toFixed(2)} MXN
            </Text>
          ) : null}

          {/* TOTAL */}

          <View
            style={[
              styles.totalBar,
              {
                backgroundColor: isDark
                  ? 'rgba(154,105,39,0.23)'
                  : LIGHT_SOFT,
                borderColor: isDark
                  ? '#8C612B'
                  : TERRACOTTA,
              },
            ]}
          >
            <Ionicons
              name="receipt"
              size={25}
              color={isDark ? GOLD : WINE}
            />

            <Text
              style={[
                styles.totalText,
                {
                  color: isDark ? '#F2C77E' : WINE,
                },
              ]}
            >
              {t(
                order.pricing.paid
                  ? 'Paid consumption'
                  : 'Amount to pay'
              )}: ${Number(
                order.pricing.total
              ).toFixed(2)} MXN
            </Text>
          </View>
        </View>
      ) : null}

      {/* =====================================
          ALERTA DE ALERGIAS
      ===================================== */}

      {allergyNotes.length > 0 ? (
        <View
          style={[
            styles.allergyAlert,
            {
              backgroundColor: isDark
                ? 'rgba(128,28,24,0.24)'
                : '#F8E4DF',
              borderColor: isDark
                ? '#A62E24'
                : TERRACOTTA,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="alert-outline"
            size={24}
            color={isDark ? '#FF977F' : WINE}
          />

          <Text
            style={[
              styles.allergyText,
              {
                color: isDark ? '#FFC7AC' : WINE,
              },
            ]}
          >
            <Text style={{ fontWeight: '800' }}>
              {t('Your allergy note')}:
            </Text>
            {' '}
            {allergyNotes.join('; ')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// =============================================
// ESTILOS
// =============================================

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 14,
    overflow: 'hidden',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#A77B38',
    backgroundColor: '#281810',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerContent: {
    flex: 1,
    gap: 8,
  },

  title: {
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 27,
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  // ESTADOS CON COLORES ORIGINALES

  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.2,
    borderRadius: 18,
    paddingVertical: 7,
    paddingHorizontal: 12,
    minHeight: 36,
  },

  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(216,176,103,0.30)',
    marginTop: 2,
  },

  products: {
    gap: 13,
  },

  productItem: {
    gap: 4,
  },

  selectionRow: {
    marginLeft: 8,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(216,176,103,0.35)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },

  selectionArrow: {
    color: GOLD,
    fontSize: 17,
    lineHeight: 21,
  },

  selectionText: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 21,
  },

  totalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#8C612B',
    backgroundColor: 'rgba(154,105,39,0.23)',
  },

  totalText: {
    color: '#F2C77E',
    flex: 1,
    fontWeight: '700',
    fontSize: 15,
  },

  allergyAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 13,
    borderWidth: 1.3,
    borderColor: '#A62E24',
    backgroundColor: 'rgba(128,28,24,0.24)',
  },

  allergyText: {
    flex: 1,
    color: '#FFC7AC',
    fontSize: 14,
    lineHeight: 20,
  },
});
