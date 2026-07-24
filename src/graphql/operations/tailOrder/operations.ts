import { gql } from '@apollo/client';

/**
 * 尾部单 GraphQL（对齐 REST：
 * GET /api/tail_order/{id}
 * POST /api/tail_order
 * PUT /api/tail_order
 * POST /api/tail_order/statistic
 *
 * 与裁床单同构；GET 额外含 tailOrderStorage（装箱工序）。
 */

const TAIL_PROCESS_FIELDS = `
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
  boxSpecification {
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
  }
`;

const TAIL_ORDER_FIELDS = `
  id
  status
  cropOrderType
  createdAt
  updatedAt
  cropOrderStorage {
    cropTotal
    cropProcesses {
      ${TAIL_PROCESS_FIELDS}
    }
  }
  tailOrderStorage {
    cropTotal
    cropProcesses {
      ${TAIL_PROCESS_FIELDS}
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

export const TAIL_ORDER = gql`
  query TailOrder($id: Int!) {
    tailOrder(id: $id) {
      ${TAIL_ORDER_FIELDS}
    }
  }
`;

export const CREATE_TAIL_ORDER = gql`
  mutation CreateTailOrder($input: TailOrderInput!) {
    createTailOrder(input: $input) {
      ${TAIL_ORDER_FIELDS}
    }
  }
`;

export const UPDATE_TAIL_ORDER = gql`
  mutation UpdateTailOrder($input: TailOrderInput!) {
    updateTailOrder(input: $input) {
      ${TAIL_ORDER_FIELDS}
    }
  }
`;

export const TAIL_ORDER_STATISTIC = gql`
  mutation TailOrderStatistic($input: TailOrderStatisticInput!) {
    tailOrderStatistic(input: $input) {
      total
      totalSelf
    }
  }
`;
