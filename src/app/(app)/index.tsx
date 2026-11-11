
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
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Animated,
  Button,
  Easing,
  FlatList,
  Image,
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

// ---------------------------------------------
// ANIMACIÓN DEL TEXTO DE TODO / COMIDA / BEBIDAS
// ---------------------------------------------

function AnimatedTabText({
  label,
  selected,
  color,
}: {
  label: string;
  selected: boolean;
  color: string;
}) {
  const lift = useRef(
    new Animated.Value(selected ? -5 : 0)
  ).current;

  useEffect(() => {
    const animation = Animated.timing(lift, {
      toValue: selected ? -5 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [selected, lift]);

  return (
    <Animated.Text
      numberOfLines={1}
      adjustsFontSizeToFit
      style={{
        color,
        fontSize: 14,
        fontWeight: selected ? '700' : '600',
        textAlign: 'center',
        transform: [{ translateY: lift }],
      }}
    >
      {label}
    </Animated.Text>
  );
}

export default function HomeScreen() {
  const { colors, t, isDark } = usePreferences();
  const styles = createStyles(colors, isDark);

  const { width, fontScale } = useWindowDimensions();
  const columns = width >= 360 && fontScale <= 1.2 ? 2 : 1;

  const [filtersOpen, setFiltersOpen] = useState(false);

  const router = useRouter();
  const { user } = useAuth();

  const staffArea = user?.area ?? null;

  const [selectedArea, setSelectedArea] =
    useState<Category['area'] | 'food' | null>(null);

  const area = staffArea ?? selectedArea;

  const canEditMenu = Boolean(
    user?.can_edit_menu ?? user?.can_manage_menu
  );

  const isCustomer = user?.role === 'customer';
  const isAdmin = user?.can_manage_menu === true;

  const [cards, setCards] = useState<CardItem[]>([]);
  const [featuredCards, setFeaturedCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);

  // ---------------------------------------------
  // ESTADOS DEL BUSCADOR CON AUTOCOMPLETADO
  // ---------------------------------------------

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [suggestions, setSuggestions] = useState<CardItem[]>([]);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [availableOnly, setAvailableOnly] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // ---------------------------------------------
  // BÚSQUEDA AUTOMÁTICA
  // ---------------------------------------------

  useEffect(() => {
    const timeout = setTimeout(() => {
      const query = searchInput.trim();

      if (query !== search) {
        setPage(1);
        setSearch(query);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput, search]);

  // ---------------------------------------------
  // SUGERENCIAS REALES DESDE DJANGO
  // ---------------------------------------------

  useEffect(() => {
    let active = true;

    const query = searchInput.trim();

    if (!suggestionsVisible || !query || query !== search) {
      setSuggestions([]);
      setSuggestionsLoading(false);

      return () => {
        active = false;
      };
    }

    setSuggestionsLoading(true);
    setSuggestions([]);

    getCardsPage({
      search: query,
      categoryId,
      availableOnly,
      page: 1,
      pageSize: 10,
      area,
    })
      .then((result) => {
        if (active) {
          setSuggestions(result.results.slice(0, 4));
        }
      })
      .catch(() => {
        if (active) {
          setSuggestions([]);
        }
      })
      .finally(() => {
        if (active) {
          setSuggestionsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    searchInput,
    search,
    suggestionsVisible,
    categoryId,
    availableOnly,
    area,
  ]);

  // ---------------------------------------------
  // ANIMACIÓN DEL SELECTOR TODO / COMIDA / BEBIDAS
  // ---------------------------------------------

  const [selectorWidth, setSelectorWidth] = useState(0);

  const selectedIndex =
    selectedArea === 'food'
      ? 1
      : selectedArea === 'bar'
        ? 2
        : 0;

  const slideAnimation = useRef(
    new Animated.Value(selectedIndex)
  ).current;

  useEffect(() => {
    const animation = Animated.timing(slideAnimation, {
      toValue: selectedIndex,
      duration: 280,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [selectedIndex, slideAnimation]);

  const segmentWidth = selectorWidth / 3;

  const slideX = slideAnimation.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      0,
      segmentWidth,
      segmentWidth * 2,
    ],
  });

  const handleAreaChange = (
    nextArea: Category['area'] | 'food' | null
  ) => {
    if (selectedArea === nextArea) return;

    setSelectedArea(nextArea);
    setCategoryId(null);
    setPage(1);
  };

  // ---------------------------------------------
  // CARGA DEL MENÚ
  // ---------------------------------------------

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
          getCardsPage({
            search,
            categoryId,
            availableOnly,
            page,
            pageSize,
            area,
          }),
          getCategories(),
        ]);

        if (!isCurrent()) return;

        setCards(data.results);
        setCategories(categoryList);
        setHasNextPage(Boolean(data.next));

        announce(
          `${t('Menu updated')}. ${data.count} ${t('Dishes')}. ${t('Page')} ${page}.`
        );
      } catch (err) {
        if (isCurrent()) {
          setError(
            err instanceof Error
              ? err.message
              : t('Unknown error')
          );
        }
      } finally {
        if (isCurrent()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [
      search,
      categoryId,
      availableOnly,
      page,
      pageSize,
      area,
      t,
    ]
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
    }, [fetchCards, reloadKey])
  );

  // ---------------------------------------------
// CARGAR 4 PLATILLOS PARA EL CARRUSEL
// ---------------------------------------------


useFocusEffect(
  useCallback(() => {
    if (!isCustomer) {
      setFeaturedCards([]);
      return;
    }

    let active = true;

    const loadFeaturedCards = async () => {
      const candidates: CardItem[] = [];
      const seenIds = new Set<string>();

      try {
        // Obtener platillos de diferentes páginas de Django
        for (let currentPage = 1; currentPage <= 50; currentPage++) {
          const data = await getCardsPage({
            search: '',
            categoryId: null,
            availableOnly: true,
            page: currentPage,
            pageSize: 10,
            area: null,
          });

          if (!active) return;

          if (!data || !Array.isArray(data.results)) {
            break;
          }

          for (const item of data.results) {
            const summary = getCardSummary(item);
            const id = String(item.id);

            // Solo platillos disponibles, con foto y sin repetir
            if (
              summary.image &&
              summary.isAvailable &&
              !seenIds.has(id)
            ) {
              candidates.push(item);
              seenIds.add(id);
            }
          }

          if (!data.next) break;
        }

        // Mezclar aleatoriamente los platillos
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));

          [candidates[i], candidates[j]] = [
            candidates[j],
            candidates[i],
          ];
        }

        // Elegir cuatro platillos al azar
        const selected = candidates.slice(0, 4);

        if (active) {
          setFeaturedCards(selected);
        }
      } catch (err) {
        console.log(
          'Error al cargar platillos destacados:',
          err
        );

        if (active) {
          setFeaturedCards([]);
        }
      }
    };

    void loadFeaturedCards();

    return () => {
      active = false;
    };
  }, [isCustomer])
);


  // ---------------------------------------------
  // ACCIONES
  // ---------------------------------------------

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
    setSuggestionsVisible(false);
  };

  const handleCategoryChange = (
    nextCategoryId: number | null
  ) => {
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

 const featured =
  isCustomer &&
  page === 1 &&
  !search &&
  categoryId === null &&
  !area
    ? featuredCards
    : [];

  const openDetails = (item: CardItem) =>
    router.push({
      pathname: '/details',
      params: { id: String(item.id) },
    });

  // ---------------------------------------------
  // CARGANDO
  // ---------------------------------------------

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator
          size="large"
          color={colors.accent}
        />

        <Text style={styles.message}>
          {t('Loading menu...')}
        </Text>
      </View>
    );
  }

  // ---------------------------------------------
  // ERROR
  // ---------------------------------------------

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {error}
        </Text>

        <Pressable
          onPress={handleRetry}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>
            {t('Retry')}
          </Text>
        </Pressable>
      </View>
    );
  }

  // ---------------------------------------------
  // PANTALLA PRINCIPAL
  // ---------------------------------------------

  return (
    <>
      <FlatList
        key={columns}
        numColumns={columns}
        columnWrapperStyle={
          columns > 1 ? styles.gridRow : undefined
        }
        data={cards}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        keyboardShouldPersistTaps="always"
        ListHeaderComponent={
          <View style={styles.header}>

            {/* ENCABEZADO DE MADERA */}

            <View style={styles.masthead}>
              <RestaurantMasthead />
            </View>

            {/* TÍTULOS DEL MENÚ */}

            <Text style={styles.eyebrow}>
              {t(
                isAdmin || staffArea
                  ? 'RESTAURANT OPERATIONS'
                  : 'RESTAURANT MENU'
              )}
            </Text>

            <Text
              accessibilityRole="header"
              style={styles.heading}
            >
              {t(
                isAdmin
                  ? 'Manage menu'
                  : staffArea === 'kitchen'
                    ? 'Kitchen'
                    : staffArea === 'bar'
                      ? 'Drinks bar'
                      : staffArea === 'sushi'
                        ? 'Sushi'
                        : 'Our menu'
              )}
            </Text>

            <Text style={styles.subtitle}>
              {t(
                isAdmin
                  ? 'Create dishes and keep the menu up to date.'
                  : staffArea
                    ? 'Open an item to change its availability.'
                    : 'Discover the art of Japanese cuisine.'
              )}
            </Text>

            {canEditMenu ? (
              <Pressable
                accessibilityRole="button"
                style={styles.primaryAction}
                onPress={() => router.push('/form')}
              >
                <Text style={styles.primaryActionText}>
                  {t(
                    staffArea === 'bar'
                      ? 'New drink'
                      : 'New dish'
                  )}
                </Text>
              </Pressable>
            ) : null}

            {/* --------------------------------- */}
            {/* BUSCADOR CON AUTOCOMPLETADO */}
            {/* --------------------------------- */}

            <View style={styles.searchRow}>
              <Text
                accessible={false}
                style={styles.searchIcon}
              >
                ⌕
              </Text>

              <TextInput
                keyboardAppearance={
                  isDark ? 'dark' : 'light'
                }
                value={searchInput}
                onChangeText={(value) => {
                  setSearchInput(value);
                  setSuggestionsVisible(true);
                }}
                onFocus={() => {
                  setSuggestionsVisible(true);
                }}
                onSubmitEditing={handleSearch}
                placeholder={t('Search dishes')}
                placeholderTextColor={colors.muted}
                accessibilityLabel={t('Search dishes')}
                returnKeyType="search"
                style={styles.searchInput}
              />

              {/* LIMPIAR BÚSQUEDA */}

              {searchInput.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Limpiar búsqueda"
                  onPress={() => {
                    setSearchInput('');
                    setSearch('');
                    setPage(1);
                    setSuggestions([]);
                    setSuggestionsVisible(false);
                  }}
                  style={styles.searchAction}
                >
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: 20,
                    }}
                  >
                    ×
                  </Text>
                </Pressable>
              ) : null}

              {/* BUSCAR */}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('Search')}
                onPress={handleSearch}
                style={styles.searchAction}
              >
                <Text
                  style={{
                    color: colors.accent,
                    fontWeight: '700',
                  }}
                >
                  →
                </Text>
              </Pressable>
            </View>

            {/* --------------------------------- */}
            {/* SUGERENCIAS DE PLATILLOS */}
            {/* --------------------------------- */}

            {suggestionsVisible &&
            searchInput.trim().length > 0 ? (
              <View style={styles.suggestionsContainer}>
                {suggestionsLoading ||
                search !== searchInput.trim() ? (
                  <View style={styles.suggestionsLoading}>
                    <ActivityIndicator
                      size="small"
                      color={colors.accent}
                    />

                    <Text
                      style={{
                        color: colors.muted,
                        fontSize: 12,
                      }}
                    >
                      Buscando platillos...
                    </Text>
                  </View>
                ) : suggestions.length > 0 ? (
                  suggestions.map((item, index) => {
                    const summary = getCardSummary(item);

                    return (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        accessibilityLabel={summary.title}
                        onPress={() => {
                          setSuggestionsVisible(false);
                          openDetails(item);
                        }}
                        style={[
                          styles.suggestionItem,
                          index < suggestions.length - 1
                            ? {
                                borderBottomWidth: 1,
                                borderBottomColor: colors.border,
                              }
                            : null,
                        ]}
                      >
                        {/* FOTO DEL PLATILLO */}

                        {summary.image ? (
                          <Image
                            source={{
                              uri: summary.image,
                            }}
                            style={styles.suggestionImage}
                          />
                        ) : (
                          <View
                            style={[
                              styles.suggestionImage,
                              {
                                backgroundColor: colors.soft,
                                alignItems: 'center',
                                justifyContent: 'center',
                              },
                            ]}
                          >
                            <Text
                              style={{
                                color: colors.accent,
                                fontSize: 22,
                              }}
                            >
                              ◇
                            </Text>
                          </View>
                        )}

                        {/* NOMBRE Y PRECIO */}

                        <View
                          style={{
                            flex: 1,
                            gap: 4,
                          }}
                        >
                          <Text
                            numberOfLines={2}
                            style={[
                              styles.suggestionTitle,
                              {
                                color: colors.text,
                              },
                            ]}
                          >
                            {summary.title}
                          </Text>

                          <Text
                            style={{
                              color: colors.accent,
                              fontSize: 12,
                            }}
                          >
                            {summary.showStartingPrice
                              ? t('From') + ' '
                              : ''}
                            ${summary.price} MXN
                          </Text>
                        </View>

                        {/* FLECHA DE DETALLES */}

                        <Text
                          style={{
                            color: colors.accent,
                            fontSize: 20,
                          }}
                        >
                          ›
                        </Text>
                      </Pressable>
                    );
                  })
                ) : (
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: 12,
                      padding: 16,
                      textAlign: 'center',
                    }}
                  >
                    No encontramos platillos con ese nombre.
                  </Text>
                )}
              </View>
            ) : null}

            {/* --------------------------------- */}
            {/* SELECTOR TODO / COMIDA / BEBIDAS */}
            {/* --------------------------------- */}

            {staffArea === null ? (
              <View
                style={styles.areaFilters}
                onLayout={(event) => {
                  const newWidth =
                    event.nativeEvent.layout.width;

                  if (
                    newWidth > 0 &&
                    newWidth !== selectorWidth
                  ) {
                    setSelectorWidth(newWidth);
                  }
                }}
              >
                {/* FONDO ROJO DESLIZANTE */}

                {selectorWidth > 0 ? (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.slidingIndicator,
                      {
                        width: segmentWidth,
                        transform: [
                          {
                            translateX: slideX,
                          },
                        ],
                      },
                    ]}
                  />
                ) : null}

                {/* BOTONES ANIMADOS */}

                {([
                  {
                    value: null,
                    label: 'All items',
                  },
                  {
                    value: 'food',
                    label: 'Food',
                  },
                  {
                    value: 'bar',
                    label: 'Drinks',
                  },
                ] as const).map(({ value, label }) => {
                  const selected =
                    selectedArea === value;

                  return (
                    <Pressable
                      key={label}
                      accessibilityRole="button"
                      accessibilityState={{
                        selected,
                      }}
                      style={styles.areaFilter}
                      onPress={() =>
                        handleAreaChange(value)
                      }
                    >
                      <AnimatedTabText
                        label={t(label)}
                        selected={selected}
                        color={
                          selected
                            ? colors.onAccent
                            : colors.text
                        }
                      />
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {/* --------------------------------- */}
            {/* FILTROS AVANZADOS */}
            {/* --------------------------------- */}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                expanded: filtersOpen,
              }}
              onPress={() =>
                setFiltersOpen(
                  (current) => !current
                )
              }
              style={styles.filtersToggle}
            >
              <Text style={styles.filterLabel}>
                {t('Filters')} · {t('Category')} /{' '}
                {t('Availability')}
              </Text>

              <Text style={styles.filterLabel}>
                {filtersOpen ? '−' : '+'}
              </Text>
            </Pressable>

            {filtersOpen ||
            categoryId !== null ||
            availableOnly ? (
              <View style={styles.filtersPanel}>
                <CategorySelector
                  categories={
                    area
                      ? categories.filter(
                          (category) =>
                            area === 'food'
                              ? category.area !== 'bar'
                              : category.area === area
                        )
                      : categories
                  }
                  selectedId={categoryId}
                  onSelect={handleCategoryChange}
                />

                {categories.find(
                  (category) =>
                    category.id === categoryId
                )?.name === 'Kushi Age' ? (
                  <Text
                    style={{
                      color: colors.accent,
                      padding: 12,
                      backgroundColor: colors.soft,
                      borderRadius: 10,
                    }}
                  >
                    {t(
                      'Three different skewers. The highest selected price applies.'
                    )}
                  </Text>
                ) : null}

                <View style={styles.availabilityRow}>
                  <Text
                    style={{
                      color: colors.text,
                    }}
                  >
                    {t('Available only')}
                  </Text>

                  <Switch
                    accessibilityLabel={t(
                      'Show available dishes only'
                    )}
                    value={availableOnly}
                    trackColor={{
                      true: colors.olive,
                    }}
                    onValueChange={
                      handleAvailabilityChange
                    }
                  />
                </View>
              </View>
            ) : null}

            {/* --------------------------------- */}
            {/* PLATILLO DESTACADO */}
            {/* --------------------------------- */}

           {featured.length > 0 ? (
  <FeaturedDish
    cards={featured}
    onPress={(item) => openDetails(item)}
  />
) : null}

            {/* RESERVACIONES */}

            {isAdmin ? (
              <Button
                title={t('Reservations')}
                color={colors.accent}
                onPress={() =>
                  router.push('/reservations')
                }
              />
            ) : null}

            {/* PROMOCIÓN EN SU POSICIÓN ORIGINAL */}

            {isCustomer && area !== 'bar' ? (
              <PromotionNotice />
            ) : null}

            {/* --------------------------------- */}
            {/* TÍTULO DE LOS PRODUCTOS */}
            {/* --------------------------------- */}

            <View style={styles.sectionHeading}>
              <Text
                accessibilityRole="header"
                style={styles.sectionTitle}
              >
                {t('Explore our menu')}
              </Text>

              <Text style={styles.sectionNote}>
                {t('Page')} {page}
              </Text>
            </View>
          </View>
        }

        ListEmptyComponent={
          <Text style={styles.message}>
            {search ||
            categoryId !== null ||
            availableOnly
              ? t('No dishes match these filters.')
              : t(
                  area
                    ? 'No items have been assigned to this area.'
                    : 'There are no dishes on the menu yet.'
                )}
          </Text>
        }


        ListFooterComponent={
          <View
            style={{
              gap: 16,
              paddingBottom: 8,
            }}
          >
            {page > 1 || hasNextPage ? (
              <View style={styles.pagination}>
                <Button
                  color={colors.accent}
                  title={t('Previous')}
                  disabled={page === 1}
                  onPress={() =>
                    setPage((current) =>
                      Math.max(1, current - 1)
                    )
                  }
                />

                <Text
                  style={{
                    color: colors.text,
                  }}
                >
                  {t('Page')} {page}
                </Text>

                <Button
                  color={colors.accent}
                  title={t('Next')}
                  disabled={!hasNextPage}
                  onPress={() => {
                    setHasNextPage(false);

                    setPage(
                      (current) => current + 1
                    );
                  }}
                />
              </View>
            ) : null}
          </View>
        }

      
        renderItem={({ item }) => (
          <View
            style={[
              styles.gridItem,
              {
                maxWidth:
                  columns > 1
                    ? '48.4%'
                    : '100%',
              },
            ]}
          >
            <Card
              compact={columns > 1}
              {...getCardSummary(item)}
              description={item.description}
              englishDescription={item.description_en}
              onPress={() =>
                openDetails(item)
              }
            />
          </View>
        )}
      />
    </>
  );
}

