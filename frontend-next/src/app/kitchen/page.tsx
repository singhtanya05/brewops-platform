"use client";

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKitchenOrders, updateKitchenOrderStatus } from '@/lib/api';

type OrderStatus = 'paid' | 'brewing' | 'ready' | 'completed';

export default function KitchenPage() {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: orders = [] } = useQuery({
    queryKey: ['kitchenOrders'],
    queryFn: () => getKitchenOrders(),
    refetchInterval: 3000, // Poll every 3 seconds
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => updateKitchenOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] });
    },
  });

  if (!mounted) return null;

  const activeOrders = orders.filter((o: any) => o.status?.toLowerCase() !== 'completed');

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('orderId', orderId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, newStatus: OrderStatus) => {
    const orderId = e.dataTransfer.getData('orderId');
    if (orderId) {
      updateStatusMutation.mutate({ id: orderId, status: newStatus.toUpperCase() as OrderStatus });
    }
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    updateStatusMutation.mutate({ id, status: status.toUpperCase() as OrderStatus });
  };

  const renderColumn = (title: string, status: OrderStatus, bgTheme: string) => {
    const columnOrders = activeOrders.filter((o: any) => o.status?.toLowerCase() === status).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return (
      <div 
        className={`flex-1 rounded-[24px] shadow-[var(--shadow-clay-card)] p-4 flex flex-col min-h-[500px] border border-white/60 ${bgTheme}`}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, status)}
      >
        <h2 className="font-outfit text-xl font-bold text-coffee mb-4 flex justify-between items-center px-2">
          {title}
          <span className="bg-white/50 text-coffee px-3 py-1 rounded-full text-sm shadow-[var(--shadow-clay-input)]">
            {columnOrders.length}
          </span>
        </h2>

        <div className="flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
          {columnOrders.length === 0 ? (
            <div className="text-center text-text-secondary/60 font-bold italic mt-8">
              Drop orders here
            </div>
          ) : (
            columnOrders.map(order => (
              <div 
                key={order.id}
                draggable
                onDragStart={(e) => handleDragStart(e, order.id)}
                className="bg-white rounded-2xl p-4 shadow-[var(--shadow-clay-button)] cursor-grab active:cursor-grabbing hover:-translate-y-1 transition-transform border border-[#E6E1D8]"
              >
                <div className="flex justify-between items-start mb-2 border-b-2 border-dashed border-[#E6E1D8] pb-2">
                  <span className="font-bold text-coffee text-lg">#{order.orderNumber}</span>
                  <span className="text-xs text-text-secondary">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                
                <ul className="text-sm font-bold text-foreground space-y-2">
                  {order.items.map((item: any, idx: number) => (
                    <li key={idx} className="flex flex-col">
                      <div className="flex justify-between">
                        <span>{item.quantity}x {item.productName} ({item.variantName})</span>
                      </div>
                      {item.customizations && (
                        <span className="text-xs text-text-secondary ml-4 italic border-l-2 border-orange pl-2 mt-1">
                          {item.customizations}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                {/* Quick actions for mobile or without drag/drop */}
                <div className="mt-4 flex gap-2">
                  {status === 'paid' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="flex-1 py-1.5 rounded-lg bg-[#EBF3F8] text-[#6A8EAD] text-xs font-bold shadow-[var(--shadow-clay-input)] hover:bg-[#D4E5F0] transition-colors"
                    >
                      Start Brewing
                    </button>
                  )}
                  {status === 'preparing' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="flex-1 py-1.5 rounded-lg bg-[#F2F8F2] text-matcha text-xs font-bold shadow-[var(--shadow-clay-input)] hover:bg-[#E3EEE3] transition-colors"
                    >
                      Mark Ready
                    </button>
                  )}
                  {status === 'ready' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="flex-1 py-1.5 rounded-lg bg-gray-200 text-gray-600 text-xs font-bold shadow-[var(--shadow-clay-input)] hover:bg-gray-300 transition-colors"
                    >
                      Complete & Handover
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
      <div className="p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6 mt-2">
          <h1 className="font-outfit text-[32px] font-bold text-coffee text-shadow-sm">
            Kitchen Queue
          </h1>
          <div className="bg-card px-4 py-2 rounded-xl shadow-[var(--shadow-clay-button)] border border-white/60 font-bold text-sm text-foreground">
            {activeOrders.length} Active Orders
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
          {renderColumn("New Orders", "paid", "bg-[#FAF8F5]")}
          {renderColumn("Brewing", "preparing", "bg-[#EBF3F8]")}
          {renderColumn("Ready for Pickup", "ready", "bg-[#F2F8F2]")}
        </div>
      </div>
    </ProtectedRoute>
  );
}
