export interface Category {
  id: number;
  name: string;
  area: 'kitchen' | 'bar';
}

export interface CardPresentation {
  id: number;
  title: string;
  presentation: 'full' | 'half' | 'glass' | 'bottle' | 'thin' | 'thick'
    | 'vegetables' | 'beef' | 'chicken' | 'white_fish' | 'shrimp' | 'octopus' | 'salmon' | 'ribeye' | 'combo'
    | 'gyo_beef' | 'ebi' | 'mixed';
  price: string;
  image: string | null;
  description: string | null;
  is_available: boolean;
}

export interface OrderChoice {
  label: string;
  count: number;
  options: { id: string; label: string }[];
}

export interface CardItem {
  order_choice?: OrderChoice | null;
  display_title?: string;
  allowed_removals?: string[];
  presentations?: CardPresentation[];
  id: string;
  title: string;
  image: string;
  description: string;
  backgroundColor: string;
  price: string;
  is_available: boolean;
  category: Category | null;
}