import { gql } from '@apollo/client';

import {
  CROP_PROCESS_FIELDS,
  CROP_PROCESS_WITH_MAINTAINER_FIELDS,
  USER_SUMMARY_FIELDS,
} from '@/graphql/operations/shared/workshopOrderFields';

/**
 * 裁床单 GraphQL，对齐 apex-bff：
 * getCropOrderById / createCropOrder / updateCropOrder
 *
 * 注意：线上 schema 无 cropOrderStatistic；cropOrderType / process.type 为 PascalCase 枚举。
 * get*ById 返回 ErpCropOrderPreviewDto，不可查询 productionOrder；尺码等仍从生产单详情取。
 */

export const CROP_ORDER = gql`
  query CropOrder($id: Float!) {
    cropOrder: getCropOrderById(id: $id) {
      id
      status
      cropOrderType
      createdAt
      updatedAt
      cropOrderStorage {
        cropTotal
        cropProcesses {
          ${CROP_PROCESS_WITH_MAINTAINER_FIELDS}
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

export const CREATE_CROP_ORDER = gql`
  mutation CreateCropOrder($input: ErpCropOrderDtoInput!, $type: String) {
    createCropOrder(input: $input, type: $type) {
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
      productionOrder {
        id
        productionOrderCode
        color
        saleOrderCode
      }
    }
  }
`;

export const UPDATE_CROP_ORDER = gql`
  mutation UpdateCropOrder($input: ErpCropOrderDtoInput!, $type: String) {
    updateCropOrder(input: $input, type: $type) {
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
      productionOrder {
        id
        productionOrderCode
        color
        saleOrderCode
      }
    }
  }
`;
