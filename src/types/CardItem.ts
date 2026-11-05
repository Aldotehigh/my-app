export interface Category {
  id: number;
  name: string;
  area: 'kitchen' | 'bar';
}

export interface CardItem {
  id: string;
  title: string;
  image: string;
  description: string;
  backgroundColor: string;
  price: string;
  is_available: boolean;
  category: Category | null;
}