"use client";

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { OrderTrackingDrawer } from '@/components/layout/OrderTrackingDrawer';
import { useUIStore } from '@/store/useUIStore';
import { useOrderStore } from '@/store/useOrderStore';

export function WorkspaceWrapper({ children }: { children: React.ReactNode }) {
  const { isSidebarOpen } = useUIStore();
  
  // Hydration fix & Cross-tab sync
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    
    // Listen for changes from other tabs to create a "real-time" sync effect
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'brewops-order-storage') {
        useOrderStore.persist.rehydrate();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="flex-1 flex overflow-hidden relative">
      <Sidebar />
      
      {/* Main Content Area (Where the specific pages render) */}
      <main 
        className={`flex-1 overflow-y-auto bg-[#F2EFE9] relative z-0 transition-all duration-300 ease-in-out ${
          mounted && isSidebarOpen ? 'md:ml-[240px]' : 'ml-0'
        }`}
      >
        {children}
      </main>

      {/* Slide-out Cart Drawer */}
      <CartDrawer />
      
      {/* Slide-out Order Tracking Drawer */}
      <OrderTrackingDrawer />
    </div>
  );
}
