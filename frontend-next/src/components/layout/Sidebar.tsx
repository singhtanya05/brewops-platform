"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, ChefHat, Truck, Package, ClipboardList } from 'lucide-react';
import { useAuthStore, Role } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  allowedRoles: Role[];
};

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useAuthStore();
  const { isSidebarOpen } = useUIStore();
  
  // Hydration fix for zustand persist
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems: NavItem[] = [
    { name: 'Storefront', href: '/', icon: <Store size={20} />, allowedRoles: ['GUEST', 'CUSTOMER'] },
    { name: 'My Orders', href: '/orders', icon: <ClipboardList size={20} />, allowedRoles: ['GUEST', 'CUSTOMER'] },
    { name: 'Kitchen Queue', href: '/kitchen', icon: <ChefHat size={20} />, allowedRoles: ['STAFF', 'ADMIN'] },
    { name: 'Suppliers & POs', href: '/suppliers', icon: <Truck size={20} />, allowedRoles: ['ADMIN'] },
    { name: 'Inventory Control', href: '/inventory', icon: <Package size={20} />, allowedRoles: ['ADMIN'] },
  ];

  const visibleItems = mounted ? navItems.filter(item => item.allowedRoles.includes(role)) : [];

  return (
    <aside 
      className={`absolute top-2.5 left-2.5 bottom-2.5 w-[220px] bg-card rounded-[24px] flex flex-col pt-6 z-10 shadow-[var(--shadow-clay-card)] border border-white/60 transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'
      }`}
    >
      
      {/* Navigation Links */}
      <nav className="flex flex-col gap-2 px-4">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                isActive 
                  ? 'bg-coffee text-white shadow-md' 
                  : 'text-text-secondary hover:bg-[#F2EFE9] hover:text-coffee'
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mascot Footer */}
      <div className="mt-auto pb-6 flex flex-col items-center">
        <div className="relative group cursor-pointer flex flex-col items-center">
          {/* Hover Bubble */}
          <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-3 py-1.5 rounded-lg shadow-lg text-sm font-bold text-coffee pointer-events-none">
            Hello! ☕
            {/* Arrow */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45"></div>
          </div>
          
          <div className="text-6xl filter drop-shadow-md group-hover:scale-110 transition-transform mb-2">🏺</div>
          <div className="font-outfit text-xs font-bold tracking-widest text-text-secondary uppercase">
            Caffeine
          </div>
        </div>
        
        <div className="text-[10px] text-text-secondary/60 mt-4 font-semibold">
          BrewOps Platform &copy; 2026
        </div>
      </div>

    </aside>
  );
}
