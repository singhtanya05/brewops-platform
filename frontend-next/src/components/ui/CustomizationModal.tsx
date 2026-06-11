"use client";

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/api';
import { useCartStore } from '@/store/useCartStore';

interface CustomizationModalProps {
  product: Product;
  categoryName: string;
  onClose: () => void;
}

export function CustomizationModal({ product, categoryName, onClose }: CustomizationModalProps) {
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [milkOption, setMilkOption] = useState('Whole');
  const [sweetness, setSweetness] = useState('Regular');
  const addItem = useCartStore((state) => state.addItem);

  const basePrice = product.variants && product.variants.length > 0 
    ? product.variants[0].price 
    : 0;

  const variantId = product.variants && product.variants.length > 0 
    ? product.variants[0].variantId 
    : product.productId;

  const showCoffeeOptions = categoryName === 'Coffee' || categoryName === 'Matcha' || categoryName === 'Cold Fusions';

  const calculateTotal = () => {
    let total = basePrice;
    if (showCoffeeOptions) {
      if (milkOption === 'Oat' || milkOption === 'Almond' || milkOption === 'Soy') {
        total += 0.50;
      }
    }
    return total * quantity;
  };

  const handleAddToCart = () => {
    let customizations = notes;
    if (showCoffeeOptions) {
      customizations = `${milkOption} Milk, ${sweetness} Sweetness${notes ? ` | ${notes}` : ''}`;
    }

    addItem({
      id: `${variantId}-${Date.now()}`,
      productId: product.productId,
      variantId: variantId,
      name: product.name,
      price: calculateTotal() / quantity, // Price per unit with addons
      quantity,
      customizations,
      imageUrl: product.imageUrl
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-[400px] rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.2)] p-6 relative border border-white/60 animate-in zoom-in-95 duration-200">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F2EFE9] text-text-secondary flex items-center justify-center font-bold hover:bg-[#E6E1D8] transition-colors"
        >
          ✕
        </button>

        <h2 className="font-outfit text-2xl font-bold text-coffee mb-1">{product.name}</h2>
        <p className="text-text-secondary text-sm mb-6">${basePrice.toFixed(2)} Base Price</p>

        {showCoffeeOptions && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-bold text-text-secondary mb-2">Milk Choice</label>
              <div className="flex flex-col gap-2">
                {['Whole', 'Oat', 'Almond', 'Soy'].map((milk) => (
                  <label key={milk} className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="milkOption" 
                      value={milk}
                      checked={milkOption === milk}
                      onChange={() => setMilkOption(milk)}
                      className="w-4 h-4 text-coffee bg-[#F2EFE9] border-[#D4CFC7] focus:ring-coffee"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {milk} Milk {milk !== 'Whole' ? '(+$0.50)' : ''}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-text-secondary mb-2">Sweetness</label>
              <div className="flex flex-col gap-2">
                {['Regular', 'Less Sweet', 'Unsweetened'].map((sw) => (
                  <label key={sw} className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="sweetness" 
                      value={sw}
                      checked={sweetness === sw}
                      onChange={() => setSweetness(sw)}
                      className="w-4 h-4 text-coffee bg-[#F2EFE9] border-[#D4CFC7] focus:ring-coffee"
                    />
                    <span className="text-sm font-medium text-foreground">{sw}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="mb-6">
          <label className="block text-sm font-bold text-text-secondary mb-2">Special Instructions</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any other specific requests?"
            className="w-full h-20 p-3 rounded-xl bg-[#F2EFE9] border-none shadow-[var(--shadow-clay-input)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-coffee/20"
          />
        </div>

        <div className="flex justify-between items-center mb-8">
          <label className="text-sm font-bold text-text-secondary">Quantity</label>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-full bg-card shadow-[var(--shadow-clay-button)] flex items-center justify-center text-lg font-bold hover:opacity-90 active:scale-95 text-foreground"
            >
              -
            </button>
            <span className="font-bold w-6 text-center text-foreground">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-full bg-card shadow-[var(--shadow-clay-button)] flex items-center justify-center text-lg font-bold hover:opacity-90 active:scale-95 text-foreground"
            >
              +
            </button>
          </div>
        </div>

        <button 
          onClick={handleAddToCart}
          className="w-full py-3.5 rounded-full bg-coffee text-white font-bold shadow-[0_8px_16px_rgba(74,55,40,0.2)] hover:opacity-90 active:scale-95 transition-all text-lg"
        >
          Add to Order - ${(calculateTotal()).toFixed(2)}
        </button>

      </div>
    </div>
  );
}
