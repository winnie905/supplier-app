import { gql } from '@apollo/client';

/**
 * 箱规 GraphQL（对齐 REST：GET /api/box_specification/brand?brandId=&includeGeneral=）
 */

const BOX_SPECIFICATION_FIELDS = `
  id
  name
  length
  width
  height
  unit
  type
  brand {
    id
    name
    customerId
  }
  createdAt
  updatedAt
`;

export const BOX_SPECIFICATIONS_BY_BRAND = gql`
  query BoxSpecificationsByBrand($brandId: Int!, $includeGeneral: Boolean = true) {
    boxSpecificationsByBrand(brandId: $brandId, includeGeneral: $includeGeneral) {
      ${BOX_SPECIFICATION_FIELDS}
    }
  }
`;
