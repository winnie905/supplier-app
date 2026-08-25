import type { CropProcess } from '@/types/cropOrder';
import type { ModuleStatusSummary } from '@/types/receiving';
import type { ProductionOrderSupplierDetail } from '@/types/supplierProductionOrder';

const processTotal = (process: CropProcess): number => {
  if (process.totalQuantity != null) return process.totalQuantity;
  return (process.sizeRange ?? []).reduce((sum, item) => sum + (item.cropQuantity ?? 0), 0);
};

const isUpSew = (type?: string) => type === 'UpSew' || type === 'up';

/** 从生产单详情内嵌 Preview 汇总裁/缝/尾入口数量 */
export const mapWorkshopOrdersToModuleStatus = (
  detail: Pick<ProductionOrderSupplierDetail, 'cropOrder' | 'sewingOrder' | 'tailOrder'>,
): Pick<ModuleStatusSummary, 'cutting' | 'sewing' | 'packing'> => {
  const cropProcesses = detail.cropOrder?.cropOrderStorage?.cropProcesses ?? [];
  const cutTotal =
    detail.cropOrder?.cropOrderStorage?.cropTotal ??
    cropProcesses.reduce((sum, process) => sum + processTotal(process), 0);

  const sewProcesses = detail.sewingOrder?.cropOrderStorage?.cropProcesses ?? [];
  let upTotal = 0;
  let downTotal = 0;
  for (const process of sewProcesses) {
    const qty = processTotal(process);
    if (isUpSew(process.type)) {
      upTotal += qty;
    } else {
      // DownSew / 其它 → 下车位（与车位页映射约定一致）
      downTotal += qty;
    }
  }

  const packProcesses = detail.tailOrder?.cropOrderStorage?.cropProcesses ?? [];
  const boxCount = packProcesses.length;
  const pieceCount =
    detail.tailOrder?.cropOrderStorage?.cropTotal ??
    packProcesses.reduce((sum, process) => sum + processTotal(process), 0);

  return {
    cutting: { cutTotal, hasException: false },
    sewing: { upTotal, downTotal },
    packing: { boxCount, pieceCount },
  };
};
