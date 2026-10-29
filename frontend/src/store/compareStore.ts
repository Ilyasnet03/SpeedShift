import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const MAX_COMPARE = 3;

type CompareState = {
  ids: number[];
  toggle: (id: number) => boolean;
  remove: (id: number) => void;
  clear: () => void;
};

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const current = get().ids;
        if (current.includes(id)) {
          set({ ids: current.filter((value) => value !== id) });
          return true;
        }
        if (current.length >= MAX_COMPARE) return false;
        set({ ids: [...current, id] });
        return true;
      },
      remove: (id) => set((state) => ({ ids: state.ids.filter((value) => value !== id) })),
      clear: () => set({ ids: [] })
    }),
    { name: 'speedshift-compare' }
  )
);
