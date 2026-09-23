import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  FlatList, Pressable, 
  StyleSheet, 
  Text,
  View, } 
  from 'react-native';
import Card from '../components/card';
import { CardItem } from '../types/CardItem';


interface ApiProduct {
  id: number;
  title: string;
  image: string;
  description: string;
  
}

const adaptProductToCardItem = (p: ApiProduct): CardItem => ({
  id: String(p.id),
  title: p.title,
  image: p.image,
  description: p.description,
  backgroundColor: '#E3F2FD',
});

const API_URL = 'https://fakestoreapi.com/products?limit=10';

export default function HomeScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCards = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const data: ApiProduct[] = await response.json();
      setCards(data.map(adaptProductToCardItem));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCards();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0b0b14" />
        <Text style={styles.message}>Loading Cards...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={fetchCards} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={cards}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={
          <Text style={styles.message}>No hay tarjetas disponibles.</Text>
      }
      renderItem={({ item }) => (
        <Card
          title={item.title}
          image={item.image}
          description={item.description}
          onPress={() =>
            router.push({
              pathname: '/details',
              params: { item: JSON.stringify(item) },
            })
          }
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: '#F2EFE7',
    padding: 16,
  },

  listContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },

  message: {
    textAlign: 'center',
    fontSize: 16,
    color: '#3368A0',
    marginTop: 16,
  },

  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#3368A0',
    marginBottom: 16,
  },

  retryButton: {
    backgroundColor: '#3368A0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignSelf: 'center',
  },

  retryText: {
    color: '#F2EFE7',
    fontSize: 16,
  },
});