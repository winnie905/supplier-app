import { gql } from '@apollo/client';

import {
  CROP_PROCESS_FIELDS,
  CROP_PROCESS_WITH_MAINTAINER_FIELDS,
  USER_SUMMARY_FIELDS,
} from '@/graphql/operations/shared/workshopOrderFields';

/**
 * 车缝单 GraphQL，对齐 apex-bff：
 * getSewOrderById / createSewOrder / updateSewOrder
 *
 * 与裁床单同构（ErpCropOrderDtoInput）；cropOrderType = SewingOrder；
 * 工序 type = UpSew / DownSew。线上无 sewOrderStatistic。
 * getSewOrderById 返回 ErpCropOrderPreviewDto，不可查询 productionOrder。
 */

export const SEW_ORDER = gql`
  query SewOrder($id: Float!) {
    sewOrder: getSewOrderById(id: $id) {
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

export const CREATE_SEW_ORDER = gql`
  mutation CreateSewOrder($input: ErpCropOrderDtoInput!, $type: String) {
    createSewOrder(input: $input, type: $type) {
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

export const UPDATE_SEW_ORDER = gql`
  mutation UpdateSewOrder($input: ErpCropOrderDtoInput!, $type: String) {
    updateSewOrder(input: $input, type: $type) {
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
