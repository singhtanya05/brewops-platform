import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from './useCartStore';

export type OrderStatus = 'paid' | 'brewing' | 'ready' | 'completed';

export interface Order {
  id: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

interface OrderState {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  getOrderById: (id: string) => Order | undefined;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      
      addOrder: (order) => set((state) => ({ 
        orders: [order, ...state.orders] 
      })),
      
      updateOrderStatus: (id, status) => set((state) => ({
        orders: state.orders.map(order => 
          order.id === id ? { ...order, status } : order
        )
      })),

      getOrderById: (id) => get().orders.find(order => order.id === id),
    }),
    {
      name: 'brewops-order-storage',
    }
  )
);
