export interface Category {
  id: number;
  name: string;
  area: 'kitchen' | 'bar' | 'sushi';
}

export interface CardPresentation {
  id: number;
  title: string;
  flavor?: string;
  order_profile?: OrderProfile;
  allowed_removals?: string[];
  presentation: 'full' | 'half' | 'glass' | 'bottle' | 'thin' | 'thick'
    | 'vegetables' | 'beef' | 'chicken' | 'white_fish' | 'shrimp' | 'octopus' | 'salmon' | 'ribeye' | 'combo'
    | 'gyo_beef' | 'ebi' | 'mixed';
  price: string;
  image: string | null;
  description_en?: string;
  description: string | null;
  is_available: boolean;
}

export interface OrderChoice {
  label: string;
  count: number;
  options: { id: string; label: string }[];
}

export interface OrderOption extends OrderChoice {
  min_count?: number;
  warning?: string;
  key: string;
  optional: boolean;
  distinct: boolean;
  requires_ids?: string[];
  options: { id: string; label: string; price?: string }[];
}

export interface OrderProfile {
  groups: OrderOption[];
  show_allergy: boolean;
  show_removals: boolean;
  highest_price: boolean;
  notice: string;
  bar: boolean;
  alcohol_free?: boolean;
  course: 'starter' | 'main' | 'dessert' | 'drink';
}

export interface CardItem {
  order_profile?: OrderProfile;
  order_choice?: OrderChoice | null;
  display_title?: string;
  allowed_removals?: string[];
  presentations?: CardPresentation[];
  id: string;
  title: string;
  image: string;
  description_en?: string;
  description: string;
  backgroundColor: string;
  price: string;
  is_available: boolean;
  category: Category | null;
}