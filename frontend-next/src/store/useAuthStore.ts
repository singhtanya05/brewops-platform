import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'GUEST' | 'CUSTOMER' | 'STAFF' | 'ADMIN';

interface AuthState {
  token: string | null;
  role: Role;
  login: (token: string, role: Role) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: 'GUEST',
      login: (token, role) => set({ token, role }),
      logout: () => set({ token: null, role: 'GUEST' }),
    }),
    {
      name: 'brewops-auth-storage', // name of the item in the storage (must be unique)
    }
  )
);
