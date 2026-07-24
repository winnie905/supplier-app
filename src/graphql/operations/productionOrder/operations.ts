import { gql } from '@apollo/client';

/**
 * 供应商生产单 GraphQL 操作（对齐 REST：
 * /api/production_orders/supplier/statistic|search|{code}|confirm_arrive_material|exception_record
 * 后续由 BFF 接驳；字段名以 camelCase 暴露给客户端。）
 */

export const PRODUCTION_ORDER_SUPPLIER_STATISTIC = gql`
  query ProductionOrderSupplierStatistic($input: ProductionOrderSupplierStatisticInput!) {
    productionOrderSupplierStatistic(input: $input) {
      pendingCount
      inProgressCount
      finishedCount
      pendingQuantity
      inProgressQuantity
      finishedQuantity
      overTimeCount
      overTimeQuantity
    }
  }
`;

export const PRODUCTION_ORDER_SUPPLIER_SEARCH = gql`
  query ProductionOrderSupplierSearch($input: ProductionOrderSupplierSearchInput!) {
    productionOrderSupplierSearch(input: $input) {
      total
      size
      pages
      page
      records {
        saleOrderCode
        productionOrderCode
        code
        type
        productionOrderType
        customerCode
        customerPO
        productCode
        category
        designImageUrls
        requiredProductionDate
        brand {
          id
          name
          customerId
        }
        businessFollower {
          id
          username
          firstName
          lastName
        }
        productionFollower {
          id
          username
          firstName
          lastName
        }
        productionType
        quantity
        productionOrderStatus
        factoryPlanedProductionDate
        productionOrders {
          id
          productionOrderCode
          code
          type
          color
          status
          factoryPlanedProductionDate
          quantity
        }
      }
      statistic {
        pendingCount
        inProgressCount
        finishedCount
        pendingQuantity
        inProgressQuantity
        finishedQuantity
        overTimeCount
        overTimeQuantity
      }
    }
  }
`;

export const PRODUCTION_ORDER_SUPPLIER_DETAIL = gql`
  query ProductionOrderSupplierDetail($productionOrderCode: String!, $color: String!) {
    productionOrderSupplierDetail(productionOrderCode: $productionOrderCode, color: $color) {
      productionOrderCode
      id
      code
      type
      color
      purchaseCode
      status
      saleOrderCode
      orderStatus
      materialStatus
      productionType
      comment
      factoryPlanedProductionDate
      factoryReceiveMaterialStatus
      orderType
      createdAt
      updatedAt
      factory {
        id
        name
        fullName
        phone
        contact
      }
      receiveWarehouse {
        id
        name
        contact
        phone
      }
      customerPurchaseOrder {
        saleOrderCode
        productCode
        customerPO
        color
        colorCode
        code
        type
        quantity
        requiredProductionDate
        sizeRange {
          name
          quantity
          outboundQuantity
        }
        brand {
          id
          name
          customerId
        }
        productionFollower {
          id
          username
          firstName
          lastName
        }
        businessFollower {
          id
          username
          firstName
          lastName
        }
      }
      templateDesign {
        code
        type
        customerCode
        category
        designImageUrls
        brand {
          id
          name
        }
      }
      bomItems {
        id
        type
        actionRegion
        name
        materialColor
        supplierName
        category
        specification
        formula
        usage
        width
        weight
        meters
        receiveMaterialStatus
        material {
          id
          name
          color
          code
          imageUrls
        }
        unit {
          id
          name
          unit
        }
      }
      materialPackages {
        id
        name
        receiveMaterialStatus
        remark
      }
      packMaterials {
        id
        name
        receiveMaterialStatus
        remark
      }
      exceptionRecords {
        id
        productionId
        module
        type
        reportedAt
        reportContent
        repliedAt
        replyContent
        isReplied
        reporter {
          id
          username
          firstName
          lastName
        }
        replier {
          id
          username
          firstName
          lastName
        }
      }
    }
  }
`;

export const CONFIRM_ARRIVE_MATERIAL = gql`
  mutation ConfirmArriveMaterial($productionId: Int!, $input: ConfirmArriveMaterialInput!) {
    confirmArriveMaterial(productionId: $productionId, input: $input) {
      productionOrderCode
      id
      color
      factoryReceiveMaterialStatus
      bomItems {
        id
        receiveMaterialStatus
      }
      materialPackages {
        id
        receiveMaterialStatus
      }
      packMaterials {
        id
        receiveMaterialStatus
      }
    }
  }
`;

export const CREATE_PRODUCTION_ORDER_EXCEPTION_RECORD = gql`
  mutation CreateProductionOrderExceptionRecord($input: CreateExceptionRecordInput!) {
    createProductionOrderExceptionRecord(input: $input) {
      id
      productionId
      module
      type
      reportedAt
      reportContent
      isReplied
      reporter {
        id
        username
        firstName
        lastName
      }
    }
  }
`;
