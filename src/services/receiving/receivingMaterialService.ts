import {
  buildConfirmArriveMaterialInput,
  buildMaterialExceptionReportContent,
  calcMaterialProgressFromItems,
  mapDetailToFactoryExceptions,
  mapDetailToMaterialConfirmation,
  mapExceptionRecordToFactoryException,
} from '@/services/apps/mapReceivingProductionOrder';
import { productionOrderService } from '@/services/apps/productionOrderService';
import {
  cacheSupplierDetail,
  createId,
  delay,
  ensureMaterialItems,
  fetchFreshSupplierDetail,
  resolveSupplierDetail,
  withState,
} from '@/services/receiving/receivingServiceShared';
import type {
  ExceptionModule,
  FactoryException,
  MaterialConfirmationData,
} from '@/types/receiving';
import { loadReceivingState, saveReceivingState } from '@/utils/receiving/storage';

export const receivingMaterialService = {
  async getMaterialConfirmation(productionColorId: string): Promise<MaterialConfirmationData> {
    const supplierDetail = await resolveSupplierDetail(productionColorId);
    if (supplierDetail) {
      // 拉最新详情（确认到料 / 异常后状态会变）；同屏并发与 exceptions 合并
      const fresh = await fetchFreshSupplierDetail(supplierDetail);
      return mapDetailToMaterialConfirmation(fresh);
    }

    await delay();
    const state = await loadReceivingState();
    const items = ensureMaterialItems(state, productionColorId);
    const { arrivedCount, totalCount, progressPercent } = calcMaterialProgressFromItems(items);
    await saveReceivingState(state);
    return { productionColorId, items, arrivedCount, totalCount, progressPercent };
  },

  async getFactoryExceptions(
    productionColorId: string,
    module?: ExceptionModule,
  ): Promise<FactoryException[]> {
    const supplierDetail = await resolveSupplierDetail(productionColorId);
    if (supplierDetail) {
      const fresh = await fetchFreshSupplierDetail(supplierDetail);
      return mapDetailToFactoryExceptions(fresh, module);
    }

    await delay();
    const state = await loadReceivingState();
    return state.exceptions.filter(
      (item) =>
        item.productionColorId === productionColorId && (module ? item.module === module : true),
    );
  },

  async getPendingExceptionCount(
    productionColorId: string,
    module: ExceptionModule,
  ): Promise<number> {
    const list = await receivingMaterialService.getFactoryExceptions(productionColorId, module);
    return list.filter((item) => item.status === 'pending').length;
  },

  /** PUT /api/production_orders/supplier/confirm_arrive_material/{productionId} */
  async submitMaterialArrival(
    productionColorId: string,
    itemIds: string[],
  ): Promise<MaterialConfirmationData> {
    const supplierDetail = await resolveSupplierDetail(productionColorId);
    if (supplierDetail) {
      const input = buildConfirmArriveMaterialInput(supplierDetail, itemIds);
      const updated = await productionOrderService.confirmArriveMaterial(supplierDetail.id, input);
      cacheSupplierDetail(updated);
      return mapDetailToMaterialConfirmation(updated);
    }

    return withState((state) => {
      const items = ensureMaterialItems(state, productionColorId);
      items.forEach((item) => {
        if (itemIds.includes(item.id) && !item.statuses.includes('arrived')) {
          const nextStatuses = item.statuses.filter((s) => s !== 'pending');
          if (!nextStatuses.includes('arrived')) {
            nextStatuses.push('arrived');
          }
          item.statuses = nextStatuses;
        }
      });
      const progress = calcMaterialProgressFromItems(items);
      return { productionColorId, items, ...progress };
    });
  },

  /** POST /api/production_orders/supplier/exception_record */
  async submitMaterialException(input: {
    productionColorId: string;
    itemIds: string[];
    type: string;
    description: string;
  }): Promise<FactoryException> {
    const supplierDetail = await resolveSupplierDetail(input.productionColorId);
    if (supplierDetail) {
      const materialData = mapDetailToMaterialConfirmation(supplierDetail);
      const selectedItems = materialData.items.filter((item) => input.itemIds.includes(item.id));
      const record = await productionOrderService.createExceptionRecord({
        productionId: supplierDetail.id,
        module: 'material',
        type: input.type,
        reportContent: buildMaterialExceptionReportContent({
          itemNames: selectedItems.map((item) => item.name),
          type: input.type,
          description: input.description,
        }),
        moduleExtend: { relatedItemIds: input.itemIds },
        reporter: { id: 1, username: 'factory', firstName: '工', lastName: '厂' },
      });
      await fetchFreshSupplierDetail(supplierDetail);
      return mapExceptionRecordToFactoryException(record, String(supplierDetail.id));
    }

    return withState((state) => {
      const items = ensureMaterialItems(state, input.productionColorId);
      const selectedItems = items.filter((item) => input.itemIds.includes(item.id));
      const tag = selectedItems.map((item) => item.name).join('、');

      selectedItems.forEach((item) => {
        if (input.type.includes('缺料') && !item.statuses.includes('shortage')) {
          item.statuses.push('shortage');
        }
        if (input.type.includes('质量问题') && !item.statuses.includes('quality_issue')) {
          item.statuses.push('quality_issue');
        }
      });

      const exception: FactoryException = {
        id: createId('exc'),
        productionColorId: input.productionColorId,
        module: 'material',
        type: input.type,
        status: 'pending',
        reporter: '当前用户',
        reportedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        content: tag,
        description: input.description,
        relatedItemIds: input.itemIds,
      };
      state.exceptions.push(exception);
      return exception;
    });
  },
};
