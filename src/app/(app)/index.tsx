import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Card from '../../components/card';
import { getCards } from '../../services/cards';
import { CardItem } from '../../types/CardItem';
import { deleteToken } from '../../utils/tokenStorage';

export default function HomeScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = async () => {
    await deleteToken();
    router.replace('/(auth)/login');
  };
  
  const fetchCards = useCallback(async () => {
    try {
      setError(null);
     
      const data = await getCards();
      console.log('Data recibida en index:', data);
      console.log('Array?:', Array.isArray(data));
      console.log('Cantidad:', data?.length);
      setCards(data);
  
    } catch (err) {
      setError(err instanceof Error ? err.message : 
        'Error desconocido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCards();
    }, [fetchCards])
  );
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchCards();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#333" />
        <Text style={styles.message}>Cargando menú...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={fetchCards} style={styles.retryButton}>
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
    <Pressable onPress={handleLogout} style={styles.logoutButton}>
      <Text style={styles.logoutText}>Cerrar sesión</Text>
    </Pressable>
    <FlatList
      data={cards}
      ListHeaderComponent={
  <View style={{ marginBottom: 20 }}>
    <Text style={{ fontSize: 28, fontWeight: '700', color: '#222' }}>
      Nuestro menú
    </Text>

    <Text style={{ fontSize: 16, color: '#666', marginTop: 8 }}>
      Encuentra tu próximo platillo favorito.
    </Text>
  </View>
}
      keyExtractor={(item) => String(item.id)}  // String 
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={
        <Text style={styles.message}>Todavía no hay platillos en el menú</Text>
      }
      renderItem={({ item }) => (
        <Card
          title={item.title}
          price={item.price}
          image={item.image}
          description={item.description}
          isAvailable={item.is_available}
          onPress={() => {
            console.log('ID:', { id: item.id, item });
            router.push({
              pathname: '/details',
              params: { id: String(item.id) },   
            });
          }}
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
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#c0392b',
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    backgroundColor: '#333',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  logoutButton: {
    backgroundColor: '#c0392b',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
