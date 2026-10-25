import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthUser = {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  token: string;
  refreshToken: string;
};

type AuthState = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null })
    }),
    {
      name: 'speedshift-auth',
      partialize: (state) => ({ user: state.user })
    }
  )
);
