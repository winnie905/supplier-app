import { apolloClient } from '@/graphql/client';
import { GET_SYSTEM_CONFIG } from '@/graphql/operations/systemConfig/operations';
import { useRuntimeConfigStore } from '@/store/runtimeConfigStore';
import type { SystemCategory } from '@/types/systemConfig';

import { GET_ASSET_HOST_QUERY } from './queries';

interface GetAssetHostQueryResult {
  config: {
    assetHost: string;
  };
}

interface GetSystemConfigQueryResult {
  getSystemConfig: {
    categories: SystemCategory[];
  };
}

/** 拉取 assetHost 并写入 runtimeConfig，供 buildFileUrl / 样品图拼接使用 */
export async function getAssetHost() {
  try {
    const { data } = await apolloClient.query<GetAssetHostQueryResult>({
      query: GET_ASSET_HOST_QUERY,
    });
    if (data?.config?.assetHost) {
      await useRuntimeConfigStore.getState().setRuntimeConfig({
        filePrefix: data.config.assetHost,
        updatedAt: Date.now(),
      });
    }
  } catch (error) {
    console.warn('getAssetHost error:', error);
  }
}

let categoriesCache: SystemCategory[] | null = null;
let categoriesInflight: Promise<SystemCategory[]> | null = null;

/** getSystemConfig.categories：款式类别映射（进程内缓存） */
export async function getSystemCategories(options?: {
  force?: boolean;
}): Promise<SystemCategory[]> {
  if (!options?.force && categoriesCache) return categoriesCache;
  if (!options?.force && categoriesInflight) return categoriesInflight;

  categoriesInflight = (async () => {
    const { data } = await apolloClient.query<GetSystemConfigQueryResult>({
      query: GET_SYSTEM_CONFIG,
      fetchPolicy: options?.force ? 'network-only' : 'cache-first',
    });
    categoriesCache = data?.getSystemConfig?.categories ?? [];
    return categoriesCache;
  })()
    .catch((error: unknown) => {
      console.warn('getSystemCategories error:', error);
      return categoriesCache ?? [];
    })
    .finally(() => {
      categoriesInflight = null;
    });

  return categoriesInflight;
}
