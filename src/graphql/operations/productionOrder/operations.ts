import { gql } from '@apollo/client';

import {
  BOX_SPECIFICATION_WITH_BRAND_FIELDS,
  CROP_PROCESS_WITH_MAINTAINER_FIELDS,
  USER_SUMMARY_FIELDS,
} from '@/graphql/operations/shared/workshopOrderFields';

/**
 * 供应商生产单 GraphQL 操作，字段与 apex-bff schema 一一对应。
 * 别名保持 App 内部命名（productionOrderSupplierXxx），改后端字段名时只需改本文件。
 */

/** ErpCropOrderPreviewDto（挂在生产单详情上；无 productionOrder） */
const CROP_ORDER_PREVIEW_FIELDS = `
  id
  status
  cropOrderType
  createdAt
  updatedAt
  cropOrderStorage {
    cropTotal
    cropProcesses {
      ${CROP_PROCESS_WITH_MAINTAINER_FIELDS}
      boxSpecification {
        ${BOX_SPECIFICATION_WITH_BRAND_FIELDS}
      }
    }
  }
  user {
    ${USER_SUMMARY_FIELDS}
  }
  lastUpdater {
    ${USER_SUMMARY_FIELDS}
  }
`;

export const PRODUCTION_ORDER_SUPPLIER_STATISTIC = gql`
  query ProductionOrderSupplierStatistic($input: ErpProductionOrderSupplierSearchInput!) {
    productionOrderSupplierStatistic: getSupplierProductionOrderStatistic(input: $input) {
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
  query ProductionOrderSupplierSearch(
    $input: ErpProductionOrderSupplierSearchInput!
    $page: Float
    $size: Float
  ) {
    productionOrderSupplierSearch: supplierProductionOrderSearch(
      input: $input
      page: $page
      size: $size
    ) {
      total
      size
      pages
      page
      records {
        saleOrderCode
        productionOrderCode
        code
        productCode
        type
        productionOrderType
        customerCode
        customerPO
        productionType
        quantity
        productionOrderStatus
        factoryPlanedProductionDate
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
        productionOrders {
          productionOrderCode
          code
          type
          color
          status
          factoryPlanedProductionDate
        }
        templateDesign {
          category
          customerCode
        }
      }
    }
  }
`;

/** 列表缩略图：搜索预览无 template，按色补拉正面图 */
export const PRODUCTION_ORDER_FRONT_IMAGES = gql`
  query ProductionOrderFrontImages($productionOrderCode: String!, $color: String!) {
    productionOrderSupplierDetail: getProductionOrder(
      productionOrderCode: $productionOrderCode
      color: $color
    ) {
      template {
        frontImages {
          url
          description
        }
      }
    }
  }
`;

export const PRODUCTION_ORDER_SUPPLIER_DETAIL = gql`
  query ProductionOrderSupplierDetail($productionOrderCode: String!, $color: String!) {
    productionOrderSupplierDetail: getProductionOrder(
      productionOrderCode: $productionOrderCode
      color: $color
    ) {
      id
      productionOrderCode
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
        packageAttachment
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
          customerId
        }
      }
      template {
        frontImages {
          url
          description
        }
        backImages {
          url
          description
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
        moduleExtend
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
      cropOrder {
        ${CROP_ORDER_PREVIEW_FIELDS}
      }
      sewingOrder {
        ${CROP_ORDER_PREVIEW_FIELDS}
      }
      tailOrder {
        ${CROP_ORDER_PREVIEW_FIELDS}
      }
    }
  }
`;

/** 返回 Boolean，调用方需自行重新拉取详情 */
export const CONFIRM_ARRIVE_MATERIAL = gql`
  mutation ConfirmArriveMaterial(
    $productionId: Float!
    $input: ErpProductionConfirmMaterialRequestInput!
  ) {
    confirmArriveMaterial: productionOrderConfirmArriveMaterial(
      productionId: $productionId
      input: $input
    )
  }
`;

export const CREATE_PRODUCTION_ORDER_EXCEPTION_RECORD = gql`
  mutation CreateProductionOrderExceptionRecord(
    $input: ErpProductionExceptionRecordCreateRequestInput!
  ) {
    createProductionOrderExceptionRecord(input: $input) {
      id
      productionId
      module
      moduleExtend
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
    }
  }
`;
