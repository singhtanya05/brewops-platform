"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function InventoryPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="p-6">
        <h1 className="font-outfit text-[32px] font-bold text-coffee mb-8 mt-4">
          Inventory Control
        </h1>
        <p className="text-text-secondary">Admin inventory tools will go here!</p>
      </div>
    </ProtectedRoute>
  );
}
