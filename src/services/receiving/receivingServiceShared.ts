/** 收发 shared：跨 service 复用的入口，避免互相深引实现文件 */
export { currentExceptionReporter } from '@/services/receiving/receivingExceptionService';
export { emptySizeQuantities, sumQuantities } from '@/services/receiving/sizeQuantity';
export {
  cacheSupplierDetail,
  fetchFreshSupplierDetail,
  isSupplierProductionId,
  resolveProductionId,
  resolveSupplierDetail,
} from '@/services/receiving/supplierDetailCache';
export { toWorkshopProductionRef } from '@/services/receiving/workshopProductionRef';
export { todayString } from '@/utils/date';
