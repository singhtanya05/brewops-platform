import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { MenuItem } from '@/lib/api';

interface ProductCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export function ProductCard({ item, onAddToCart }: ProductCardProps) {
  return (
    <Card className="flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
      <div className="relative w-full h-48 rounded-xl bg-gradient-to-tr from-matcha/20 to-orange/20 flex items-center justify-center mb-4 overflow-hidden">
        {/* We use a fallback emoji if the image fails to load, or show the actual image */}
        <span className="text-6xl" role="img" aria-label={item.name}>
          {item.category === 'Coffee' ? '☕' : item.category === 'Tea' ? '🍵' : '🥐'}
        </span>
      </div>
      
      <div className="flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-coffee">{item.name}</h3>
          <span className="font-bold text-orange">${item.basePrice.toFixed(2)}</span>
        </div>
        <p className="text-text-secondary text-sm flex-grow mb-4">{item.description}</p>
        
        <Button 
          variant="primary" 
          className="w-full"
          onClick={() => onAddToCart(item)}
        >
          Add to Cart
        </Button>
      </div>
    </Card>
  );
}
