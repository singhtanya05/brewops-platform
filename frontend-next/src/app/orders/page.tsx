"use client";

import React, { useEffect, useState } from 'react';
import { useOrderStore } from '@/store/useOrderStore';
import { useUIStore } from '@/store/useUIStore';

export default function OrdersPage() {
  const { orders } = useOrderStore();
  const { openTracking } = useUIStore();
  
  // Hydration fix
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const activeOrders = orders.filter(o => o.status !== 'completed');
  const pastOrders = orders.filter(o => o.status === 'completed');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="font-outfit text-[32px] font-bold text-coffee mb-8 mt-4 text-shadow-sm">
        My Orders
      </h1>

      {orders.length === 0 ? (
        <div className="bg-card rounded-[24px] shadow-[var(--shadow-clay-card)] p-12 text-center border border-white/60">
          <div className="text-6xl mb-4 opacity-50">🛒</div>
          <h2 className="font-bold text-xl text-coffee mb-2">No orders yet</h2>
          <p className="text-text-secondary text-sm">When you place an order, it will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          
          {activeOrders.length > 0 && (
            <section>
              <h2 className="font-outfit text-xl font-bold text-foreground mb-4">Active Orders</h2>
              <div className="flex flex-col gap-4">
                {activeOrders.map(order => (
                  <div key={order.id} className="bg-card rounded-[24px] shadow-[var(--shadow-clay-card)] p-6 border border-white/60 flex flex-col md:flex-row justify-between items-center gap-4 transition-transform hover:-translate-y-1">
                    <div className="w-full md:w-auto">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg text-coffee">#{order.id}</span>
                        <span className="px-3 py-1 bg-matcha/20 text-matcha text-xs font-bold rounded-full uppercase">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mb-1">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {order.items.length} item(s) • ${order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => openTracking(order.id)}
                      className="w-full md:w-auto px-6 py-2.5 rounded-[16px] bg-coffee text-white font-bold text-[14px] shadow-[4px_4px_8px_#dbd6cb,-4px_-4px_8px_#ffffff,inset_2px_2px_4px_rgba(255,255,255,0.25),inset_-2px_-2px_4px_rgba(0,0,0,0.3)] hover:opacity-90 active:scale-95 transition-all"
                    >
                      Track Order
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {pastOrders.length > 0 && (
            <section>
              <h2 className="font-outfit text-xl font-bold text-foreground mb-4 mt-4">Past Orders</h2>
              <div className="flex flex-col gap-4">
                {pastOrders.map(order => (
                  <div key={order.id} className="bg-[#FAF8F5] rounded-[24px] shadow-[var(--shadow-clay-input)] p-6 flex flex-col md:flex-row justify-between items-center gap-4 opacity-80">
                    <div className="w-full md:w-auto">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg text-text-secondary">#{order.id}</span>
                        <span className="px-3 py-1 bg-gray-200 text-gray-500 text-xs font-bold rounded-full uppercase">
                          Completed
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mb-1">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-bold text-text-secondary">
                        {order.items.length} item(s) • ${order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    
                    <button 
                      className="w-full md:w-auto px-6 py-2.5 rounded-[16px] bg-card text-text-secondary font-bold text-[14px] shadow-[var(--shadow-clay-button)] active:shadow-[var(--shadow-clay-pressed)] active:scale-95 transition-all"
                    >
                      View Receipt
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}
