"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function SuppliersPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="p-6">
        <h1 className="font-outfit text-[32px] font-bold text-coffee mb-8 mt-4">
          Suppliers & POs
        </h1>
        <p className="text-text-secondary">Admin tools will go here!</p>
      </div>
    </ProtectedRoute>
  );
}
