import { create } from 'zustand';

import { getRuntimeConfigStorage, saveRuntimeConfigStorage } from '@/utils/app';

interface RuntimeConfig {
  /**
   * 文件访问前缀。
   * 例如：
   * https://cdn.xxx.com/
   * https://dev-api.xxx.com/file/
   */
  filePrefix: string;

  /**
   * 配置最后更新时间。
   * 用于后续判断是否需要重新拉取。
   */
  updatedAt: number;
}

interface RuntimeConfigState {
  config: RuntimeConfig | null;

  setRuntimeConfig: (config: RuntimeConfig) => Promise<void>;
  restoreRuntimeConfig: () => Promise<void>;
  clearRuntimeConfig: () => Promise<void>;
}

export const useRuntimeConfigStore = create<RuntimeConfigState>((set) => ({
  config: null,

  setRuntimeConfig: async (config) => {
    await saveRuntimeConfigStorage(config);
    set({ config });
  },

  restoreRuntimeConfig: async () => {
    const localConfig = await getRuntimeConfigStorage();
    set({ config: localConfig });
  },

  clearRuntimeConfig: async () => {
    await saveRuntimeConfigStorage(null);
    set({ config: null });
  },
}));
