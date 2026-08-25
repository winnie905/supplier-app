import { EXCEPTION_MODULE_LABELS } from '@/constants/receiving';
import { formatUserName } from '@/services/receiving/mapReceivingHelpers';
import type { FactoryException } from '@/types/receiving';
import type {
  ProductionOrderSupplierDetail,
  SupplierExceptionRecord,
} from '@/types/supplierProductionOrder';
import { formatDateTime } from '@/utils/date';
import { encodeProductionColorId } from '@/utils/receiving/productionColorId';

const parseRelatedItems = (
  moduleExtend?: Record<string, unknown>,
): { ids?: string[]; names?: string[] } => {
  if (!moduleExtend) return {};

  const relatedItemIds = Array.isArray(moduleExtend.relatedItemIds)
    ? (moduleExtend.relatedItemIds as unknown[]).filter(
        (id): id is string => typeof id === 'string' && id.length > 0,
      )
    : undefined;

  const relatedItems = Array.isArray(moduleExtend.relatedItems)
    ? (moduleExtend.relatedItems as unknown[]).flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const row = item as { id?: unknown; name?: unknown };
        const name = typeof row.name === 'string' ? row.name.trim() : '';
        if (!name) return [];
        return [
          {
            name,
            ...(typeof row.id === 'string' ? { id: row.id } : {}),
          },
        ];
      })
    : undefined;

  const names = relatedItems?.map((item) => item.name);
  return {
    ...(relatedItemIds?.length ? { ids: relatedItemIds } : {}),
    ...(names?.length ? { names } : {}),
  };
};

/** 问题描述正文：优先 description；兼容旧版 reportContent（【类型】物料\\n描述） */
const resolveExceptionDescription = (record: SupplierExceptionRecord): string => {
  const extend = record.moduleExtend;
  if (typeof extend?.description === 'string') {
    return extend.description.trim();
  }

  const reportContent =
    record.reportContent ??
    (typeof extend?.reportContent === 'string' ? extend.reportContent : undefined);
  if (!reportContent) return '';

  // 旧格式：首行【类型】物料名，次行起为描述
  const lines = reportContent.split('\n');
  if (lines.length > 1 && /^【.+】/.test(lines[0] ?? '')) {
    return lines.slice(1).join('\n').trim();
  }
  return reportContent.trim();
};

export const mapExceptionRecordToFactoryException = (
  record: SupplierExceptionRecord,
  productionColorId: string,
): FactoryException => {
  const module =
    record.module === 'cutting' ||
    record.module === '裁床' ||
    record.module === EXCEPTION_MODULE_LABELS.cutting
      ? 'cutting'
      : 'material';
  const moduleLabel =
    (typeof record.moduleExtend?.moduleLabel === 'string' && record.moduleExtend.moduleLabel.trim()
      ? record.moduleExtend.moduleLabel.trim()
      : null) ?? EXCEPTION_MODULE_LABELS[module];

  const { ids: relatedItemIds, names: relatedItemNames } = parseRelatedItems(record.moduleExtend);
  const description = resolveExceptionDescription(record);

  // 异常内容：【物料齐备】物料A、物料B / 【裁床】
  const content =
    module === 'material' && relatedItemNames?.length
      ? `【${moduleLabel}】${relatedItemNames.join('、')}`
      : `【${moduleLabel}】`;

  return {
    id: record.id,
    productionColorId,
    module,
    moduleLabel,
    type: record.type,
    status: record.isReplied ? 'replied' : 'pending',
    reporter: formatUserName(record.reporter),
    reportedAt: formatDateTime(record.reportedAt),
    content,
    description,
    ...(record.replyContent ? { replyContent: record.replyContent } : {}),
    ...(record.repliedAt ? { repliedAt: formatDateTime(record.repliedAt) } : {}),
    ...(relatedItemIds ? { relatedItemIds } : {}),
    ...(relatedItemNames ? { relatedItemNames } : {}),
  };
};

const reportedAtTime = (record: SupplierExceptionRecord): number => {
  if (!record.reportedAt) return 0;
  const time = new Date(record.reportedAt).getTime();
  return Number.isNaN(time) ? 0 : time;
};

export const mapDetailToFactoryExceptions = (
  detail: ProductionOrderSupplierDetail,
  module?: 'material' | 'cutting',
): FactoryException[] => {
  const productionColorId = encodeProductionColorId(detail);
  return [...(detail.exceptionRecords ?? [])]
    .sort((a, b) => reportedAtTime(b) - reportedAtTime(a))
    .map((record) => mapExceptionRecordToFactoryException(record, productionColorId))
    .filter((item) => (module ? item.module === module : true));
};
