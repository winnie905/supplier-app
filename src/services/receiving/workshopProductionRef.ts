import type { WorkshopProductionOrderRef } from '@/types/cropOrder';
import type { ProductionOrderSupplierDetail } from '@/types/supplierProductionOrder';

export const toWorkshopProductionRef = (
  detail: ProductionOrderSupplierDetail,
): WorkshopProductionOrderRef => {
  const brandSource = detail.customerPurchaseOrder?.brand ?? detail.templateDesign?.brand;
  const cpo = detail.customerPurchaseOrder;

  const ref: WorkshopProductionOrderRef = {
    id: detail.id,
    productionOrderCode: detail.productionOrderCode,
    color: detail.color,
    status: detail.status,
    // createCropOrder 的 productionOrder 入参 schema 必填项
    saleOrderCode: detail.saleOrderCode ?? cpo?.saleOrderCode ?? '',
    productionType: detail.productionType ?? '',
    bomItems: [],
    productionProcesses: [],
    secondaryProcesses: [],
    customerPurchaseOrder: {
      code: cpo?.code ?? detail.code ?? '',
      type: cpo?.type ?? detail.type ?? '',
      color: cpo?.color ?? detail.color,
      purchaseCode: detail.purchaseCode ?? '',
      brand: {
        name: brandSource?.name ?? '',
        customerId: brandSource?.customerId ?? 0,
        invoiceRegistrationAddress: '',
        invoiceRegistrationNumber: '',
        ...(brandSource?.id != null ? { id: brandSource.id } : {}),
      },
    },
  };
  if (detail.code != null) ref.code = detail.code;
  if (detail.type != null) ref.type = detail.type;
  if (detail.purchaseCode != null) ref.purchaseCode = detail.purchaseCode;
  if (detail.factoryPlanedProductionDate != null) {
    ref.factoryPlanedProductionDate = detail.factoryPlanedProductionDate;
  }
  if (cpo) {
    const mapped = ref.customerPurchaseOrder!;
    if (cpo.saleOrderCode != null) mapped.saleOrderCode = cpo.saleOrderCode;
    if (cpo.productCode != null) mapped.productCode = cpo.productCode;
    if (cpo.customerPO != null) mapped.customerPO = cpo.customerPO;
    if (cpo.quantity != null) mapped.quantity = cpo.quantity;
    if (cpo.sizeRange != null) {
      mapped.sizeRange = cpo.sizeRange.map((item) => ({
        name: item.name,
        ...(item.quantity != null ? { quantity: item.quantity } : {}),
        ...(item.outboundQuantity != null ? { outboundQuantity: item.outboundQuantity } : {}),
      }));
    }
    if (cpo.requiredProductionDate != null) {
      mapped.requiredProductionDate = cpo.requiredProductionDate;
    }
  }
  // templateDesign 入参有 type / brand 发票等必填项，查询结果不完整，写入时不回传
  return ref;
};
