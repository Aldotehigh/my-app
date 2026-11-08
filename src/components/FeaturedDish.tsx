import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { CardItem } from '../types/CardItem';
import { usePreferences } from '../context/PreferencesContext';
import { getCardSummary } from '../utils/cardPresentations';
import { restaurantBrand } from '../constants/restaurantBrand';

export function FeaturedDish({ card, onPress }: { card: CardItem; onPress: () => void }) {
  const { t } = usePreferences();
  const summary = getCardSummary(card);
  const [failed, setFailed] = useState(false);
  return (
    <Pressable accessibilityRole="button"
      accessibilityLabel={t('Discover a dish') + '. ' + summary.title + '. ' + summary.price + ' MXN'}
      onPress={onPress} style={styles.panel}
    >
      {summary.image && !failed ? <Image accessible={false} source={{ uri: summary.image }} style={styles.image} onError={() => setFailed(true)} /> : null}
      <View style={styles.shade} />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>{t('DISCOVER')}</Text>
        <Text style={styles.title} numberOfLines={3}>{summary.title}</Text>
        <View style={styles.rule} />
        <Text style={styles.price}>{summary.showStartingPrice ? t('From') + ' ' : ''}${summary.price} <Text style={{ fontSize: 11 }}>MXN</Text></Text>
        <View style={styles.link}><Text style={styles.linkText}>{t('View details ›')}</Text></View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { minHeight: 195, backgroundColor: '#211914', borderRadius: 18, overflow: 'hidden', marginTop: 22, marginBottom: 8 },
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', resizeMode: 'cover' },
  shade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(14, 9, 6, 0.62)' },
  content: { padding: 22, alignItems: 'flex-start', gap: 9 },
  eyebrow: { fontSize: 9, letterSpacing: 2.5, color: restaurantBrand.gold, fontWeight: '700' },
  title: { fontSize: 29, lineHeight: 33, fontFamily: restaurantBrand.serif, color: restaurantBrand.cream, maxWidth: '82%' },
  rule: { width: 28, height: 1, backgroundColor: restaurantBrand.gold, marginVertical: 3 },
  price: { fontSize: 23, fontFamily: restaurantBrand.serif, color: restaurantBrand.gold },
  link: { borderRadius: 22, backgroundColor: '#79251F', paddingHorizontal: 17, minHeight: 38, justifyContent: 'center', marginTop: 2 },
  linkText: { color: restaurantBrand.cream, fontSize: 13, fontFamily: restaurantBrand.serif },
});
