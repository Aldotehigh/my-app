import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

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
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const hasImage = Boolean(image && failedImage !== image);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityHint={onPress ? 'Abre los detalles del platillo' : undefined}
      style={({ pressed }) => [
        styles.card,
        backgroundColor ? { backgroundColor } : null,
        pressed && onPress ? styles.pressed : null,
      ]}
    >
      {hasImage && image ? (
        <Image
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
            {isAvailable ? 'Disponible' : 'Agotado'}
          </Text>
        </View>

        <Text style={styles.title}>{title}</Text>

        {description?.trim() ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.price}>
            ${price} <Text style={styles.currency}>MXN</Text>
          </Text>

          {onPress ? <Text style={styles.detailLink}>Ver detalle ›</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFDF8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9DED0',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    resizeMode: 'cover',
    backgroundColor: '#F0E7DA',
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
    backgroundColor: '#E9EFDE',
  },
  unavailableBadge: {
    backgroundColor: '#F8E6E1',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  availableText: {
    color: '#3F542B',
  },
  unavailableText: {
    color: '#8D3728',
  },
  title: {
    fontSize: 23,
    fontWeight: '700',
    color: '#292119',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#675B50',
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
    borderTopColor: '#E9DED0',
  },
  price: {
    fontSize: 21,
    fontWeight: '800',
    color: '#8D3728',
  },
  currency: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#675B50',
  },
});