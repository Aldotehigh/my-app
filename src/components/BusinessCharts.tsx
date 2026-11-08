import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BusinessSummary } from '../services/business';
import { usePreferences } from '../context/PreferencesContext';

const money = (value: number | string) => '$' + Number(value).toFixed(2);

export function BusinessCharts({ summary }: { summary: BusinessSummary }) {
  const { colors, t } = usePreferences();
  const panel = [styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }];
  const dailyMax = Math.max(1, ...summary.daily.map((day) => Number(day.total)));
  const products = summary.products.slice(0, 5);
  const productMax = Math.max(1, ...products.map((product) => product.units));
  const cash = Number(summary.cash);
  const card = Number(summary.card);
  const collected = cash + card;

  return (
    <View style={{ gap: 16 }}>
      <View style={panel}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{t('Sales by day')}</Text>
        <Text style={{ color: colors.muted }}>{t('Taller bars mean more food and drink sales. Tips are shown separately.')} {t('Days with recorded sales in the selected period.')}</Text>
        {!summary.daily.length ? <Text style={{ color: colors.muted }}>{t('Your chart will appear after the first recorded payment.')}</Text> : (
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ gap: 12, paddingVertical: 12 }}>
            {summary.daily.map((day) => (
              <View key={day.date} accessible accessibilityLabel={day.date + '. ' + money(day.total) + '. ' + day.orders + ' ' + t('Paid orders')} style={styles.day}>
                <Text style={{ color: colors.text, fontSize: 11 }}>{money(day.total)}</Text>
                <View style={{ height: 120, justifyContent: 'flex-end' }}>
                  <View style={{ width: 30, height: Math.max(2, Number(day.total) / dailyMax * 120), borderRadius: 6, backgroundColor: colors.accent }} />
                </View>
                <Text style={{ color: colors.muted, fontSize: 11 }}>{day.date.slice(5)}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
      <View style={panel}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{t('How customers paid')}</Text>
        <Text style={{ color: colors.muted }}>{t('Cash and card amounts include collected tips.')}</Text>
        {collected ? (
          <View accessible accessibilityLabel={t('Cash') + ' ' + money(cash) + '. ' + t('Card') + ' ' + money(card)}
            style={{ flexDirection: 'row', height: 24, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.soft }}>
            {cash > 0 ? <View style={{ flex: cash, backgroundColor: colors.accent }} /> : null}
            {card > 0 ? <View style={{ flex: card, backgroundColor: colors.olive }} /> : null}
          </View>
        ) : <Text style={{ color: colors.muted }}>{t('No recorded sales in this period.')}</Text>}
        <Text style={{ color: colors.accent }}>{t('Cash')} · {money(cash)} · {collected ? Math.round(cash / collected * 100) : 0}%</Text>
        <Text style={{ color: colors.olive }}>{t('Card')} · {money(card)} · {collected ? Math.round(card / collected * 100) : 0}%</Text>
        <Text style={{ color: colors.text }}>{t('Total collected')} · {money(summary.collected_total)} MXN</Text>
      </View>
      <View style={panel}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{t('Top five products')}</Text>
        <Text style={{ color: colors.muted }}>{t('The longest bar is the product with the most units sold.')}</Text>
        {products.map((product, index) => (
          <View key={index} style={{ gap: 5 }} accessible accessibilityLabel={product.title + '. ' + product.units + ' ' + t('Units')}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <Text style={{ color: colors.text, flex: 1 }}>{index + 1}. {product.title}</Text>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{product.units}</Text>
            </View>
            <View style={{ height: 10, backgroundColor: colors.soft, borderRadius: 5 }}>
              <View style={{ height: 10, width: `${product.units / productMax * 100}%`, backgroundColor: colors.accent, borderRadius: 5 }} />
            </View>
          </View>
        ))}
        {!products.length ? <Text style={{ color: colors.muted }}>{t('Your chart will appear after the first recorded payment.')}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 16, gap: 12, borderRadius: 18, borderWidth: 1 },
  title: { fontSize: 21, fontWeight: '700' },
  day: { alignItems: 'center', justifyContent: 'flex-end', gap: 6, minWidth: 64 },
});
