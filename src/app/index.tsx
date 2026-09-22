import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  FlatList, Pressable, 
  StyleSheet, 
  Text,
  View, } 
  from 'react-native';
import Card from '../components/card';
import { CardItem } from '../types/CardItem';


interface ApiProduct {
  id: number;
  title: string;
  image: string;
  description: string;
  
}

const adaptProductToCardItem = (p: ApiProduct): CardItem => ({
  id: String(p.id),
  title: p.title,
  image: p.image,
  description: p.description,
  backgroundColor: '#E3F2FD',
});

const API_URL = 'https://fakestoreapi.com/products?limit=10';

export default function HomeScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCards = useCallback(async () => {
    try {
      setError(null);

      const MOCK_DATA: CardItem[] = [
  {
    id: '1',
    title: 'SUPREME',
    image: 'https://picsum.photos/seed/2/400/200',
    description: 'Skate culture, exclusivity, and rebellious streetwear.',
    backgroundColor: '#E3F2FD',
  },
  {
    id: '2',
    title: 'PALACE',
    image: 'https://picsum.photos/seed/3/400/200',
    description: 'British skate culture, irreverence, and effortless street style.',
    backgroundColor: '#90CAF9',
  },
  {
    id: '3',
    title: 'POLO X PALACE',
    image: 'https://picsum.photos/seed/4/400/200',
    description: 'A fusion of art, skate culture, and bold streetwear.',
    backgroundColor: '#2196F3',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  return (
      <FlatList
        data={MOCK_DATA}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card
            title={item.title}
            image={item.image}
            description={item.description}
            onPress={() => router.push({ pathname: '/details', 
              params: { item: JSON.stringify(item) } })}
          />
            )}
        
      />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecedee',
    padding: 16,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },
});