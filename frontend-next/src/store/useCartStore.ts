import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/lib/api';

export interface CartItem {
  id: string; // unique ID for the cart item (usually combination of variantId + customizations)
  productId: string;
  variantId: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: string;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (isOpen: boolean) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,
      
      addItem: (newItem) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex((item) => item.id === newItem.id);
          
          if (existingItemIndex >= 0) {
            // Item exists, just increment quantity
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += newItem.quantity;
            return { items: updatedItems, isCartOpen: true }; // Open cart when item added
          } else {
            // New item
            return { items: [...state.items, newItem], isCartOpen: true };
          }
        });
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      
      updateQuantity: (id, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((item) => item.id !== id) };
          }
          return {
            items: state.items.map((item) => 
              item.id === id ? { ...item, quantity } : item
            )
          };
        });
      },
      
      clearCart: () => set({ items: [] }),
      
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      }
    }),
    {
      name: 'brewops-cart-storage',
    }
  )
);
