import { createContext, useContext, useState, type ReactNode } from 'react';

export interface CartLine {
  id: number;
  cardId: number;
  title: string;
  price: string;
  quantity: number;
  removals: string[];
  selections: { id: string; label: string }[];
  allergy: string;
  choices?: Record<string, string[]>;
  course?: 'starter' | 'main' | 'dessert' | 'drink';
}

let nextLineId = 0;
const CartContext = createContext<{
  lines: CartLine[];
  add: (line: Omit<CartLine, 'id'>) => void;
  remove: (ids: number[]) => void;
} | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  return (
    <CartContext.Provider value={{
      lines,
      add: (line) => {
        const id = ++nextLineId;
        setLines((current) => [...current, { ...line, id }]);
      },
      remove: (ids) => setLines((current) => current.filter((line) => !ids.includes(line.id))),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error('Missing cart provider.');
  return cart;
}
