import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'admin' | 'cashier';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (accessToken: string, user: AuthUser) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: (accessToken, user) => set({ accessToken, user }),
      clearSession: () => set({ accessToken: null, user: null }),
    }),
    { name: 'zepos-auth' },
  ),
);
