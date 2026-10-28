import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

interface CardProps {
  title: string;
  image: string;
  description: string;
  backgroundColor?: string;
  price: string;
  isAvailable: boolean;
  onPress?: () => void;
}

const Card = ({ title, image, description, backgroundColor, price, isAvailable, onPress }: CardProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <Image source={{ uri: image }} style={styles.image} />

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.price}>
          ${price} MXN</Text>
        <Text
              style={[
                styles.availability,
                !isAvailable && styles.unavailable,
              ]}
            >
              {isAvailable ? 'Disponible' : 'Agotado'}
            </Text>
      </View>

    </Pressable>
  );
}

const styles = StyleSheet.create({

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,

    borderWidth: 1,
    borderColor: '#EAEAEA',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  image: {
    width: '100%',
    height: 220,
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },

  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 10,
    letterSpacing: -0.3,
  },

  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
    fontWeight: '400',
  },

  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  price: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  availability: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#25633A', // Green for available
  },
  unavailable: {
    color: '#A03232', // Red for unavailable
  },

});

export default Card;