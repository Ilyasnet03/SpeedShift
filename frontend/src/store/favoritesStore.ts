import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type FavoritesState = {
  byUser: Record<string, number[]>;
  toggle: (userKey: string, listingId: number) => void;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      byUser: {},
      toggle: (userKey, listingId) => set((state) => {
        const current = state.byUser[userKey] ?? [];
        const next = current.includes(listingId) ? current.filter((id) => id !== listingId) : [...current, listingId];
        return { byUser: { ...state.byUser, [userKey]: next } };
      })
    }),
    { name: 'speedshift-favorites' }
  )
);
