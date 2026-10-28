import { useLocalSearchParams, useRouter } from 'expo-router'; //useRouter 
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet, Text, View
} from 'react-native';

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { deleteCard, getCard } from '../../services/cards'; // deleteCard
import { CardItem } from '../../types/CardItem';

export default function DetailScreen() {
  //const { item: itemString } = useLocalSearchParams<{ item: string }>();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [card, setCard] = useState<CardItem | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  //const item: CardItem = JSON.parse(itemString);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        try {
          setLoading(true);
          const fresh = await getCard(Number(id));
          if (isActive) setCard(fresh);
        } catch (err) {
          console.error('Error al cargar detalle:', err);
          Alert.alert('Error', 'No se pudo cargar la tarjeta');
        } finally {
          if (isActive) setLoading(false);
        }
      })();

      return () => {
        isActive = false;
      };
    }, [id])
  );

  const handleEdit = () => {
    router.push({
      pathname: '/form' as any,
      params: { card: JSON.stringify(card) },
    });
  };
  
  const handleDelete = () => {
    if (!card) return;
    Alert.alert(
      'Confirmar',
      '¿Seguro que quieres eliminar esta tarjeta?',
      [
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
                err instanceof Error ? err.message : 'No se pudo eliminar'
              );
            }
          },
        },
      ]
    );
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
        <Text>No se encontró la tarjeta</Text>
      </View>
    );
  }

  return (
    // <View style={styles.container}>
    //   <Image source={{ uri: item.image }} style={styles.image} />
    //   <Text style={styles.title}>{item.title}</Text>
    //   <Text style={styles.description}>{item.description}</Text>
    // </View>
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: card.image }} style={styles.image} />

      <View style={styles.content}>
        <Text style={styles.title}>{card.title}</Text>
        <Text style={styles.description}>{card.description}</Text>
        
        {/* Botones de acción */}
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
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width: '100%', height: 250 },
  title: { fontSize: 22, fontWeight: 'bold', padding: 16 },
  description: { fontSize: 16, paddingHorizontal: 16, color: '#555' },
  content: {
    padding: 20,
    gap: 12,
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
    backgroundColor: '#333',
  },
  deleteButton: {
    backgroundColor: '#c0392b',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});


/*import { useLocalSearchParams } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import { CardItem } from "../types/CardItem";

export default function DetailScreen() {
    const { item: itemString } = useLocalSearchParams<{ item: string }>();
    const item: CardItem = JSON.parse(itemString);

    return (
        <View style={styles.container}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    image: {
        width: '100%',
        height: 200,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        padding: 16,
    },
    description: {
        fontSize: 16,
        paddingHorizontal: 16,
        color: '#555',
    },
});*/