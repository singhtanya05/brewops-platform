"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMenu } from "@/lib/api";
import { ProductCard } from "@/components/ui/ProductCard";

export default function Home() {
  const { data: menuItems, isLoading, error } = useQuery({
    queryKey: ['menu'],
    queryFn: fetchMenu,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col p-8">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-coffee mb-4">BrewOps Storefront</h1>
        <p className="text-text-secondary text-lg">
          Select your favorite premium beverages and pastries.
        </p>
      </header>

      <main className="max-w-6xl mx-auto w-full">
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

        {menuItems && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {menuItems.map((item) => (
              <ProductCard 
                key={item.id} 
                item={item} 
                onAddToCart={(item) => console.log("Added to cart:", item.name)} 
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
