"use client";

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { useUIStore } from '@/store/useUIStore';

export function WorkspaceWrapper({ children }: { children: React.ReactNode }) {
  const { isSidebarOpen } = useUIStore();
  
  // Hydration fix
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex-1 flex overflow-hidden relative">
      <Sidebar />
      
      {/* Main Content Area (Where the specific pages render) */}
      <main 
        className={`flex-1 overflow-y-auto bg-[#F2EFE9] relative z-0 transition-all duration-300 ease-in-out ${
          mounted && isSidebarOpen ? 'ml-[240px]' : 'ml-0'
        }`}
      >
        {children}
      </main>

      {/* Slide-out Cart Drawer */}
      <CartDrawer />
    </div>
  );
}
