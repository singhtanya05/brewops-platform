import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  
  isTrackingOpen: boolean;
  currentOrderId: string | null;
  openTracking: (orderId: string) => void;
  closeTracking: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false, // Closed by default for customers
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  
  isTrackingOpen: false,
  currentOrderId: null,
  openTracking: (orderId) => set({ isTrackingOpen: true, currentOrderId: orderId }),
  closeTracking: () => set({ isTrackingOpen: false, currentOrderId: null }),
}));
