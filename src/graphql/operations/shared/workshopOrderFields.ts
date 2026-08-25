/**
 * 裁床 / 车缝 / 尾部单共用的 selection set 片段。
 *
 * 三条线的 document 结构一致，差异只在：读取才带 maintainer、
 * 尾部才带 boxSpecification（create/update 返回的箱规不含 brand）。
 * 片段以模板字符串插入 gql，展开后的 document 与拆分前逐字段一致。
 */

/** 用户摘要：maintainer / user / lastUpdater 共用 */
export const USER_SUMMARY_FIELDS = `
  id
  username
  firstName
  lastName
`;

/** 工序字段：一床次 / 一日记录 / 一箱 */
export const CROP_PROCESS_FIELDS = `
  id
  cropDate
  type
  sizeRange {
    name
    cropQuantity
  }
  totalQuantity
  parameter
  boxWeight
`;

/** 工序字段（读取）：额外带维护人与维护时间 */
export const CROP_PROCESS_WITH_MAINTAINER_FIELDS = `
  id
  cropDate
  type
  sizeRange {
    name
    cropQuantity
  }
  totalQuantity
  maintainer {
    ${USER_SUMMARY_FIELDS}
  }
  maintenanceDate
  parameter
  boxWeight
`;

/** 箱规明细（尾部装箱） */
export const BOX_SPECIFICATION_FIELDS = `
  id
  name
  length
  width
  height
  unit
  type
`;

/** 箱规明细：读取时额外返回品牌 */
export const BOX_SPECIFICATION_WITH_BRAND_FIELDS = `
  ${BOX_SPECIFICATION_FIELDS}
  brand {
    id
    name
    customerId
  }
`;
