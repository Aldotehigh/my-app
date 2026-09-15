import { Image, View, StyleSheet, Text, Pressable } from 'react-native';

interface CardProps {
  title: string;
  image: string;
  description: string;
  backgroundColor?: string;
  onPress?: () => void;
}

const Card= ({ title, image, description, backgroundColor, onPress }: CardProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <Image source={{ uri: image }} style={styles.image} />
      <View style={ styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1dbfcd',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#4e4848',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

export default Card;