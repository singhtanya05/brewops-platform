"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, Role } from '@/store/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { role } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!allowedRoles.includes(role)) {
        if (role === 'GUEST') {
          router.push('/login');
        } else {
          router.push('/');
        }
      }
    }
  }, [mounted, role, router, allowedRoles]);

  if (!mounted) return null; // Wait for hydration
  
  if (!allowedRoles.includes(role)) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="bg-card p-8 rounded-[24px] shadow-[var(--shadow-clay-card)] text-center max-w-md">
          <div className="text-6xl mb-4">⛔</div>
          <h2 className="text-xl font-bold text-coffee mb-2">Access Denied</h2>
          <p className="text-text-secondary text-sm">You do not have permission to view this page. Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
