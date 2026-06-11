"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, Menu, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { useCartStore } from '@/store/useCartStore';

export function Header() {
  const { role, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const { getTotalItems, toggleCart } = useCartStore();
  
  // Hydration fix for zustand persist
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const totalCartItems = mounted ? getTotalItems() : 0;

  return (
    <header className="h-[70px] bg-[#FAF8F5] border-b-2 border-[#E6E1D8] flex justify-between items-center px-6 shrink-0 z-10">
      
      {/* Logo Section */}
      <div className="flex items-center gap-2">
        <button 
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg bg-card shadow-[var(--shadow-clay-button)] border border-white/60 mr-2 active:scale-95 transition-all text-text-secondary hover:text-coffee"
        >
          <Menu size={20} />
        </button>
        <span className="text-[28px]" role="img" aria-label="logo">☕</span>
        <span className="font-outfit font-bold text-[24px] text-coffee tracking-wide">CAFFEINE</span>
      </div>

      {/* Search Bar */}
      <div className="w-[400px] relative hidden md:block">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-text-secondary" />
        </div>
        <input 
          type="text" 
          placeholder="Search drinks, suppliers, or orders..." 
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-none bg-[#F2EFE9] shadow-[var(--shadow-clay-input)] text-sm text-foreground outline-none focus:ring-2 focus:ring-coffee/20 transition-all"
        />
      </div>

      {/* User Profile / Actions */}
      <div className="flex items-center gap-3">
        {/* Status Badge */}
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-matcha text-white hidden sm:block">
          🟢 OPEN NOW
        </span>

        {/* Cart Button */}
        <button 
          onClick={toggleCart}
          className="relative p-2.5 rounded-[14px] bg-card border border-white/60 shadow-[var(--shadow-clay-button)] hover:opacity-90 active:shadow-[var(--shadow-clay-pressed)] active:scale-95 transition-all"
        >
          <ShoppingCart size={18} className="text-coffee" />
          {totalCartItems > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[9px] font-bold flex items-center justify-center border-2 border-white">
              {totalCartItems}
            </span>
          )}
        </button>

        {mounted && (
          <>
            {/* Role Pill */}
            <span 
              className={`px-3 py-1 rounded-full text-[11px] font-bold text-white uppercase tracking-wider ml-2 ${
                role === 'ADMIN' ? 'bg-orange' : 
                role === 'STAFF' ? 'bg-[#6A8EAD]' : 
                'bg-matcha'
              }`}
            >
              {role}
            </span>

            {role === 'GUEST' ? (
              <Link href="/login">
                <button className="px-5 py-2 rounded-xl bg-coffee text-white font-bold text-sm shadow-[var(--shadow-clay-button)] border border-white/20 active:shadow-[var(--shadow-clay-pressed)] active:scale-95 transition-all">
                  Login
                </button>
              </Link>
            ) : (
              <div className="flex items-center gap-3 ml-2">
                <div className="w-9 h-9 rounded-full bg-orange flex items-center justify-center font-bold text-white shadow-md">
                  {role.charAt(0)}
                </div>
                <button 
                  onClick={logout}
                  className="p-2 rounded-xl bg-card border border-white/60 shadow-[var(--shadow-clay-button)] hover:opacity-90 active:scale-95 transition-all text-red-500"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </header>
  );
}
