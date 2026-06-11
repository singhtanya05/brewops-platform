"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMenu, MenuProduct } from "@/lib/api";
import { ProductCard } from "@/components/ui/ProductCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CustomizationModal } from "@/components/ui/CustomizationModal";
import { useAuthStore } from "@/store/useAuthStore";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";

export default function Home() {
  const { role } = useAuthStore();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<{product: MenuProduct, categoryName: string} | null>(null);

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['menu'],
    queryFn: () => fetchMenu(),
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (role === 'STAFF' || role === 'ADMIN') {
    return <AdminDashboard />;
  }

  return (
    <div className="p-6">
      
      {/* 1. Hero Banner */}
      <div className="bg-gradient-to-br from-[#4A3728] to-[#2E2219] rounded-[24px] p-8 mb-8 flex items-center justify-between gap-6 text-white shadow-[0_16px_32px_rgba(0,0,0,0.25)] relative mt-4">
        <div className="flex-1 z-10 pl-2">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange uppercase tracking-wide">🌱 SINGLE-ORIGIN</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-matcha uppercase tracking-wide">⚡ 3-MIN PREP</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#6A8EAD] uppercase tracking-wide">🛡️ SECURE PAY</span>
          </div>
          <h1 className="font-outfit text-[32px] font-bold leading-[1.2] mb-3 text-shadow-sm">
            Fuel Your Day,<br/>Handcrafted Fresh.
          </h1>
          <p className="text-[#E2DDD5] text-[13px] mb-6 max-w-md leading-relaxed">
            Directly sourced organic beans, curated barista signatures, and real-time kitchen tracking right to your hands.
          </p>
          <button className="px-6 py-3 rounded-full bg-gradient-to-br from-[#A8C9A8] to-[#7DA07A] text-white font-bold text-[16px] shadow-[0_10px_20px_rgba(125,160,122,0.4)] border-none hover:opacity-90 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all">
            Order Brews Now
          </button>
        </div>
        
        {/* Decorative elements */}
        <div className="hidden md:flex flex-1 justify-center items-center relative z-10 min-h-[250px]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[radial-gradient(circle,rgba(239,168,80,0.4)_0%,rgba(255,255,255,0)_70%)] blur-[30px] z-0 animate-pulse-glow pointer-events-none"></div>
          <img 
            src="/img/coffee.png" 
            alt="Coffee cup" 
            className="absolute -right-4 -top-16 w-[320px] h-[320px] object-contain z-10 filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.55)] pointer-events-none animate-float-cup"
          />
        </div>
      </div>

      <h2 className="font-outfit text-2xl font-bold text-foreground mb-5">Handcrafted Drink Menu</h2>

      {/* 2. Category Tabs */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button 
          onClick={() => setActiveTab('all')}
          className={`px-5 py-2.5 rounded-xl font-outfit font-bold text-[14px] transition-all duration-200 outline-none ${
            activeTab === 'all'
              ? 'bg-coffee text-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.1)]'
              : 'bg-card text-foreground shadow-[var(--shadow-clay-button)] hover:shadow-[2px_2px_4px_#DDD9D0,-2px_-2px_4px_#FFFFFF]'
          }`}
        >
          All Drinks
        </button>
        {categories?.map((cat) => (
          <button 
            key={cat.categoryId}
            onClick={() => setActiveTab(cat.categoryId)}
            className={`px-5 py-2.5 rounded-xl font-outfit font-bold text-[14px] transition-all duration-200 outline-none ${
              activeTab === cat.categoryId
                ? 'bg-coffee text-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.1)]'
                : 'bg-card text-foreground shadow-[var(--shadow-clay-button)] hover:shadow-[2px_2px_4px_#DDD9D0,-2px_-2px_4px_#FFFFFF]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="mb-12">
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl text-center">
            Failed to load the menu. Is the backend running?
          </div>
        )}

        {categories && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
            {categories
              .filter(cat => activeTab === 'all' || activeTab === cat.categoryId)
              .flatMap(category => 
                category.products.map(product => (
                  <ProductCard 
                    key={product.productId} 
                    product={product}
                    categoryName={category.name}
                    onAddToCart={(prod) => setSelectedItem({ product: prod, categoryName: category.name })} 
                  />
                ))
              )}
          </div>
        )}
      </div>

      {/* 3. Customer Testimonials */}
      <h3 className="text-xl font-bold text-coffee mt-12 mb-4">What Our Customers Say</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Card className="p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-sm">Liam H.</span>
            <span className="text-orange text-xs">⭐⭐⭐⭐⭐</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            "The Signature Latte is absolutely smooth. I ordered from my phone and could watch the real-time tracker show exactly when the barista finished. Amazing UX!"
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-sm">Sophia R.</span>
            <span className="text-orange text-xs">⭐⭐⭐⭐⭐</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            "Best iced cold brews in town! Plus the interface feels so clicky and premium. It makes ordering my morning coffee a pleasant daily routine."
          </p>
        </Card>
      </div>

      {/* 4. Footer */}
      <footer className="border-t-2 border-dashed border-[#E6E1D8] pt-8 pb-4 flex flex-col md:flex-row justify-between items-center text-text-secondary text-xs gap-4">
        <div>
          <strong className="text-coffee">📍 Caffeine Downtown</strong><br />
          100 Brew Street, Open Daily: 7 AM - 8 PM
        </div>
        <div className="text-right">
          Handcrafted with care by BrewOps Platform<br />
          Support: support@caffeine.local
        </div>
      </footer>

      {/* Customization Modal */}
      {selectedItem && (
        <CustomizationModal 
          product={selectedItem.product} 
          categoryName={selectedItem.categoryName}
          onClose={() => setSelectedItem(null)} 
        />
      )}

    </div>
  );
}
