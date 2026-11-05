import { useAuth } from '../../context/AuthContext';
import { announce } from '../../utils/announce';
import { usePreferences } from '../../context/PreferencesContext';
import type { RestaurantColors } from '../../constants/restaurantColors';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  deleteCard,
  getCard,
  getFavoriteStatus,
  setCardFavorite,
  updateCardAvailability,
} from '../../services/cards';
import type { CardItem } from '../../types/CardItem';

export default function DetailScreen() {
  const { colors, t } = usePreferences();
  const styles = createStyles(colors);

  const { id } = useLocalSearchParams<{ id: string }>();
  const [card, setCard] = useState<CardItem | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [isFavorite, setIsFavorite] = useState<boolean | null>(null);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const canUpdateAvailability = Boolean(
    user?.can_manage_menu || (user?.area && card?.category?.area === user.area),
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadDetails() {
        setLoading(true);
        setIsFavorite(null);

        try {
          const fresh = await getCard(Number(id));
          if (!isActive) return;

          setCard(fresh);

          try {
            const favoriteStatus = await getFavoriteStatus(Number(id));

            if (isActive) {
              setIsFavorite(favoriteStatus.is_favorite);
            }
          } catch (err) {
            if (isActive) {
              console.error('Could not load favorite status:', err);
            }
          }
        } catch (err) {
          if (isActive) {
            setCard(null);
            console.error('Could not load card details:', err);
            Alert.alert(t("Error"), t("Could not load dish"));
          }
        } finally {
          if (isActive) setLoading(false);
        }
      }

      void loadDetails();

      return () => {
        isActive = false;
      };
    }, [id, reloadKey, t]),
  );

  const handleToggleFavorite = async () => {
    if (!card || isFavorite === null || savingFavorite) return;

    setSavingFavorite(true);

    try {
      const result = await setCardFavorite(Number(card.id), !isFavorite);
      setIsFavorite(result.is_favorite);
      announce(t(result.is_favorite ? 'Added to favorites' : 'Removed from favorites'));
    } catch (err) {
      Alert.alert(
        t("Error"),
        err instanceof Error ? err.message : t("Could not update favorite"),
      );
    } finally {
      setSavingFavorite(false);
    }
  };

  const handleAvailabilityChange = async () => {
    if (!card || !canUpdateAvailability || savingAvailability) return;
    setSavingAvailability(true);
    try {
      const updated = await updateCardAvailability(Number(card.id), !card.is_available);
      setCard(updated);
      announce(t(updated.is_available ? 'Dish marked available' : 'Dish marked sold out'));
    } catch (err) {
      Alert.alert(t('Error'), err instanceof Error ? err.message : t('Could not update availability.'));
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleEdit = () => {
    router.push({
      pathname: '/form',
      params: { card: JSON.stringify(card) },
    });
  };

  const handleDelete = () => {
    if (!card) return;

    Alert.alert(t("Confirm"), t("Are you sure you want to delete this dish?"), [
      { text: t("Cancel"), style: 'cancel' },
      {
        text: t("Delete"),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCard(Number(card.id));
            router.back();
          } catch (err) {
            Alert.alert(
              t("Error"),
              err instanceof Error ? err.message : t("Could not delete"),
            );
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!card) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.text }}>{t("Could not load this dish.")}</Text>
        <Pressable accessibilityRole="button" style={styles.favoriteButton} onPress={() => setReloadKey((current) => current + 1)}>
          <Text style={styles.favoriteText}>{t("Retry")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {card.image ? (
        <Image accessible={false} source={{ uri: card.image }} style={styles.image} />
      ) : null}

      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>{card.title}</Text>
        <Text style={styles.price}>${card.price} MXN</Text>
        <Text style={styles.description}>{card.description}</Text>

        {isFavorite === null ? (
          <View style={{ gap: 12 }}>
            <Text style={styles.description}>
              {t("Could not load favorite status.")}</Text>
            <Pressable accessibilityRole="button" style={styles.favoriteButton} onPress={() => setReloadKey((current) => current + 1)}>
              <Text style={styles.favoriteText}>{t("Retry")}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={handleToggleFavorite}
            disabled={savingFavorite}
            accessibilityRole="button"
            accessibilityLabel={t(isFavorite ? 'Remove from favorites' : 'Save to favorites')}
            accessibilityState={{ selected: isFavorite === true, disabled: savingFavorite, busy: savingFavorite }}
            style={styles.favoriteButton}
          >
            {savingFavorite ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={styles.favoriteText}>
                {isFavorite ? t("♥ Remove from favorites") : t("♡ Save to favorites")}
              </Text>
            )}
          </Pressable>
        )}

        <Text style={styles.description}>
          {t(card.is_available ? 'Available' : 'Sold out')}
        </Text>
        {canUpdateAvailability ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: savingAvailability, busy: savingAvailability }}
            disabled={savingAvailability}
            onPress={handleAvailabilityChange}
            style={styles.favoriteButton}
          >
            {savingAvailability ? <ActivityIndicator color={colors.accent} /> : (
              <Text style={styles.favoriteText}>
                {t(card.is_available ? 'Mark sold out' : 'Mark available')}
              </Text>
            )}
          </Pressable>
        ) : null}
        {user?.can_manage_menu ? (
        <View style={styles.actions}>
          <Pressable
            onPress={handleEdit}
            style={[styles.button, styles.editButton]}
          >
            <Text style={styles.buttonText}>{t("Edit")}</Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            style={[styles.button, styles.deleteButton]}
          >
            <Text style={styles.buttonText}>{t("Delete")}</Text>
          </Pressable>
        </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: RestaurantColors) => StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.surface },
  image: { width: '100%', height: 250 },
  title: { fontSize: 30, fontWeight: '700', color: colors.text },
  description: { fontSize: 16, lineHeight: 24, color: colors.muted },
  content: {
    padding: 20,
    gap: 12,
  },
  price: { color: colors.accent, fontSize: 22, fontWeight: '700' },
  favoriteButton: {
    padding: 14,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.soft,
  },
  favoriteText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flexGrow: 1,
    flexBasis: 130,
    minHeight: 48,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: colors.accent,
  },
  deleteButton: {
    backgroundColor: colors.accent,
  },
  buttonText: {
    color: colors.onAccent,
    fontWeight: '600',
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
});