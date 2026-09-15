import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/card';

interface CardItem {
  id: string;
  title: string;
  image: string;
  description: string;
  backgroundColor: string;
}

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

const App = () => {
  const handlePressCard = (item: CardItem) => {
    console.log('Tarjeta presionada:', item.title);
  }
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={MOCK_DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            title={item.title}
            image={item.image}
            description={item.description}
            backgroundColor={item.backgroundColor}
            onPress={() => handlePressCard(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

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

export default App;

 