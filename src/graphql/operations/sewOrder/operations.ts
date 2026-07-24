import { gql } from '@apollo/client';

/**
 * 车缝单 GraphQL（对齐 REST：
 * GET /api/sew_order/{id}
 * POST /api/sew_order
 * PUT /api/sew_order
 * POST /api/sew_order/statistic
 *
 * 当前 swagger 与裁床单同构（cropOrderStorage / cropProcesses）。
 */

const SEW_PROCESS_FIELDS = `
  id
  cropDate
  type
  sizeRange {
    name
    cropQuantity
  }
  totalQuantity
  maintainer {
    id
    username
    firstName
    lastName
  }
  maintenanceDate
  parameter
  boxWeight
`;

const SEW_ORDER_FIELDS = `
  id
  status
  cropOrderType
  createdAt
  updatedAt
  cropOrderStorage {
    cropTotal
    cropProcesses {
      ${SEW_PROCESS_FIELDS}
    }
  }
  user {
    id
    username
    firstName
    lastName
  }
  lastUpdater {
    id
    username
    firstName
    lastName
  }
  productionOrder {
    id
    productionOrderCode
    code
    type
    color
    status
    saleOrderCode
    factoryPlanedProductionDate
    customerPurchaseOrder {
      saleOrderCode
      productCode
      customerPO
      color
      quantity
      requiredProductionDate
      sizeRange {
        name
        quantity
      }
      brand {
        id
        name
        customerId
      }
    }
    templateDesign {
      code
      category
      designImageUrls
      brand {
        id
        name
        customerId
      }
    }
  }
`;

export const SEW_ORDER = gql`
  query SewOrder($id: Int!) {
    sewOrder(id: $id) {
      ${SEW_ORDER_FIELDS}
    }
  }
`;

export const CREATE_SEW_ORDER = gql`
  mutation CreateSewOrder($input: SewOrderInput!) {
    createSewOrder(input: $input) {
      ${SEW_ORDER_FIELDS}
    }
  }
`;

export const UPDATE_SEW_ORDER = gql`
  mutation UpdateSewOrder($input: SewOrderInput!) {
    updateSewOrder(input: $input) {
      ${SEW_ORDER_FIELDS}
    }
  }
`;

export const SEW_ORDER_STATISTIC = gql`
  mutation SewOrderStatistic($input: SewOrderStatisticInput!) {
    sewOrderStatistic(input: $input) {
      total
      totalSelf
    }
  }
`;
