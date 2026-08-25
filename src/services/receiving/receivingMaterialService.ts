import { productionOrderService } from '@/services/apps/productionOrderService';
import {
  buildConfirmArriveMaterialInput,
  buildMaterialExceptionModuleExtend,
  mapDetailToMaterialConfirmation,
  mapExceptionRecordToFactoryException,
} from '@/services/receiving/mapReceivingProductionOrder';
import { currentExceptionReporter } from '@/services/receiving/receivingExceptionService';
import {
  cacheSupplierDetail,
  fetchFreshSupplierDetail,
  resolveSupplierDetail,
} from '@/services/receiving/supplierDetailCache';
import type { FactoryException, MaterialConfirmationData } from '@/types/receiving';
import { encodeProductionColorId } from '@/utils/receiving/productionColorId';

export const receivingMaterialService = {
  async getMaterialConfirmation(productionColorId: string): Promise<MaterialConfirmationData> {
    const supplierDetail = await resolveSupplierDetail(productionColorId);
    if (!supplierDetail) throw new Error('生产色不存在');

    const fresh = await fetchFreshSupplierDetail(supplierDetail);
    return mapDetailToMaterialConfirmation(fresh);
  },

  /** PUT /api/production_orders/supplier/confirm_arrive_material/{productionId} */
  async submitMaterialArrival(
    productionColorId: string,
    itemIds: string[],
  ): Promise<MaterialConfirmationData> {
    const supplierDetail = await resolveSupplierDetail(productionColorId);
    if (!supplierDetail) throw new Error('生产色不存在');

    const input = buildConfirmArriveMaterialInput(supplierDetail, itemIds);
    const updated = await productionOrderService.confirmArriveMaterial(supplierDetail, input);
    cacheSupplierDetail(updated);
    return mapDetailToMaterialConfirmation(updated);
  },

  /** POST /api/production_orders/supplier/exception_record */
  async submitMaterialException(input: {
    productionColorId: string;
    itemIds: string[];
    type: string;
    description: string;
  }): Promise<FactoryException> {
    const supplierDetail = await resolveSupplierDetail(input.productionColorId);
    if (!supplierDetail) throw new Error('生产色不存在');

    const materialData = mapDetailToMaterialConfirmation(supplierDetail);
    const selectedItems = materialData.items.filter((item) => input.itemIds.includes(item.id));
    const record = await productionOrderService.createExceptionRecord({
      productionId: supplierDetail.id,
      module: 'material',
      type: input.type,
      reporter: currentExceptionReporter(),
      // moduleExtend 带 relatedItems.name，web 可直接展示物料名，无需再按 id 匹配
      moduleExtend: buildMaterialExceptionModuleExtend({
        items: selectedItems.map((item) => ({ id: item.id, name: item.name })),
        description: input.description,
      }),
    });
    await fetchFreshSupplierDetail(supplierDetail);
    return mapExceptionRecordToFactoryException(record, encodeProductionColorId(supplierDetail));
  },
};
