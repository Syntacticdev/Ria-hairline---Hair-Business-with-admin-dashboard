import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { CartItem, Product } from '../types';

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, size?: string) => void;
  removeItem: (productId: string, size?: string) => void;
  updateQty: (productId: string, quantity: number, size?: string) => void;
  clearCart: () => void;
  count: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = 'rh_cart';

const readStorage = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(readStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: Product, quantity = 1, size?: string) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.product._id === product._id && (it.size ?? undefined) === (size ?? undefined));
      if (existing) {
        return prev.map((it) =>
          it.product._id === product._id && (it.size ?? undefined) === (size ?? undefined)
            ? { ...it, quantity: Math.min(product.stock, it.quantity + quantity) }
            : it
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, quantity), size }];
    });
  }, []);

  const removeItem = useCallback((productId: string, size?: string) => {
    setItems((prev) =>
      prev.filter((it) => !(it.product._id === productId && (it.size ?? undefined) === (size ?? undefined)))
    );
  }, []);

  const updateQty = useCallback((productId: string, quantity: number, size?: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.product._id === productId && (it.size ?? undefined) === (size ?? undefined)
          ? { ...it, quantity: Math.max(1, Math.min(it.product.stock, quantity)) }
          : it
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const count = items.reduce((acc, it) => acc + it.quantity, 0);
  const subtotal = Math.round(items.reduce((acc, it) => acc + it.quantity * (it.product.finalPrice ?? it.product.price), 0) * 100) / 100;

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, count, subtotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};