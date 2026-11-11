import { japaneseDescription } from '../../utils/japaneseMenu';
import { OrderCustomizer } from '../../components/OrderCustomizer';
import { ingredientLabels, presentationLabels } from '../../utils/cardPresentations';
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
  const { colors, t, preferences } = usePreferences();
  const styles = createStyles(colors);

  const { id } = useLocalSearchParams<{ id: string }>();
  const [card, setCard] = useState<CardItem | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const isCustomer = user?.role === 'customer';
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [isFavorite, setIsFavorite] = useState<boolean | null>(null);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [selection, setSelection] = useState<{ cardId: string; optionId: number } | null>(null);
  const presentations = card?.presentations ?? [];
  const selected = presentations.find((option) =>
    selection?.cardId === id && selection.optionId === option.id,
  ) ?? presentations.find((option) => option.is_available) ?? presentations[0];
  const flavors = [...new Set(presentations.map((option) => option.flavor).filter((value): value is string => Boolean(value)))];
  const visiblePresentations = flavors.length
    ? presentations.filter((option) => option.flavor === selected?.flavor)
    : presentations;
  const hasIngredients = presentations.some((option) => option.presentation in ingredientLabels);
  const optionLabels = { ...presentationLabels, ...ingredientLabels };
  const image = selected?.image || card?.image || presentations.find((option) => option.image)?.image;
  const isAvailable = selected?.is_available ?? card?.is_available ?? false;
  const [savingAvailability, setSavingAvailability] = useState(false);
  const canEditMenu = Boolean(user?.can_manage_menu || (
    user?.can_edit_menu && user.area === card?.category?.area
  ));
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

          if (isCustomer) try {
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
    }, [id, reloadKey, t, isCustomer]),
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
      const optionId = selected?.id ?? Number(card.id);
      const updated = await updateCardAvailability(optionId, !isAvailable);
      if (selected) setSelection({ cardId: id, optionId });
      setCard({
        ...card,
        is_available: optionId === Number(card.id) ? updated.is_available : card.is_available,
        presentations: card.presentations?.map((option) =>
          option.id === optionId ? { ...option, is_available: updated.is_available } : option,
        ),
      });
      announce(t(updated.is_available ? 'Dish marked available' : 'Dish marked sold out'));
    } catch (err) {
      Alert.alert(t('Error'), err instanceof Error ? err.message : t('Could not update availability.'));
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleEdit = () => {
    if (!card) return;
    const editableCard = selected ? {
      ...card,
      ...selected,
      id: String(selected.id),
      image: selected.image ?? '',
      description: selected.description ?? '',
    } : card;
    router.push({
      pathname: '/form',
      params: { card: JSON.stringify(editableCard) },
    });
  };

  const handleDelete = () => {
    if (!card) return;

    const optionId = selected?.id ?? Number(card.id);
    if (presentations.length > 1 && optionId === Number(card.id)) {
      Alert.alert(t("Error"), t("Remove the linked presentations before deleting the main item."));
      return;
    }

    Alert.alert(t("Confirm"), t("Are you sure you want to delete this dish?"), [
      { text: t("Cancel"), style: 'cancel' },
      {
        text: t("Delete"),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCard(optionId);
            if (optionId === Number(card.id)) {
              router.back();
            } else {
              setReloadKey((current) => current + 1);
            }
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
      {image ? (
        <Image accessible={false} source={{ uri: image }} style={styles.image} />
      ) : null}

      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>{t(card.display_title ?? card.title)}</Text>
        {flavors.length ? (
          <View style={styles.presentationList}>
            <Text accessibilityRole="header" style={styles.presentationLabel}>{t('Choose an ingredient')}</Text>
            {flavors.map((flavor) => {
              const matching = presentations.filter((option) => option.flavor === flavor);
              const preferred = matching.find((option) => option.presentation === selected?.presentation && option.is_available)
                ?? matching.find((option) => option.is_available) ?? matching[0];
              return (
                <Pressable
                  key={flavor}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected?.flavor === flavor, disabled: savingAvailability }}
                  disabled={savingAvailability}
                  onPress={() => setSelection({ cardId: id, optionId: preferred.id })}
                  style={[styles.presentationOption, selected?.flavor === flavor && styles.presentationSelected]}
                >
                  <Text style={styles.presentationLabel}>{selected?.flavor === flavor ? '✓ ' : ''}{t(flavor)}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        {visiblePresentations.length > 1 ? (
          <View style={styles.presentationList}>
            <Text accessibilityRole="header" style={styles.presentationLabel}>{t(hasIngredients ? 'Choose an ingredient' : 'Presentation')}</Text>
            {visiblePresentations.map((option) => {
              const checked = selected?.id === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked, disabled: savingAvailability }}
                  disabled={savingAvailability}
                  onPress={() => setSelection({ cardId: id, optionId: option.id })}
                  style={[styles.presentationOption, checked && styles.presentationSelected]}
                >
                  <Text style={styles.presentationLabel}>
                    {checked ? '✓ ' : ''}{t(optionLabels[option.presentation] ?? option.title)}
                  </Text>
                  <Text style={styles.description}>
                    ${option.price} MXN{option.is_available ? '' : ' · ' + t('Sold out')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <Text style={styles.price}>${selected?.price ?? card.price} MXN</Text>
        <Text style={styles.description}>{(preferences.language === 'ja' && japaneseDescription(selected?.description || card.description)) || (preferences.language !== 'es' && (selected?.description_en?.trim() || (!selected?.description ? card.description_en?.trim() : undefined))) || selected?.description || card.description}</Text>

        {user?.role === 'customer' && isAvailable && card.category ? (
          <OrderCustomizer
            key={selected?.id ?? card.id}
            cardId={selected?.id ?? Number(card.id)}
            title={selected?.title ?? card.title}
            price={selected?.price ?? card.price}
            allowedRemovals={selected?.allowed_removals ?? card.allowed_removals ?? []}
            keepChoosing={flavors.length > 0}
            orderChoice={card.order_choice}
            orderProfile={selected?.order_profile ?? card.order_profile}
          />
        ) : null}

        {isCustomer ? (isFavorite === null ? (
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
        )) : null}

        <Text style={styles.description}>
          {t(isAvailable ? 'Available' : 'Sold out')}
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
                {t(isAvailable ? 'Mark sold out' : 'Mark available')}
              </Text>
            )}
          </Pressable>
        ) : null}
        {canEditMenu ? (
        <View style={styles.actions}>
          <Pressable
            onPress={handleEdit}
            style={[styles.button, styles.editButton]}
          >
            <Text style={styles.buttonText}>{t("Edit")}</Text>
          </Pressable>

          {user?.can_manage_menu ? <Pressable
            onPress={handleDelete}
            style={[styles.button, styles.deleteButton]}
          >
            <Text style={styles.buttonText}>{t("Delete")}</Text>
          </Pressable> : null}
        </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: RestaurantColors) => StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.surface },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
    backgroundColor: colors.surface,
  },
  title: { fontSize: 30, fontWeight: '700', color: colors.text },
  description: { fontSize: 16, lineHeight: 24, color: colors.muted },
  content: {
    padding: 20,
    gap: 12,
  },
  price: { color: colors.accent, fontSize: 22, fontWeight: '700' },
  presentationList: { gap: 8 },
  presentationOption: {
    minHeight: 48,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.muted,
    borderRadius: 8,
  },
  presentationSelected: { borderColor: colors.accent, backgroundColor: colors.soft },
  presentationLabel: { color: colors.text, fontWeight: '600', fontSize: 16 },
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