// =============================================
// ESTILOS DE LA PANTALLA
// =============================================

const createStyles = (
  colors: RestaurantColors,
  isDark: boolean
) =>
  StyleSheet.create({
    masthead: {
      marginHorizontal: -18,
    },

    gridRow: {
      gap: 12,
      alignItems: 'flex-start',
    },

    gridItem: {
      flex: 1,
      maxWidth: '100%',
    },

    // -----------------------------------------
    // BUSCADOR
    // -----------------------------------------

    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 26,
      backgroundColor: colors.surface,
      marginTop: 20,
      paddingLeft: 12,
      overflow: 'hidden',
    },

    searchIcon: {
      color: colors.muted,
      fontSize: 23,
    },

    searchAction: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // -----------------------------------------
    // AUTOCOMPLETADO
    // -----------------------------------------

    suggestionsContainer: {
      marginTop: 6,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },

    suggestionsLoading: {
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },

    suggestionItem: {
      minHeight: 66,
      paddingHorizontal: 12,
      paddingVertical: 9,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    suggestionImage: {
      width: 48,
      height: 48,
      borderRadius: 10,
      resizeMode: 'cover',
    },

    suggestionTitle: {
      fontSize: 14,
      fontFamily: restaurantBrand.serif,
    },

    // -----------------------------------------
    // FILTROS
    // -----------------------------------------

    filtersToggle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 44,
      marginTop: 8,
    },

    filterLabel: {
      color: colors.muted,
      fontSize: 12,
    },

    filtersPanel: {
      padding: 12,
      gap: 8,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    // -----------------------------------------
    // TÍTULOS DE PRODUCTOS
    // -----------------------------------------

    sectionHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 18,
      marginBottom: 10,
    },

    sectionTitle: {
      fontSize: 25,
      fontFamily: restaurantBrand.serif,
      color: colors.text,
      flexShrink: 1,
    },

    sectionNote: {
      color: isDark ? '#D8B067' : colors.accent,
      fontSize: 12,
    },

    // -----------------------------------------
    // CARGA Y ERRORES
    // -----------------------------------------

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

    // -----------------------------------------
    // LISTA GENERAL
    // -----------------------------------------

    listContent: {
      padding: 18,
      paddingTop: 0,
      gap: 12,
    },

    eyebrow: {
       color: isDark ? '#D8B067' : colors.accent,
       fontSize: 10,
       letterSpacing: 2.5,
       fontWeight: '700',
       marginTop: -30,
       marginBottom: 5,
    },

    quickLinks: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 16,
    },

    quickLink: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 14,
      borderRadius: 24,
      backgroundColor: colors.soft,
    },

    quickLinkText: {
      color: colors.accent,
      fontWeight: '700',
    },

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

    // -----------------------------------------
    // BOTÓN DE ADMINISTRACIÓN
    // -----------------------------------------

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

    primaryActionText: {
      color: colors.onAccent,
      fontWeight: '700',
    },

    // -----------------------------------------
    // SELECTOR ANIMADO COMPACTO
    // -----------------------------------------

    areaFilters: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
      marginTop: 16,
      position: 'relative',
    },

    slidingIndicator: {
  position: 'absolute',
  left: 0,
  top: 0,
  height: 44,
  borderRadius: 22,

  backgroundColor: isDark ? '#801C18' : colors.accent,

  borderTopWidth: isDark ? 1 : 0,
  borderTopColor: '#A34437',

  borderBottomWidth: isDark ? 1 : 0,
  borderBottomColor: '#9B392A',

  borderLeftWidth: isDark ? 0.5 : 0,
  borderRightWidth: isDark ? 0.5 : 0,
  borderLeftColor: '#84241D',
  borderRightColor: '#84241D',
},

    areaFilter: {
      flex: 1,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },

    areaFilterText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },

    areaFilterTextSelected: {
      color: colors.onAccent,
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'center',
    },

    // -----------------------------------------
    // CAMPO DE BÚSQUEDA
    // -----------------------------------------

    searchInput: {
      flex: 1,
      minHeight: 46,
      color: colors.text,
      fontSize: 14,
      paddingVertical: 10,
      paddingHorizontal: 6,
    },

    // -----------------------------------------
    // DISPONIBILIDAD
    // -----------------------------------------

    availabilityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
    },

    // -----------------------------------------
    // PAGINACIÓN
    // -----------------------------------------

    pagination: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  });
