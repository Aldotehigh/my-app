import { usePreferences } from '../context/PreferencesContext';
import type { RestaurantColors } from '../constants/restaurantColors';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

interface CardProps {
  title: string;
  image: string | null;
  description: string | null;
  backgroundColor?: string;
  price: string;
  isAvailable: boolean;
  onPress?: () => void;
}

export default function Card({
  title,
  image,
  description,
  backgroundColor,
  price,
  isAvailable,
  onPress,
}: CardProps) {
  const { colors, t } = usePreferences();
  const styles = createStyles(colors);
  const { fontScale } = useWindowDimensions();

  const [failedImage, setFailedImage] = useState<string | null>(null);
  const hasImage = Boolean(image && failedImage !== image);

  return (
    <Pressable
      onPress={onPress}
      accessible
      accessibilityLabel={[
        title,
        description,
        `${t('Price')}: ${price} ${t('Mexican pesos')}`,
        t(isAvailable ? 'Available' : 'Sold out'),
      ].filter(Boolean).join('. ')}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityHint={onPress ? t("Opens dish details") : undefined}
      style={({ pressed }) => [
        styles.card,
        backgroundColor ? { backgroundColor } : null,
        pressed && onPress ? styles.pressed : null,
      ]}
    >
      {hasImage && image ? (
        <Image
          accessible={false}
          source={{ uri: image }}
          style={styles.image}
          onError={() => setFailedImage(image)}
        />
      ) : null}

      <View style={styles.content}>
        <View
          style={[
            styles.badge,
            isAvailable ? styles.availableBadge : styles.unavailableBadge,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              isAvailable ? styles.availableText : styles.unavailableText,
            ]}
          >
            {isAvailable ? t("Available") : t("Sold out")}
          </Text>
        </View>

        <Text style={styles.title}>{title}</Text>

        {description?.trim() ? (
          <Text style={styles.description} numberOfLines={fontScale > 1.2 ? undefined : 2}>
            {description}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.price}>
            ${price} <Text style={styles.currency}>MXN</Text>
          </Text>

          {onPress ? <Text style={styles.detailLink}>{t("View details ›")}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: RestaurantColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    resizeMode: 'cover',
    backgroundColor: colors.border,
  },
  content: {
    padding: 18,
    gap: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  availableBadge: {
    backgroundColor: colors.successBackground,
  },
  unavailableBadge: {
    backgroundColor: colors.soft,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  availableText: {
    color: colors.olive,
  },
  unavailableText: {
    color: colors.accent,
  },
  title: {
    fontSize: 23,
    fontWeight: '700',
    color: colors.text,
  },
  description: {
    fontSize: 15,
    color: colors.muted,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  price: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.accent,
  },
  currency: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
});