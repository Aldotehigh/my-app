import { languageLocales } from '../utils/preferenceStorage';
import { Text, View } from 'react-native';
import { usePreferences } from '../context/PreferencesContext';
import type { TableOrder } from '../services/tableOrders';

export function deliveryReady(order: TableOrder) {
  const available = order.lines.filter((item) => item.status !== 'declined');
  return available.some((item) => item.status === 'ready') && available.every((item) => ['ready', 'served'].includes(item.status));
}

function customerStatus(order: TableOrder) {
  const available = order.lines.filter((item) => item.status !== 'declined');
  if (!available.length || order.delivery_status === 'rejected') return 'Order declined';
  const delivery = order.fulfillment === 'delivery';
  const pickup = order.fulfillment === 'pickup';
  if (available.every((item) => item.status === 'served')) {
    return delivery ? 'Delivered' : pickup ? 'Picked up' : 'Served at your table';
  }
  if (delivery && order.dispatched_at) return 'On the way';
  if (available.every((item) => item.status === 'ready' || item.status === 'served')) {
    if (delivery) return order.delivery_status === 'accepted' ? 'Ready to dispatch' : 'Ready · address confirmation pending';
    return pickup ? 'Ready for pickup' : 'Ready to serve';
  }
  if (available.some((item) => ['preparing', 'ready', 'served'].includes(item.status))) return 'Preparing your order';
  if (available.some((item) => item.status === 'review')) return 'Restaurant reviewing your order';
  return 'Order received';
}

export function CustomerOrderCard({ order }: { order: TableOrder }) {
  const { colors, t, preferences } = usePreferences();
  const location = order.fulfillment === 'delivery' ? t('Home delivery') : order.fulfillment === 'pickup' ? t('For pickup') : t('Table') + ' ' + (order.table ?? '');
  const date = new Date(order.created_at).toLocaleString(languageLocales[preferences.language], { timeZone: 'America/Mexico_City', dateStyle: 'medium', timeStyle: 'short' });
  return <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 12 }}>
    <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 21, fontWeight: '700' }}>{t('Order')} #{order.id} · {location}</Text>
    <Text style={{ color: colors.muted }}>{date}</Text>
    <View style={{ backgroundColor: colors.soft, padding: 12, borderRadius: 12 }}>
      <Text accessibilityLiveRegion="polite" style={{ color: colors.text, fontWeight: '700' }}>{t(customerStatus(order))}</Text>
    </View>
    {order.lines.map((line) => <View key={line.id} style={{ gap: 4 }}>
      <Text style={{ color: colors.text }}>{line.quantity} × {t(line.title)}</Text>
      {line.status === 'declined' ? <Text style={{ color: colors.muted }}>{t('Item unavailable')}</Text> : null}
      {(line.selections ?? []).length > 0 ? <Text style={{ color: colors.muted }}>{line.selections!.map(t).join(', ')}</Text> : null}
      {line.removals.length > 0 ? <Text style={{ color: colors.muted }}>{t('Without')} {line.removals.map(t).join(', ')}</Text> : null}
      {line.allergy ? <Text style={{ color: colors.muted }}>{t('Your allergy note')}: {line.allergy}</Text> : null}
    </View>)}
    {order.pricing ? <View style={{ gap: 4 }}>
      {Number(order.pricing.discount) > 0 ? <Text style={{ color: colors.olive }}>{t('Monday 2-for-1 discount')} · −${Number(order.pricing.discount).toFixed(2)} MXN</Text> : null}
      <Text style={{ color: colors.text, fontWeight: '700' }}>{t(order.pricing.paid ? 'Paid consumption' : 'Amount to pay')} · ${Number(order.pricing.total).toFixed(2)} MXN</Text>
    </View> : null}
  </View>;
}
