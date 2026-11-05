import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../types/CurrentUser';
import { announce } from '../../utils/announce';
import { usePreferences } from '../../context/PreferencesContext';
import type { RestaurantColors } from '../../constants/restaurantColors';
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
import CategorySelector from '../../components/CategorySelector';
import { getCardsPage } from '../../services/cards';
import { getCategories } from '../../services/categories';
import type { CardItem, Category } from '../../types/CardItem';
import type { PageSize } from '../../utils/menuPreferences';
import { getMenuPageSize } from '../../utils/menuPreferences';
import { deleteToken } from '../../utils/tokenStorage';

export default function HomeScreen() {
  const { colors, t, isDark } = usePreferences();
  const styles = createStyles(colors);

  const router = useRouter();
  const { user, reloadUser } = useAuth();
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
        announce(`${t('Menu updated')}. ${data.count} ${t('Dishes')}. ${t('Page')} ${page}.`);
      } catch (err) {
        if (isCurrent()) {
          setError(err instanceof Error ? err.message : t("Unknown error"));
        }
      } finally {
        if (isCurrent()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [search, categoryId, availableOnly, page, pageSize, t],
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
        <Text style={styles.message}>{t("Loading menu...")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={handleRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>{t("Retry")}</Text>
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
            <View style={{ padding: 16, borderRadius: 14, gap: 8, backgroundColor: colors.soft, marginBottom: 16 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{user?.username}</Text>
              <Text style={{ color: colors.accent }}>{user ? t(ROLE_LABELS[user.role]) : ''}</Text>
              <Button color={colors.accent} title={t('Refresh profile')} onPress={() => void reloadUser()} />
            </View>
            {user?.can_manage_menu ? (
              <Button color={colors.accent} title={t('New dish')} onPress={() => router.push('/form')} />
            ) : null}
            <Text style={styles.eyebrow}>{t("RESTAURANT MENU")}</Text>
            <Text accessibilityRole="header" style={styles.heading}>{t("Our menu")}</Text>
            <Text style={styles.subtitle}>
              {t("Find your next favorite dish.")}</Text>
            <View style={styles.quickLinks}>
              <Pressable accessibilityRole="button" style={styles.quickLink} onPress={() => router.push('/(app)/favorites')}>
                <Text style={styles.quickLinkText}>{t("♥ My favorites")}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={styles.quickLink} onPress={() => router.push('/(app)/settings')}>
                <Text style={styles.quickLinkText}>{t("Settings")}</Text>
              </Pressable>
            </View>

            <TextInput keyboardAppearance={isDark ? 'dark' : 'light'}
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={handleSearch}
              placeholder={t("Search dishes")}
              placeholderTextColor={colors.muted}
              accessibilityLabel={t("Search dishes")}
              returnKeyType="search"
              style={styles.searchInput}
            />

            <Button color={colors.accent} title={t("Search")} onPress={handleSearch} />

            <CategorySelector
              categories={categories}
              selectedId={categoryId}
              onSelect={handleCategoryChange}
            />

            <View style={styles.availabilityRow}>
              <Text style={{ color: colors.text }}>{t("Available only")}</Text>
              <Switch
                accessibilityLabel={t("Show available dishes only")}
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
              ? t("No dishes match these filters.")
              : t("There are no dishes on the menu yet.")}
          </Text>
        }
        ListFooterComponent={
          page > 1 || hasNextPage ? (
            <View style={styles.pagination}>
              <Button color={colors.accent}
                title={t("Previous")}
                disabled={page === 1}
                onPress={() => setPage((current) => Math.max(1, current - 1))}
              />
              <Text style={{ color: colors.text }}>{t("Page")} {page}</Text>
              <Button color={colors.accent}
                title={t("Next")}
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
        <Text style={styles.logoutText}>{t("Sign out")}</Text>
      </Pressable>
    </>
  );
}

const createStyles = (colors: RestaurantColors) => StyleSheet.create({
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
    minHeight: 48,
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
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  pagination: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});