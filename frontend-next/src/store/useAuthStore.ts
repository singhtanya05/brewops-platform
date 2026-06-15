import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'GUEST' | 'CUSTOMER' | 'STAFF' | 'ADMIN';

interface AuthState {
  role: Role;
  login: (role: Role) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: 'GUEST',
      login: (role) => set({ role }),
      logout: () => set({ role: 'GUEST' }),
    }),
    {
      name: 'brewops-auth-storage', // name of the item in the storage (must be unique)
    }
  )
);
