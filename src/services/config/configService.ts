import { apolloClient } from '@/graphql/client';

import { GET_ASSET_HOST_QUERY } from './queries';

interface GetAssetHostQueryResult {
  config: {
    assetHost: string;
  };
}

export async function getAssetHost() {
  try {
    const { data } = await apolloClient.query<GetAssetHostQueryResult>({
      query: GET_ASSET_HOST_QUERY,
    });
    return data?.config?.assetHost ?? null;
  } catch (error) {
    console.warn('getAssetHost error:', error);
    return null;
  }
}
