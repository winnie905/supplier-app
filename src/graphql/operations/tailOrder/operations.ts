import { gql } from '@apollo/client';

import {
  BOX_SPECIFICATION_FIELDS,
  BOX_SPECIFICATION_WITH_BRAND_FIELDS,
  CROP_PROCESS_FIELDS,
  USER_SUMMARY_FIELDS,
} from '@/graphql/operations/shared/workshopOrderFields';

/**
 * 尾部单 GraphQL，对齐 apex-bff：
 * getTailOrderById / createTailOrder / updateTailOrder
 *
 * 与裁床/车缝同构（ErpCropOrderDtoInput）；cropOrderType = TailOrder；
 * 装箱工序 type = BrandBox / CommonBox。线上无 tailOrderStatistic。
 *
 * 注意 schema 差异：只有 getTailOrderById 的 ErpTailOrderPreviewDto 有 tailOrderStorage；
 * create/update 返回的 ErpCropOrderDto 与入参 ErpCropOrderDtoInput 都只有 cropOrderStorage，
 * 因此写入统一走 cropOrderStorage。
 */

export const TAIL_ORDER = gql`
  query TailOrder($id: Float!) {
    tailOrder: getTailOrderById(id: $id) {
      id
      status
      cropOrderType
      createdAt
      updatedAt
      cropOrderStorage {
        cropTotal
        cropProcesses {
          ${CROP_PROCESS_FIELDS}
          boxSpecification {
            ${BOX_SPECIFICATION_WITH_BRAND_FIELDS}
          }
        }
      }
      tailOrderStorage {
        cropTotal
        cropProcesses {
          ${CROP_PROCESS_FIELDS}
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
    }
  }
`;

export const CREATE_TAIL_ORDER = gql`
  mutation CreateTailOrder($input: ErpCropOrderDtoInput!, $type: String) {
    createTailOrder(input: $input, type: $type) {
      id
      status
      cropOrderType
      createdAt
      updatedAt
      cropOrderStorage {
        cropTotal
        cropProcesses {
          ${CROP_PROCESS_FIELDS}
          boxSpecification {
            ${BOX_SPECIFICATION_FIELDS}
          }
        }
      }
      productionOrder {
        id
        productionOrderCode
        color
        saleOrderCode
      }
    }
  }
`;

export const UPDATE_TAIL_ORDER = gql`
  mutation UpdateTailOrder($input: ErpCropOrderDtoInput!, $type: String) {
    updateTailOrder(input: $input, type: $type) {
      id
      status
      cropOrderType
      createdAt
      updatedAt
      cropOrderStorage {
        cropTotal
        cropProcesses {
          ${CROP_PROCESS_FIELDS}
          boxSpecification {
            ${BOX_SPECIFICATION_FIELDS}
          }
        }
      }
      productionOrder {
        id
        productionOrderCode
        color
        saleOrderCode
      }
    }
  }
`;
