import { gql } from '@apollo/client';

export const GET_RECEIVING_SELECTED_PRODUCTION_COLOR = gql`
  query GetReceivingSelectedProductionColor {
    receivingSelectedProductionColor {
      id
      productionOrderCode
      color
    }
  }
`;

export const SEARCH_PRODUCTION_COLORS = gql`
  query SearchProductionColors($keyword: String!) {
    searchProductionColors(keyword: $keyword) {
      id
      productionOrderCode
      productCode
      po
      brand
      color
    }
  }
`;

export const GET_PRODUCTION_COLOR_DETAIL = gql`
  query GetProductionColorDetail($id: ID!) {
    productionColorDetail(id: $id) {
      id
      productionOrderCode
      productCode
      po
      brand
      color
      imageUrls
      status
      moduleStatus
    }
  }
`;

export const GET_MATERIAL_CONFIRMATION = gql`
  query GetMaterialConfirmation($productionColorId: ID!) {
    materialConfirmation(productionColorId: $productionColorId) {
      progressPercent
      arrivedCount
      totalCount
      items {
        id
        category
        name
        statuses
      }
    }
  }
`;

export const GET_FACTORY_EXCEPTIONS = gql`
  query GetFactoryExceptions($productionColorId: ID!, $module: String) {
    factoryExceptions(productionColorId: $productionColorId, module: $module) {
      id
      module
      type
      status
      reporter
      reportedAt
      content
      description
      replyContent
      repliedAt
    }
  }
`;

export const GET_CUTTING_RECORDS = gql`
  query GetCuttingRecords($productionColorId: ID!) {
    cuttingRecords(productionColorId: $productionColorId) {
      beds {
        id
        bedNo
        bundleCount
        sizeQuantities {
          size
          quantity
        }
        submitted
      }
    }
  }
`;

export const GET_SEWING_POSITION_RECORDS = gql`
  query GetSewingPositionRecords($productionColorId: ID!) {
    sewingPositionRecords(productionColorId: $productionColorId) {
      records {
        id
        date
        submitted
      }
    }
  }
`;

export const GET_PACKING_RECORDS = gql`
  query GetPackingRecords($productionColorId: ID!) {
    packingRecords(productionColorId: $productionColorId) {
      boxes {
        id
        boxNo
        cartonSpecId
        submitted
      }
    }
  }
`;

export const GET_CARTON_SPECS = gql`
  query GetCartonSpecs {
    cartonSpecs {
      id
      name
      length
      width
      height
      type
    }
  }
`;

export const SELECT_PRODUCTION_COLOR = gql`
  mutation SelectProductionColor($id: ID!) {
    selectProductionColor(id: $id) {
      id
    }
  }
`;

export const CLEAR_SELECTED_PRODUCTION_COLOR = gql`
  mutation ClearSelectedProductionColor {
    clearSelectedProductionColor {
      success
    }
  }
`;

export const SUBMIT_MATERIAL_ARRIVAL = gql`
  mutation SubmitMaterialArrival($productionColorId: ID!, $itemIds: [ID!]!) {
    submitMaterialArrival(productionColorId: $productionColorId, itemIds: $itemIds) {
      progressPercent
    }
  }
`;

export const SUBMIT_MATERIAL_EXCEPTION = gql`
  mutation SubmitMaterialException($input: MaterialExceptionInput!) {
    submitMaterialException(input: $input) {
      id
    }
  }
`;

export const SUBMIT_CUTTING_RECORD = gql`
  mutation SubmitCuttingRecord($input: CuttingRecordInput!) {
    submitCuttingRecord(input: $input) {
      id
    }
  }
`;

export const UPDATE_CUTTING_RECORD = gql`
  mutation UpdateCuttingRecord($input: CuttingRecordInput!) {
    updateCuttingRecord(input: $input) {
      id
    }
  }
`;

export const SUBMIT_CUTTING_EXCEPTION = gql`
  mutation SubmitCuttingException($input: CuttingExceptionInput!) {
    submitCuttingException(input: $input) {
      id
    }
  }
`;

export const SUBMIT_SEWING_POSITION_RECORD = gql`
  mutation SubmitSewingPositionRecord($input: SewingRecordInput!) {
    submitSewingPositionRecord(input: $input) {
      id
    }
  }
`;

export const UPDATE_SEWING_POSITION_RECORD = gql`
  mutation UpdateSewingPositionRecord($input: SewingRecordInput!) {
    updateSewingPositionRecord(input: $input) {
      id
    }
  }
`;

export const SUBMIT_PACKING_BOX = gql`
  mutation SubmitPackingBox($input: PackingBoxInput!) {
    submitPackingBox(input: $input) {
      id
    }
  }
`;

export const UPDATE_PACKING_BOX = gql`
  mutation UpdatePackingBox($input: PackingBoxInput!) {
    updatePackingBox(input: $input) {
      id
    }
  }
`;

export const RESOLVE_QR_CODE = gql`
  query ResolveProductionColorQrCode($content: String!) {
    resolveProductionColorQrCode(content: $content) {
      id
      productionOrderCode
      color
    }
  }
`;
