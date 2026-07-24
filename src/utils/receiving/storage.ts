import AsyncStorage from '@react-native-async-storage/async-storage';

import { RECEIVING_STORAGE_KEY } from '@/constants/receiving';
import type { ReceivingPersistedState } from '@/types/receiving';

const defaultState = (): ReceivingPersistedState => ({
  selectedProductionColorId: null,
  materialItems: {},
  cuttingBeds: {},
  cuttingEditingBedId: {},
  sewingRecords: {},
  packingBoxes: {},
  packingEditingBoxId: {},
  exceptions: [],
});

let memoryCache: ReceivingPersistedState | null = null;

/** 选中生产色仅会话内有效，落盘时不保留 */
const toPersistedState = (state: ReceivingPersistedState): ReceivingPersistedState => ({
  ...state,
  selectedProductionColorId: null,
});

export async function loadReceivingState(): Promise<ReceivingPersistedState> {
  if (memoryCache) {
    return memoryCache;
  }

  try {
    const raw = await AsyncStorage.getItem(RECEIVING_STORAGE_KEY);
    if (!raw) {
      memoryCache = defaultState();
      return memoryCache;
    }
    const parsed = JSON.parse(raw) as ReceivingPersistedState;
    memoryCache = {
      ...defaultState(),
      ...parsed,
      selectedProductionColorId: null,
    };
    return memoryCache;
  } catch {
    memoryCache = defaultState();
    return memoryCache;
  }
}

export async function saveReceivingState(state: ReceivingPersistedState): Promise<void> {
  memoryCache = state;
  await AsyncStorage.setItem(RECEIVING_STORAGE_KEY, JSON.stringify(toPersistedState(state)));
}

export function getReceivingStateSync(): ReceivingPersistedState | null {
  return memoryCache;
}

export function setReceivingStateCache(state: ReceivingPersistedState): void {
  memoryCache = state;
}

export async function clearReceivingState(): Promise<void> {
  memoryCache = defaultState();
  await AsyncStorage.removeItem(RECEIVING_STORAGE_KEY);
}
