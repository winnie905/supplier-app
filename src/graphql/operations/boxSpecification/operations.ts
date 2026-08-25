import { gql } from '@apollo/client';

/**
 * 箱规 GraphQL，对齐 apex-bff：
 * getBoxSpecifications(brandId, includeGeneric)
 */
export const BOX_SPECIFICATIONS_BY_BRAND = gql`
  query BoxSpecificationsByBrand($brandId: Int!, $includeGeneric: Boolean) {
    boxSpecificationsByBrand: getBoxSpecifications(
      brandId: $brandId
      includeGeneric: $includeGeneric
    ) {
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
    }
  }
`;
