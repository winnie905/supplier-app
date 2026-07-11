import { gql } from '@apollo/client';

export const GET_ASSET_HOST_QUERY = gql`
  query Config {
    config {
      assetHost
    }
  }
`;
