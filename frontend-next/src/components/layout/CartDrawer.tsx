"use client";

import React, { useEffect, useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useUIStore } from '@/store/useUIStore';
import { useOrderStore } from '@/store/useOrderStore';
import { PaymentModal } from '@/components/ui/PaymentModal';

export function CartDrawer() {
  const { isCartOpen, items, toggleCart, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();
  const { openTracking } = useUIStore();
  const { addOrder } = useOrderStore();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  
  // Hydration fix
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleCheckoutClick = () => {
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = () => {
    const mockOrderId = String(Math.floor(100000 + Math.random() * 900000));
    
    // Save to persistent order store
    addOrder({
      id: mockOrderId,
      items: [...items],
      totalAmount: getTotalPrice(),
      status: 'paid',
      createdAt: new Date().toISOString()
    });

    setIsPaymentOpen(false);
    clearCart();
    toggleCart();
    
    openTracking(mockOrderId);
  };

  return (
    <>
      {/* Backdrop overlay */}
      {isCartOpen && !isPaymentOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          onClick={toggleCart}
        ></div>
      )}

      {/* The Drawer Panel */}
      <div 
        className={`fixed top-0 right-0 bottom-0 w-[350px] bg-card shadow-[var(--shadow-clay-card)] z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isCartOpen && !isPaymentOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 border-b-2 border-dashed border-[#E6E1D8] flex justify-between items-center">
          <h2 className="font-outfit text-2xl font-bold text-coffee">Your Order</h2>
          <button 
            onClick={toggleCart}
            className="w-8 h-8 rounded-full bg-[#F2EFE9] flex items-center justify-center font-bold text-text-secondary hover:bg-[#E6E1D8]"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {items.length === 0 ? (
            <div className="text-center text-text-secondary mt-12">
              <span className="text-4xl mb-4 block opacity-50">🛒</span>
              Your cart is empty.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="bg-[#F2EFE9] p-4 rounded-[16px] shadow-[var(--shadow-clay-input)] flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-[14px] text-foreground">{item.name}</h4>
                    {item.customizations && (
                      <p className="text-[11px] text-text-secondary italic">Note: {item.customizations}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="text-red-400 hover:text-red-600 text-xs font-bold"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold text-coffee text-[14px]">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  
                  <div className="flex items-center gap-2 bg-card rounded-full p-1 shadow-[var(--shadow-clay-button)]">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold hover:bg-[#E6E1D8]"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold w-4 text-center text-foreground">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold hover:bg-[#E6E1D8]"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t-2 border-[#E6E1D8] bg-[#FAF8F5]">
          <div className="flex justify-between items-center mb-6">
            <span className="font-bold text-text-secondary">Subtotal</span>
            <span className="font-bold text-xl text-coffee">${getTotalPrice().toFixed(2)}</span>
          </div>
          
          <button 
            onClick={handleCheckoutClick}
            disabled={items.length === 0}
            className="w-full py-3.5 rounded-[16px] bg-coffee text-white font-bold text-[16px] shadow-[4px_4px_8px_#dbd6cb,-4px_-4px_8px_#ffffff,inset_2px_2px_4px_rgba(255,255,255,0.25),inset_-2px_-2px_4px_rgba(0,0,0,0.3)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
          >
            Checkout Securely
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentOpen && (
        <PaymentModal 
          totalAmount={getTotalPrice()}
          onClose={() => setIsPaymentOpen(false)}
          onPay={handlePaymentSuccess}
        />
      )}
    </>
  );
}
