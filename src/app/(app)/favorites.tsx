import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Button,
    FlatList,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Card from '../../components/card';
import { colors } from '../../constants/restaurantColors';
import { getFavoritesPage } from '../../services/cards';
import type { CardItem } from '../../types/CardItem';

export default function FavoritesScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadFavorites() {
        setLoading(true);
        setError(null);

        try {
          // Find the last valid page if favorites were removed in the detail screen.
          const firstPage = await getFavoritesPage(1);
          const pageSize = firstPage.results.length;
          const lastPage = firstPage.next && pageSize > 0
            ? Math.ceil(firstPage.count / pageSize)
            : 1;

          if (!isActive) return;

          if (page > lastPage) {
            setPage(lastPage);
            return;
          }

          const data = page === 1 ? firstPage : await getFavoritesPage(page);

          if (isActive) {
            setCards(data.results);
            setHasNextPage(Boolean(data.next));
          }
        } catch (err) {
          if (isActive) {
            setError(
              err instanceof Error ? err.message : 'No se pudieron cargar los favoritos.',
            );
          }
        } finally {
          if (isActive) setLoading(false);
        }
      }

      void loadFavorites();

      return () => {
        isActive = false;
      };
    }, [page, reloadKey]),
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Cargando favoritos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>{error}</Text>
        <Button color={colors.accent}
          title="Reintentar"
          onPress={() => setReloadKey((current) => current + 1)}
        />
      </View>
    );
  }

  return (
    <FlatList
      data={cards}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={<Text>Todavía no tienes platillos favoritos.</Text>}
      ListFooterComponent={
        page > 1 || hasNextPage ? (
          <View style={styles.pagination}>
            <Button color={colors.accent}
              title="Anterior"
              disabled={page === 1}
              onPress={() => setPage(page - 1)}
            />
            <Text>Página {page}</Text>
            <Button color={colors.accent}
              title="Siguiente"
              disabled={!hasNextPage}
              onPress={() => setPage(page + 1)}
            />
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <Card
          title={item.title}
          price={item.price}
          image={item.image}
          description={item.description}
          isAvailable={item.is_available}
          onPress={() =>
            router.push({
              pathname: '/details',
              params: { id: String(item.id) },
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});