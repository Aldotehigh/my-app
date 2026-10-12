import { deleteToken } from '@/utils/tokenStorage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList, Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Card from '../../components/card';
import { CardItem } from '../../types/CardItem';


interface DummyProduct {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
}

interface DummyApiResponse {
  products: DummyProduct[];
  total: number;
  skip: number;
  limit: number;
}

const adaptProductToCardItem = (p: DummyProduct): CardItem => ({
  id: String(p.id),
  title: p.title,
  image: p.thumbnail,
  description: p.description,
  backgroundColor: '#E3F2FD',
});

const API_URL = 'https://dummyjson.com/products?limit=10'; // Cambia esto a tu API real si es necesario

export default function HomeScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = async () => {
    await deleteToken(); // Eliminar el token al cerrar sesión
    router.replace('/(auth)/login'); // Redirigir al login
  };

  const fetchCards = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const data: DummyApiResponse = await response.json();
      setCards(data.products.map(adaptProductToCardItem));
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
    <>
    <Pressable onPress={handleLogout} style={styles.logoutButton}>
      <Text style={styles.logoutText}>Cerrar Sesión</Text>
    </Pressable>
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
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 10,
  },

  listContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },

  message: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },

  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#c0392b',
    marginBottom: 16,
    paddingHorizontal: 24
  },

  retryButton: {
    backgroundColor: '#333',
    paddingVertical: 24,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },

  retryText: {
    color: '#fff',
    fontWeight: '600'
  },

  logoutButton: {
    backgroundColor: '#c0392b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 16,
  },

  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },

});