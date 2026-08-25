import { gql } from '@apollo/client';

/** getSystemConfig：系统配置（含款式类别映射） */
export const GET_SYSTEM_CONFIG = gql`
  query GetSystemConfig {
    getSystemConfig {
      categories {
        id
        name
        value
        fullName
        parentId
        isLeaf
        isDeleted
      }
    }
  }
`;
