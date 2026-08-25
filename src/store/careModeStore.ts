import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const CARE_MODE_STORAGE_KEY = '@supplier/care-mode';

/** 关怀模式开启时，全局字号增量（pt） */
export const CARE_MODE_FONT_BOOST = 2;

interface CareModeState {
  enabled: boolean;
  hydrated: boolean;
  setEnabled: (enabled: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useCareModeStore = create<CareModeState>((set, get) => ({
  enabled: false,
  hydrated: false,

  setEnabled: (enabled) => {
    set({ enabled });
    void AsyncStorage.setItem(CARE_MODE_STORAGE_KEY, enabled ? '1' : '0').catch(
      (error: unknown) => {
        console.warn('[careMode] persist failed:', error);
      },
    );
  },

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(CARE_MODE_STORAGE_KEY);
      set({ enabled: raw === '1', hydrated: true });
    } catch (error: unknown) {
      console.warn('[careMode] hydrate failed:', error);
      set({ hydrated: true });
    }
  },
}));
