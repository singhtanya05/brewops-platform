import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { MenuProduct } from '@/lib/api';

interface ProductCardProps {
  product: MenuProduct;
  categoryName: string;
  onAddToCart: (product: MenuProduct) => void;
}

export function ProductCard({ product, categoryName, onAddToCart }: ProductCardProps) {
  // Use the price of the first variant, or 0 if none
  const basePrice = product.variants && product.variants.length > 0 
    ? product.variants[0].price 
    : 0;
  const price = basePrice;

  let bgGradient = 'radial-gradient(circle, #FBF7F4 0%, #F1E9E4 100%)';
  if (categoryName === 'Matcha') bgGradient = 'radial-gradient(circle, #F2F8F2 0%, #E3EEE3 100%)';
  else if (categoryName === 'Cold Fusions') bgGradient = 'radial-gradient(circle, #EBF3F8 0%, #D4E5F0 100%)';
  else if (categoryName === 'Bakery') bgGradient = 'radial-gradient(circle, #FCF8F2 0%, #F5EADB 100%)';

  return (
    <div className="bg-card rounded-[24px] shadow-[var(--shadow-clay-card)] p-4 flex flex-col relative transition-all duration-200 border border-white/60 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(74,55,40,0.08),-6px_-6px_16px_#ffffff] group">
      
      {/* Top: Drink illustration box */}
      <div 
        className="w-full h-[180px] shrink-0 mb-0 flex justify-center items-center rounded-2xl shadow-[var(--shadow-clay-input)] border border-white/70 relative overflow-hidden transition-transform duration-200"
        style={{ background: bgGradient }}
      >
        {/* Glossy highlight overlay */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/45 to-transparent pointer-events-none rounded-t-2xl"></div>
        
        {/* Floating image/emoji */}
        {product.imageUrl ? (
          <img 
            src={`/img/${product.imageUrl.split('/').pop()}`} 
            alt={product.name} 
            className="h-[120px] object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)] -rotate-6 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-[80px] inline-block filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)] -rotate-6 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6">${categoryName === 'Coffee' ? '☕' : categoryName === 'Tea' ? '🍵' : '🥐'}</span>`;
            }}
          />
        ) : (
          <span className="text-[80px] inline-block filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)] -rotate-6 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6" role="img" aria-label={product.name}>
            {categoryName === 'Coffee' ? '☕' : categoryName === 'Tea' ? '🍵' : '🥐'}
          </span>
        )}
      </div>

      {/* Bottom: Drink Details */}
      <div className="flex flex-col gap-1 p-1 mt-3 h-full">
        <div className="font-outfit text-[16px] mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis text-foreground font-bold">
          {product.name}
        </div>
        <div className="text-[12px] text-text-secondary leading-[1.3] mb-3 line-clamp-2 overflow-hidden h-[31px]">
          {product.description || (product.variants && product.variants.length > 0 ? product.variants[0].name : '')}
        </div>
        
        <div className="mt-auto flex justify-between items-center w-full">
          <span className="text-[16px] font-bold text-foreground">
            ${price.toFixed(2)}
          </span>
          <button 
            className="px-4 py-1.5 text-[12px] rounded-[20px] bg-coffee text-white font-bold shadow-[4px_4px_8px_#dbd6cb,-4px_-4px_8px_#ffffff,inset_2px_2px_4px_rgba(255,255,255,0.25),inset_-2px_-2px_4px_rgba(0,0,0,0.3)] hover:opacity-90 active:scale-95 transition-all"
            onClick={() => onAddToCart(product)}
          >
            Add to Cart +
          </button>
        </div>
      </div>

    </div>
  );
}
