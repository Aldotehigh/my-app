
import { getCardSummary } from '../../utils/cardPresentations';
import { usePreferences } from '../../context/PreferencesContext';
import type { RestaurantColors } from '../../constants/restaurantColors';
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
import { getFavoritesPage } from '../../services/cards';
import type { CardItem } from '../../types/CardItem';
import { getMenuPageSize } from '../../utils/menuPreferences';

export default function FavoritesScreen() {
  const { colors, t, isDark } = usePreferences();
  const styles = createStyles(colors);

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
          const requestedPageSize = await getMenuPageSize();
          const firstPage = await getFavoritesPage(1, requestedPageSize);
          const pageSize = requestedPageSize;
          const lastPage = firstPage.next && pageSize > 0
            ? Math.ceil(firstPage.count / pageSize)
            : 1;

          if (!isActive) return;

          if (page > lastPage) {
            setPage(lastPage);
            return;
          }

          const data = page === 1
            ? firstPage
            : await getFavoritesPage(page, requestedPageSize);

          if (isActive) {
            setCards(data.results);
            setHasNextPage(Boolean(data.next));
          }
        } catch (err) {
          if (isActive) {
            setError(
              err instanceof Error
                ? err.message
                : t("Could not load favorites.")
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
    }, [page, reloadKey, t])
  );

  const headerLine = (
    <View
      pointerEvents="none"
      style={[
        styles.headerLine,
        {
          backgroundColor: isDark ? '#D8B067' : '#A34437',
        },
      ]}
    />
  );

  if (loading) {
    return (
      <View style={styles.screen}>
        {headerLine}
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={{ color: colors.text }}>
            {t("Loading favorites...")}
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screen}>
        {headerLine}
        <View style={styles.centered}>
          <Text style={{ color: colors.text }}>{error}</Text>
          <Button
            color={colors.accent}
            title={t("Retry")}
            onPress={() => setReloadKey((current) => current + 1)}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {headerLine}

      <FlatList
        style={styles.list}
        data={cards}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {t("Your favorites")}
            </Text>
            <Text style={styles.description}>
              {t("The dishes you want to enjoy again.")}
            </Text>
          </View>
        }
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text accessibilityRole="header" style={styles.title}>
              {t("Your list starts here...")}
            </Text>
            <Text style={styles.description}>
              {t("Open a dish from the menu and tap “Save to favorites”.")}
            </Text>
            <Button
              color={colors.accent}
              title={t("Explore menu")}
              onPress={() => router.replace('/(app)')}
            />
          </View>
        }
        ListFooterComponent={
          page > 1 || hasNextPage ? (
            <View style={styles.pagination}>
              <Button
                color={colors.accent}
                title={t("Previous")}
                disabled={page === 1}
                onPress={() => setPage(page - 1)}
              />
              <Text style={{ color: colors.text }}>
                {t("Page")} {page}
              </Text>
              <Button
                color={colors.accent}
                title={t("Next")}
                disabled={!hasNextPage}
                onPress={() => setPage(page + 1)}
              />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Card
            {...getCardSummary(item)}
            description={item.description}
            englishDescription={item.description_en}
            onPress={() =>
              router.push({
                pathname: '/details',
                params: { id: String(item.id) },
              })
            }
          />
        )}
      />
    </View>
  );
}

const createStyles = (colors: RestaurantColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerLine: {
      width: '100%',
      height: 2,
    },
    list: {
      flex: 1,
    },
    header: {
      gap: 8,
      marginBottom: 12,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.text,
    },
    description: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.muted,
    },
    empty: {
      padding: 24,
      gap: 16,
      borderRadius: 20,
      backgroundColor: colors.surface,
    },
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
      flexGrow: 1,
      backgroundColor: colors.background,
    },
    pagination: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  });
