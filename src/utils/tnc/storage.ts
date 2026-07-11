import AsyncStorage from '@react-native-async-storage/async-storage';

import { TNC_STORAGE_KEY } from '@/constants/tnc';
import type { TncConsentRecord, TncPersistedState } from '@/types/tnc';

const defaultState = (): TncPersistedState => ({
  consentRecords: [],
});

let memoryCache: TncPersistedState | null = null;

export async function loadTncState(): Promise<TncPersistedState> {
  if (memoryCache) {
    return memoryCache;
  }

  try {
    const raw = await AsyncStorage.getItem(TNC_STORAGE_KEY);
    if (!raw) {
      memoryCache = defaultState();
      return memoryCache;
    }

    const parsed = JSON.parse(raw) as TncPersistedState;
    memoryCache = {
      ...defaultState(),
      ...parsed,
      consentRecords: parsed.consentRecords ?? [],
    };
    return memoryCache;
  } catch {
    memoryCache = defaultState();
    return memoryCache;
  }
}

export async function saveTncState(state: TncPersistedState): Promise<void> {
  memoryCache = state;
  await AsyncStorage.setItem(TNC_STORAGE_KEY, JSON.stringify(state));
}

export async function appendConsentRecords(
  records: TncConsentRecord[],
): Promise<TncPersistedState> {
  const state = await loadTncState();
  const nextState: TncPersistedState = {
    consentRecords: [...state.consentRecords, ...records],
  };
  await saveTncState(nextState);
  return nextState;
}

export async function clearTncState(): Promise<void> {
  memoryCache = defaultState();
  await AsyncStorage.removeItem(TNC_STORAGE_KEY);
}
