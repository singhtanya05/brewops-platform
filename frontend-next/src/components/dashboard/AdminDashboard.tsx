"use client";

import React from 'react';
import { useOrderStore } from '@/store/useOrderStore';
import { TrendingUp, ShoppingBag, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export function AdminDashboard() {
  const { orders } = useOrderStore();

  const activeOrders = orders.filter(o => o.status !== 'completed');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8 mt-2">
        <div>
          <h1 className="font-outfit text-[36px] font-bold text-coffee text-shadow-sm">
            Overview Dashboard
          </h1>
          <p className="text-text-secondary mt-1">Here is what is happening at BrewOps today.</p>
        </div>
        <Link href="/kitchen">
          <button className="px-6 py-2.5 rounded-[16px] bg-coffee text-white font-bold text-[14px] shadow-[4px_4px_8px_#dbd6cb,-4px_-4px_8px_#ffffff,inset_2px_2px_4px_rgba(255,255,255,0.25),inset_-2px_-2px_4px_rgba(0,0,0,0.3)] hover:opacity-90 active:scale-95 transition-all">
            Open Kitchen Queue
          </button>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* Revenue Card */}
        <div className="bg-card p-6 rounded-[24px] shadow-[var(--shadow-clay-card)] border border-white/60 flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="w-14 h-14 rounded-2xl bg-[#EBF3F8] flex items-center justify-center shadow-inner">
            <TrendingUp size={28} className="text-[#6A8EAD]" />
          </div>
          <div>
            <p className="text-text-secondary text-sm font-bold uppercase tracking-wider mb-1">Revenue</p>
            <h3 className="font-outfit text-2xl font-bold text-coffee">${totalRevenue.toFixed(2)}</h3>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-card p-6 rounded-[24px] shadow-[var(--shadow-clay-card)] border border-white/60 flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="w-14 h-14 rounded-2xl bg-orange/10 flex items-center justify-center shadow-inner">
            <Clock size={28} className="text-orange" />
          </div>
          <div>
            <p className="text-text-secondary text-sm font-bold uppercase tracking-wider mb-1">Active Queue</p>
            <h3 className="font-outfit text-2xl font-bold text-coffee">{activeOrders.length}</h3>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-card p-6 rounded-[24px] shadow-[var(--shadow-clay-card)] border border-white/60 flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="w-14 h-14 rounded-2xl bg-matcha/10 flex items-center justify-center shadow-inner">
            <ShoppingBag size={28} className="text-matcha" />
          </div>
          <div>
            <p className="text-text-secondary text-sm font-bold uppercase tracking-wider mb-1">Total Orders</p>
            <h3 className="font-outfit text-2xl font-bold text-coffee">{orders.length}</h3>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-card p-6 rounded-[24px] shadow-[var(--shadow-clay-card)] border border-white/60 flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="w-14 h-14 rounded-2xl bg-[#F2F8F2] flex items-center justify-center shadow-inner">
            <CheckCircle size={28} className="text-matcha" />
          </div>
          <div>
            <p className="text-text-secondary text-sm font-bold uppercase tracking-wider mb-1">System</p>
            <h3 className="font-outfit text-[16px] leading-tight font-bold text-matcha">All Systems<br/>Operational</h3>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-card rounded-[24px] shadow-[var(--shadow-clay-card)] border border-white/60 p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-outfit text-xl font-bold text-coffee">Recent Orders</h2>
            <Link href="/kitchen" className="text-sm font-bold text-orange hover:underline">View All</Link>
          </div>
          
          <div className="flex flex-col gap-4">
            {recentOrders.length === 0 ? (
              <p className="text-text-secondary italic">No orders today.</p>
            ) : (
              recentOrders.map(order => (
                <div key={order.id} className="flex justify-between items-center p-4 rounded-2xl bg-[#FAF8F5] shadow-[var(--shadow-clay-input)]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#E6E1D8] flex items-center justify-center font-bold text-coffee shadow-inner">
                      #{order.id.slice(-3)}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Order #{order.id}</p>
                      <p className="text-xs text-text-secondary">{new Date(order.createdAt).toLocaleTimeString()} • {order.items.length} items</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-bold text-coffee">${order.totalAmount.toFixed(2)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'completed' ? 'bg-gray-200 text-gray-600' :
                      order.status === 'ready' ? 'bg-matcha/20 text-matcha' :
                      order.status === 'brewing' ? 'bg-[#EBF3F8] text-[#6A8EAD]' :
                      'bg-orange/20 text-orange'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions / Alerts */}
        <div className="flex flex-col gap-6">
          <div className="bg-card rounded-[24px] shadow-[var(--shadow-clay-card)] border border-white/60 p-6">
            <h2 className="font-outfit text-xl font-bold text-coffee mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              <Link href="/kitchen">
                <button className="w-full py-3 rounded-xl bg-[#FAF8F5] text-coffee font-bold text-sm shadow-[var(--shadow-clay-button)] active:shadow-[var(--shadow-clay-pressed)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                  👨‍🍳 Manage Kitchen Queue
                </button>
              </Link>
              <Link href="/inventory">
                <button className="w-full py-3 rounded-xl bg-[#FAF8F5] text-coffee font-bold text-sm shadow-[var(--shadow-clay-button)] active:shadow-[var(--shadow-clay-pressed)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                  📦 Check Inventory
                </button>
              </Link>
              <Link href="/suppliers">
                <button className="w-full py-3 rounded-xl bg-[#FAF8F5] text-coffee font-bold text-sm shadow-[var(--shadow-clay-button)] active:shadow-[var(--shadow-clay-pressed)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                  🚚 Supplier Orders
                </button>
              </Link>
            </div>
          </div>

          <div className="bg-card rounded-[24px] shadow-[var(--shadow-clay-card)] border border-white/60 p-6 flex-1 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="text-center relative z-10">
              <div className="text-5xl mb-2 filter drop-shadow-md group-hover:scale-110 transition-transform duration-300">📈</div>
              <h3 className="font-bold text-coffee">Sales are up!</h3>
              <p className="text-xs text-text-secondary mt-1">12% higher than yesterday</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
