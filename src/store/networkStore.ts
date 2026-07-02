import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { create } from 'zustand';

interface NetworkStoreState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  isOffline: boolean;
  checkNetwork: () => Promise<boolean>;
  startNetworkListener: () => () => void;
}

/**
 * 是否离线。
 *
 * 注意：
 * 不再使用 isInternetReachable === false 直接判定离线。
 *
 * 原因：
 * - iOS 真机上 isInternetReachable 可能出现 false，但实际手机网络可用；
 * - 如果用它直接判离线，会误拦截正常请求；
 * - 对业务来说，真正危险的是 isConnected === false，即设备明确没有网络连接。
 *
 * 所以：
 * - isConnected === false：明确离线；
 * - isConnected === true：认为有网络；
 * - isConnected === null：未知状态，不主动判离线，避免误伤。
 */
const getOfflineState = (state: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>) => {
  return state.isConnected === false;
};

export const useNetworkStore = create<NetworkStoreState>((set) => ({
  isConnected: null,
  isInternetReachable: null,
  isOffline: false,

  checkNetwork: async () => {
    const state = await NetInfo.fetch();
    const isOffline = getOfflineState(state);

    set({
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      isOffline,
    });

    return !isOffline;
  },

  startNetworkListener: () => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOffline = getOfflineState(state);

      set({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        isOffline,
      });
    });

    return unsubscribe;
  },
}));
