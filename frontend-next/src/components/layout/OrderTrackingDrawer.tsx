"use client";

import React, { useEffect, useState } from 'react';
import { useUIStore } from '@/store/useUIStore';
import { useOrderStore } from '@/store/useOrderStore';

export function OrderTrackingDrawer() {
  const { isTrackingOpen, currentOrderId, closeTracking } = useUIStore();
  const { getOrderById } = useOrderStore();
  
  // Hydration fix
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const order = currentOrderId ? getOrderById(currentOrderId) : null;
  const status = order?.status || 'paid';

  const isBrewing = status === 'brewing' || status === 'ready' || status === 'completed';
  const isReady = status === 'ready' || status === 'completed';

  return (
    <>
      {/* Backdrop overlay */}
      {isTrackingOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[80] animate-in fade-in duration-300"
          onClick={closeTracking}
        ></div>
      )}

      {/* The Drawer Panel */}
      <div 
        className={`fixed top-0 right-0 bottom-0 w-[400px] bg-card shadow-[var(--shadow-clay-card)] z-[90] transform transition-transform duration-300 ease-in-out flex flex-col ${
          isTrackingOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 pb-2 flex justify-end">
          <button 
            onClick={closeTracking}
            className="text-text-secondary text-sm font-bold flex items-center gap-1 hover:text-coffee transition-colors"
          >
            ✕ Close
          </button>
        </div>

        <div className="px-8 pb-8 flex-1 overflow-y-auto">
          <h2 className="font-outfit text-2xl font-bold text-coffee mb-8">
            Order Tracking #{currentOrderId || '000000'}
          </h2>

          <div className="relative border-l-2 border-[#E6E1D8] ml-4 flex flex-col gap-8 pb-8">
            
            {/* Step 1 */}
            <div className={`relative pl-6 transition-all duration-500`}>
              <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-card border-[3px] border-matcha shadow-[var(--shadow-clay-button)] flex items-center justify-center z-10">
                <div className="w-2 h-2 rounded-full bg-matcha"></div>
              </div>
              <h3 className="font-bold text-foreground text-[16px] mb-1">Order Paid</h3>
              <p className="text-text-secondary text-[13px] leading-relaxed">
                Payment confirmed, waiting for barista.
              </p>
            </div>

            {/* Step 2 */}
            <div className={`relative pl-6 transition-all duration-500 ${isBrewing ? '' : 'opacity-50'}`}>
              <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-card border-[3px] shadow-[var(--shadow-clay-button)] flex items-center justify-center z-10 transition-colors ${isBrewing ? 'border-matcha' : 'border-[#E6E1D8]'}`}>
                {isBrewing && <div className="w-2 h-2 rounded-full bg-matcha"></div>}
              </div>
              <h3 className="font-bold text-foreground text-[16px] mb-1">Barista Brewing</h3>
              <p className="text-text-secondary text-[13px] leading-relaxed">
                Extraction and frothing phase in progress.
              </p>
            </div>

            {/* Step 3 */}
            <div className={`relative pl-6 transition-all duration-500 ${isReady ? '' : 'opacity-50'}`}>
              <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-card border-[3px] shadow-[var(--shadow-clay-button)] flex items-center justify-center z-10 transition-colors ${isReady ? 'border-matcha' : 'border-[#E6E1D8]'}`}>
                {isReady && <div className="w-2 h-2 rounded-full bg-matcha"></div>}
              </div>
              <h3 className="font-bold text-foreground text-[16px] mb-1">Ready for Pickup</h3>
              <p className="text-text-secondary text-[13px] leading-relaxed">
                Fresh brew at the counter. Enjoy!
              </p>
            </div>

          </div>

          <button 
            onClick={closeTracking}
            className="w-full mt-8 py-3.5 rounded-[16px] bg-card text-foreground font-bold text-[15px] shadow-[var(--shadow-clay-button)] hover:shadow-[2px_2px_4px_#DDD9D0,-2px_-2px_4px_#FFFFFF] active:shadow-[var(--shadow-clay-pressed)] active:scale-95 transition-all"
          >
            Order Something Else
          </button>
        </div>
      </div>
    </>
  );
}
