
import { japaneseDescription } from '../utils/japaneseMenu';
import { restaurantBrand } from '../constants/restaurantBrand';
import { usePreferences } from '../context/PreferencesContext';
import type { RestaurantColors } from '../constants/restaurantColors';
import { useState } from 'react';

import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

interface CardProps {
  compact?: boolean;
  title: string;
  image: string | null;
  description: string | null;
  englishDescription?: string;
  backgroundColor?: string;
  price: string;
  showStartingPrice?: boolean;
  isAvailable: boolean;
  onPress?: () => void;
}

export default function Card({
  compact = false,
  title,
  image,
  description: originalDescription,
  englishDescription,
  backgroundColor,
  price,
  showStartingPrice = false,
  isAvailable,
  onPress,
}: CardProps) {
  const { colors, t, preferences, isDark } = usePreferences();

  const japanese =
    preferences.language === 'ja'
      ? japaneseDescription(originalDescription)
      : undefined;

  const description =
    japanese ??
    (preferences.language !== 'es'
      ? englishDescription?.trim() || originalDescription
      : originalDescription);

  const styles = createStyles(colors, isDark);

  const { fontScale } = useWindowDimensions();

  const [failedImage, setFailedImage] =
    useState<string | null>(null);

  const hasImage = Boolean(
    image && failedImage !== image
  );

  return (
    <Pressable
      onPress={onPress}
      accessible
      accessibilityLabel={[
        t(title),
        description,
        `${t(showStartingPrice ? 'From' : 'Price')}: ${price} ${t('Mexican pesos')}`,
        t(isAvailable ? 'Available' : 'Sold out'),
      ]
        .filter(Boolean)
        .join('. ')}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityHint={
        onPress ? t('Opens dish details') : undefined
      }
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
          style={[
            styles.image,
            compact && styles.compactImage,
          ]}
          onError={() => setFailedImage(image)}
        />
      ) : (
        <View
          style={[
            styles.image,
            styles.placeholder,
          ]}
        >
          <Text style={styles.placeholderText}>
            ❖
          </Text>
        </View>
      )}

      <View
        style={[
          styles.content,
          compact && styles.compactContent,
        ]}
      >
        <View
          style={[
            styles.badge,
            isAvailable
              ? styles.availableBadge
              : styles.unavailableBadge,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              isAvailable
                ? styles.availableText
                : styles.unavailableText,
            ]}
          >
            {isAvailable
              ? t('Available')
              : t('Sold out')}
          </Text>
        </View>

        <Text
          style={[
            styles.title,
            compact && styles.compactTitle,
          ]}
        >
          {t(title)}
        </Text>

        {description?.trim() ? (
          <Text
            style={[
              styles.description,
              compact && styles.compactDescription,
            ]}
            numberOfLines={
              fontScale > 1.2 ? undefined : 2
            }
          >
            {description}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <Text
            style={[
              styles.price,
              compact && styles.compactPrice,
            ]}
          >
            {showStartingPrice
              ? t('From') + ' '
              : ''}
            ${price}{' '}
            <Text style={styles.currency}>
              MXN
            </Text>
          </Text>

          {onPress ? (
            <Text
              accessible={false}
              style={
                compact
                  ? styles.openCircle
                  : styles.detailLink
              }
            >
              {compact
                ? '›'
                : t('View details ›')}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

// =============================================
// CARD STYLES
// =============================================

const createStyles = (
  colors: RestaurantColors,
  isDark: boolean
) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },

    compactImage: {
      aspectRatio: 1.5,
    },

    compactContent: {
      padding: 11,
      gap: 7,
    },

    compactTitle: {
      fontSize: 18,
      lineHeight: 23,
      fontWeight: '600',
    },

    compactDescription: {
      fontSize: 12,
      lineHeight: 17,
    },

    compactPrice: {
      fontSize: 17,
      fontWeight: '600',
      fontFamily: restaurantBrand.serif,
    },

    placeholder: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.soft,
    },

    placeholderText: {
      color: colors.accent,
      fontSize: 35,
    },

    // Circular detail button
    openCircle: {
      width: 28,
      height: 28,
      textAlign: 'center',
      lineHeight: 27,
      borderRadius: 14,
      overflow: 'hidden',

      color: colors.onAccent,

      backgroundColor: isDark
        ? '#801C18'
        : colors.accent,

      fontSize: 19,

      borderTopWidth: isDark ? 1 : 0,
      borderTopColor: '#A34437',

      borderBottomWidth: isDark ? 1 : 0,
      borderBottomColor: '#9B392A',

      borderLeftWidth: isDark ? 0.5 : 0,
      borderRightWidth: isDark ? 0.5 : 0,
      borderLeftColor: '#84241D',
      borderRightColor: '#84241D',
    },

    pressed: {
      opacity: 0.85,
    },

    image: {
      width: '100%',
      aspectRatio: 16 / 9,
      resizeMode: 'cover',
      backgroundColor: colors.surface,
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
      fontFamily: restaurantBrand.serif,
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

    // Wine-red prices in dark mode
    price: {
      fontSize: 21,
      fontWeight: '800',
      color: isDark
        ? '#D8B067'
        : colors.accent,
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
