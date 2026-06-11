"use client";

import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';

interface PaymentModalProps {
  totalAmount: number;
  onClose: () => void;
  onPay: () => void;
}

export function PaymentModal({ totalAmount, onClose, onPay }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate API delay
    setTimeout(() => {
      setIsProcessing(false);
      onPay();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-[420px] rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.2)] p-8 relative border border-white/60 animate-in zoom-in-95 duration-200 flex flex-col items-center">
        
        <h2 className="font-outfit text-2xl font-bold text-coffee mb-1 self-start">Complete Payment</h2>
        <p className="text-text-secondary text-sm mb-6 self-start">Review your order total and confirm payment.</p>

        {/* Total Amount Box */}
        <div className="w-full bg-[#F2EFE9] rounded-[16px] shadow-[var(--shadow-clay-input)] p-5 flex justify-between items-center mb-8">
          <span className="font-bold text-text-secondary text-[15px]">Total Amount</span>
          <span className="font-outfit text-2xl font-bold text-coffee">${totalAmount.toFixed(2)}</span>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-4">
          <button 
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-[16px] bg-coffee text-white font-bold text-[15px] shadow-[4px_4px_8px_#dbd6cb,-4px_-4px_8px_#ffffff,inset_2px_2px_4px_rgba(255,255,255,0.25),inset_-2px_-2px_4px_rgba(0,0,0,0.3)] hover:opacity-90 active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <CreditCard size={18} />
                Pay with Card
              </>
            )}
          </button>

          <button 
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-[16px] bg-black text-white font-bold text-[15px] shadow-[0_8px_16px_rgba(0,0,0,0.3)] hover:opacity-90 active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            <svg viewBox="0 0 384 512" width="16" height="16" fill="currentColor">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
            </svg>
            Apple Pay
          </button>

          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="w-full py-3.5 mt-2 rounded-[16px] bg-card text-text-secondary font-bold text-[15px] shadow-[var(--shadow-clay-button)] hover:opacity-90 active:shadow-[var(--shadow-clay-pressed)] active:scale-95 transition-all"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
