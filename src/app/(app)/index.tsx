import { PromotionNotice } from '../../components/PromotionCalendar';
import { RestaurantMasthead } from '../../components/RestaurantMasthead';
import { FeaturedDish } from '../../components/FeaturedDish';
import { restaurantBrand } from '../../constants/restaurantBrand';
import { getCardSummary } from '../../utils/cardPresentations';
import { useAuth } from '../../context/AuthContext';
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
  useWindowDimensions,
} from 'react-native';
import Card from '../../components/card';
import CategorySelector from '../../components/CategorySelector';
import { getCardsPage } from '../../services/cards';
import { getCategories } from '../../services/categories';
import type { CardItem, Category } from '../../types/CardItem';
import type { PageSize } from '../../utils/menuPreferences';
import { getMenuPageSize } from '../../utils/menuPreferences';

export default function HomeScreen() {
  const { colors, t, isDark } = usePreferences();
  const styles = createStyles(colors);
  const { width, fontScale } = useWindowDimensions();
  const columns = width >= 360 && fontScale <= 1.2 ? 2 : 1;
  const [filtersOpen, setFiltersOpen] = useState(false);

  const router = useRouter();
  const { user } = useAuth();
  const staffArea = user?.area ?? null;
  const [selectedArea, setSelectedArea] = useState<Category['area'] | 'food' | null>(null);
  const area = staffArea ?? selectedArea;
  const canEditMenu = Boolean(user?.can_edit_menu ?? user?.can_manage_menu);
  const isCustomer = user?.role === 'customer';
  const isAdmin = user?.can_manage_menu === true;
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
          getCardsPage({ search, categoryId, availableOnly, page, pageSize, area }),
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
    [search, categoryId, availableOnly, page, pageSize, area, t],
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

  const featured = isCustomer && page === 1 && !search && categoryId === null && !area
    ? cards.find((item) => Boolean(getCardSummary(item).image) && getCardSummary(item).isAvailable) : undefined;
  const openDetails = (item: CardItem) => router.push({
    pathname: '/details', params: { id: String(item.id) },
  });

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
        key={columns}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.gridRow : undefined}
        data={cards}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.masthead}><RestaurantMasthead /></View>
            <Text style={styles.eyebrow}>
              {t(isAdmin || staffArea ? 'RESTAURANT OPERATIONS' : 'RESTAURANT MENU')}
            </Text>
            <Text accessibilityRole="header" style={styles.heading}>
              {t(isAdmin ? 'Manage menu' : staffArea === 'kitchen' ? 'Kitchen' : staffArea === 'bar' ? 'Drinks bar' : staffArea === 'sushi' ? 'Sushi' : 'Our menu')}
            </Text>
            <Text style={styles.subtitle}>
              {t(isAdmin ? 'Create dishes and keep the menu up to date.' : staffArea
                ? 'Open an item to change its availability.'
                : 'Find your next favorite dish.')}
            </Text>
            {canEditMenu ? (
              <Pressable accessibilityRole="button" style={styles.primaryAction} onPress={() => router.push('/form')}>
                <Text style={styles.primaryActionText}>{t(staffArea === 'bar' ? 'New drink' : 'New dish')}</Text>
              </Pressable>
            ) : null}
            <View style={styles.searchRow}>
            <Text accessible={false} style={styles.searchIcon}>⌕</Text>
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

            <Pressable accessibilityRole="button" accessibilityLabel={t('Search')} onPress={handleSearch} style={styles.searchAction}>
              <Text style={{ color: colors.accent, fontWeight: '700' }}>→</Text>
            </Pressable>
            </View>


            {staffArea === null ? (
              <View style={styles.areaFilters}>
                {([
                  { value: null, label: 'All items' },
                  { value: 'food', label: 'Food' },
                  { value: 'bar', label: 'Drinks' },
                ] as const).map(({ value, label }) => {
                  const selected = selectedArea === value;
                  return (
                    <Pressable
                      key={label}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      style={[styles.areaFilter, selected && styles.areaFilterSelected]}
                      onPress={() => {
                        if (selected) return;
                        setSelectedArea(value);
                        setCategoryId(null);
                        setPage(1);
                      }}
                    >
                      <Text style={selected ? styles.areaFilterTextSelected : styles.areaFilterText}>
                        {t(label)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <Pressable accessibilityRole="button"
              accessibilityState={{ expanded: filtersOpen }}
              onPress={() => setFiltersOpen((current) => !current)}
              style={styles.filtersToggle}
            >
              <Text style={styles.filterLabel}>{t('Filters')} · {t('Category')} / {t('Availability')}</Text>
              <Text style={styles.filterLabel}>{filtersOpen ? '−' : '+'}</Text>
            </Pressable>
            {filtersOpen || categoryId !== null || availableOnly ? (
              <View style={styles.filtersPanel}>
            <CategorySelector
              categories={area ? categories.filter((category) => (area === 'food' ? category.area !== 'bar' : category.area === area)) : categories}
              selectedId={categoryId}
              onSelect={handleCategoryChange}
            />

            {categories.find((category) => category.id === categoryId)?.name === 'Kushi Age' ? (
              <Text style={{ color: colors.accent, padding: 12, backgroundColor: colors.soft, borderRadius: 10 }}>
                {t('Three different skewers. The highest selected price applies.')}
              </Text>
            ) : null}
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
            ) : null}
            {featured ? <FeaturedDish key={featured.id} card={featured} onPress={() => openDetails(featured)} /> : null}
            {isAdmin ? <Button title={t('Reservations')} color={colors.accent} onPress={() => router.push('/reservations')} /> : null}
            {isCustomer && area !== 'bar' ? <PromotionNotice /> : null}
            <View style={styles.sectionHeading}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>{t('Explore our menu')}</Text>
              <Text style={styles.sectionNote}>{t('Page')} {page}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.message}>
            {search || categoryId !== null || availableOnly
              ? t("No dishes match these filters.")
              : t(area ? "No items have been assigned to this area." : "There are no dishes on the menu yet.")}
          </Text>
        }
        ListFooterComponent={
          <View style={{ gap: 16, paddingBottom: 8 }}>
          {page > 1 || hasNextPage ? (
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
          ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.gridItem, { maxWidth: columns > 1 ? '48.4%' : '100%' }]}>
            <Card
              compact={columns > 1}
              {...getCardSummary(item)}
              description={item.description}
              onPress={() => openDetails(item)}
            />
          </View>
        )}
      />

    </>
  );
}

const createStyles = (colors: RestaurantColors) => StyleSheet.create({
  masthead: { marginHorizontal: -18 },
  gridRow: { gap: 12, alignItems: 'flex-start' },
  gridItem: { flex: 1, maxWidth: '100%' },
  searchRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 26, backgroundColor: colors.surface, marginTop: 20, paddingLeft: 12, overflow: 'hidden' },
  searchIcon: { color: colors.muted, fontSize: 23 },
  searchAction: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  filtersToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, marginTop: 8 },
  filterLabel: { color: colors.muted, fontSize: 12 },
  filtersPanel: { padding: 12, gap: 8, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 18, marginBottom: 10 },
  sectionTitle: { fontSize: 25, fontFamily: restaurantBrand.serif, color: colors.text, flexShrink: 1 },
  sectionNote: { color: colors.accent, fontSize: 12 },
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
    padding: 18,
    paddingTop: 0,
    gap: 12,
  },
  eyebrow: { color: colors.accent, fontSize: 10, letterSpacing: 2.5, fontWeight: '700', marginTop: 23, marginBottom: 5 },
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
    marginBottom: 0,
  },
  heading: {
    fontSize: 39,
    lineHeight: 46,
    fontFamily: restaurantBrand.serif,
    fontWeight: '500',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    marginTop: 6,
    lineHeight: 22,
  },
  primaryAction: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: colors.accent,
  },
  primaryActionText: { color: colors.onAccent, fontWeight: '700' },
  areaFilters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  areaFilter: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  areaFilterSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  areaFilterText: { color: colors.text, fontWeight: '600' },
  areaFilterTextSelected: { color: colors.onAccent, fontWeight: '700' },
  searchInput: {
    flex: 1, minHeight: 46, color: colors.text, fontSize: 14, paddingVertical: 10, paddingHorizontal: 6,
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