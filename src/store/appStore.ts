import { create } from 'zustand';

export interface AppStoreState {
  isReady: boolean;
  setReady: (nextReady: boolean) => void;
  isLoading: boolean;
  setLoading: (nextLoading: boolean) => void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  isReady: false,
  setReady: (nextReady) => set({ isReady: nextReady }),
  isLoading: false,
  setLoading: (nextLoading) => set({ isLoading: nextLoading }),
}));
