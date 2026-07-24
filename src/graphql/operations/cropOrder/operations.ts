import { gql } from '@apollo/client';

/**
 * 裁床单 GraphQL（对齐 REST：
 * GET /api/crop_order/{id}
 * POST /api/crop_order
 * PUT /api/crop_order
 * POST /api/crop_order/statistic
 */

const CROP_PROCESS_FIELDS = `
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

const CROP_ORDER_FIELDS = `
  id
  status
  cropOrderType
  createdAt
  updatedAt
  cropOrderStorage {
    cropTotal
    cropProcesses {
      ${CROP_PROCESS_FIELDS}
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

export const CROP_ORDER = gql`
  query CropOrder($id: Int!) {
    cropOrder(id: $id) {
      ${CROP_ORDER_FIELDS}
    }
  }
`;

export const CREATE_CROP_ORDER = gql`
  mutation CreateCropOrder($input: CropOrderInput!) {
    createCropOrder(input: $input) {
      ${CROP_ORDER_FIELDS}
    }
  }
`;

export const UPDATE_CROP_ORDER = gql`
  mutation UpdateCropOrder($input: CropOrderInput!) {
    updateCropOrder(input: $input) {
      ${CROP_ORDER_FIELDS}
    }
  }
`;

export const CROP_ORDER_STATISTIC = gql`
  mutation CropOrderStatistic($input: CropOrderStatisticInput!) {
    cropOrderStatistic(input: $input) {
      total
      totalSelf
    }
  }
`;
