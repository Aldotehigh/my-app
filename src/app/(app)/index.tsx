import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Card from '../../components/card';
import { colors } from '../../constants/restaurantColors';
import { getCardsPage } from '../../services/cards';
import { getCategories } from '../../services/categories';
import type { CardItem, Category } from '../../types/CardItem';
import type { PageSize } from '../../utils/menuPreferences';
import { getMenuPageSize } from '../../utils/menuPreferences';
import { deleteToken } from '../../utils/tokenStorage';

export default function HomeScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const handleLogout = async () => {
    await deleteToken();
    router.replace('/(auth)/login');
  };

  const fetchCards = useCallback(
    async (isCurrent: () => boolean) => {
      try {
        setError(null);
        setHasNextPage(false);

        const savedPageSize = await getMenuPageSize();

        if (!isCurrent()) return;

        if (savedPageSize !== pageSize) {
          setPage(1);
          setPageSize(savedPageSize);
          return;
        }

        const [data, categoryList] = await Promise.all([
          getCardsPage({ search, categoryId, availableOnly, page, pageSize }),
          getCategories(),
        ]);

        if (!isCurrent()) return;

        setCards(data.results);
        setCategories(categoryList);
        setHasNextPage(Boolean(data.next));
      } catch (err) {
        if (isCurrent()) {
          setError(err instanceof Error ? err.message : 'Error desconocido');
        }
      } finally {
        if (isCurrent()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [search, categoryId, availableOnly, page, pageSize],
  );

  useFocusEffect(
    useCallback(() => {
      let isCurrent = true;

      if (reloadKey > 0) {
        setError(null);
      }

      void fetchCards(() => isCurrent);

      return () => {
        isCurrent = false;
      };
    }, [fetchCards, reloadKey]),
  );

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleCategoryChange = (nextCategoryId: number | null) => {
    setPage(1);
    setCategoryId(nextCategoryId);
  };

  const handleAvailabilityChange = (value: boolean) => {
    setPage(1);
    setAvailableOnly(value);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setReloadKey((current) => current + 1);
  };

  const handleRetry = () => {
    setLoading(true);
    setReloadKey((current) => current + 1);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.message}>Cargando menú...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={handleRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={cards}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>CARTA DEL RESTAURANTE</Text>
            <Text style={styles.heading}>Nuestro menú</Text>
            <Text style={styles.subtitle}>
              Encuentra tu próximo platillo favorito.
            </Text>
            <View style={styles.quickLinks}>
              <Pressable accessibilityRole="button" style={styles.quickLink} onPress={() => router.push('/(app)/favorites')}>
                <Text style={styles.quickLinkText}>♥ Mis favoritos</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={styles.quickLink} onPress={() => router.push('/(app)/settings')}>
                <Text style={styles.quickLinkText}>Ajustes</Text>
              </Pressable>
            </View>

            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={handleSearch}
              placeholder="Buscar platillos"
              placeholderTextColor={colors.muted}
              accessibilityLabel="Buscar platillos"
              returnKeyType="search"
              style={styles.searchInput}
            />

            <Button color={colors.accent} title="Buscar" onPress={handleSearch} />

            <View style={styles.categories}>
              {[{ id: null, name: 'Todas' }, ...categories].map((category) => {
                const isSelected = categoryId === category.id;

                return (
                  <Pressable
                    key={category.id ?? 'all'}
                    onPress={() => handleCategoryChange(category.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={[
                      styles.categoryButton,
                      isSelected && styles.selectedCategoryButton,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        isSelected && styles.selectedCategoryText,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.availabilityRow}>
              <Text>Solo disponibles</Text>
              <Switch
                accessibilityLabel="Mostrar solo platillos disponibles"
                value={availableOnly}
                trackColor={{ true: colors.olive }}
                onValueChange={handleAvailabilityChange}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.message}>
            {search || categoryId !== null || availableOnly
              ? 'No se encontraron platillos con estos filtros.'
              : 'Todavía no hay platillos en el menú.'}
          </Text>
        }
        ListFooterComponent={
          page > 1 || hasNextPage ? (
            <View style={styles.pagination}>
              <Button color={colors.accent}
                title="Anterior"
                disabled={page === 1}
                onPress={() => setPage((current) => Math.max(1, current - 1))}
              />
              <Text>Página {page}</Text>
              <Button color={colors.accent}
                title="Siguiente"
                disabled={!hasNextPage}
                onPress={() => {
                  setHasNextPage(false);
                  setPage((current) => current + 1);
                }}
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
            onPress={() => {
              router.push({
                pathname: '/details',
                params: { id: String(item.id) },
              });
            }}
          />
        )}
      />
      <Pressable accessibilityRole="button" onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    color: colors.muted,
  },
  errorText: {
    fontSize: 16,
    color: colors.accent,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: colors.onAccent,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  logoutButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutText: { color: colors.accent, fontWeight: '600' },
  eyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  quickLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  quickLink: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: colors.soft,
  },
  quickLinkText: { color: colors.accent, fontWeight: '700' },
  header: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    marginTop: 8,
  },
  searchInput: {
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  selectedCategoryButton: {
    backgroundColor: colors.accent,
  },
  categoryText: {
    color: colors.text,
  },
  selectedCategoryText: {
    color: colors.onAccent,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});