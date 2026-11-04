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
import { colors } from '../../constants/restaurantColors';
import {
  deleteCard,
  getCard,
  getFavoriteStatus,
  setCardFavorite,
} from '../../services/cards';
import type { CardItem } from '../../types/CardItem';

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [card, setCard] = useState<CardItem | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState<boolean | null>(null);
  const [savingFavorite, setSavingFavorite] = useState(false);

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
            Alert.alert('Error', 'No se pudo cargar el platillo');
          }
        } finally {
          if (isActive) setLoading(false);
        }
      }

      void loadDetails();

      return () => {
        isActive = false;
      };
    }, [id]),
  );

  const handleToggleFavorite = async () => {
    if (!card || isFavorite === null || savingFavorite) return;

    setSavingFavorite(true);

    try {
      const result = await setCardFavorite(Number(card.id), !isFavorite);
      setIsFavorite(result.is_favorite);
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'No se pudo actualizar el favorito',
      );
    } finally {
      setSavingFavorite(false);
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

    Alert.alert('Confirmar', '¿Seguro que quieres eliminar este platillo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCard(Number(card.id));
            router.back();
          } catch (err) {
            Alert.alert(
              'Error',
              err instanceof Error ? err.message : 'No se pudo eliminar',
            );
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!card) {
    return (
      <View style={styles.centered}>
        <Text>No se encontró el platillo</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {card.image ? (
        <Image source={{ uri: card.image }} style={styles.image} />
      ) : null}

      <View style={styles.content}>
        <Text style={styles.title}>{card.title}</Text>
        <Text style={styles.price}>${card.price} MXN</Text>
        <Text style={styles.description}>{card.description}</Text>

        {isFavorite === null ? (
          <Text style={styles.description}>
            No se pudo consultar el estado del favorito.
          </Text>
        ) : (
          <Pressable
            onPress={handleToggleFavorite}
            disabled={savingFavorite}
            accessibilityRole="button"
            accessibilityState={{ disabled: savingFavorite, busy: savingFavorite }}
            style={styles.favoriteButton}
          >
            {savingFavorite ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={styles.favoriteText}>
                {isFavorite ? '♥ Quitar de favoritos' : '♡ Guardar en favoritos'}
              </Text>
            )}
          </Pressable>
        )}

        <View style={styles.actions}>
          <Pressable
            onPress={handleEdit}
            style={[styles.button, styles.editButton]}
          >
            <Text style={styles.buttonText}>Editar</Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            style={[styles.button, styles.deleteButton]}
          >
            <Text style={styles.buttonText}>Eliminar</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
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