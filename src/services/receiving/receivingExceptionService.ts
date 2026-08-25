import { mapDetailToFactoryExceptions } from '@/services/receiving/mapReceivingProductionOrder';
import {
  fetchFreshSupplierDetail,
  resolveSupplierDetail,
} from '@/services/receiving/supplierDetailCache';
import { useAuthStore } from '@/store/authStore';
import type { ExceptionModule, FactoryException } from '@/types/receiving';
import type { SupplierApiUser } from '@/types/supplierProductionOrder';

/** 异常上报的 reporter 为必填入参，取当前登录用户 */
export const currentExceptionReporter = (): SupplierApiUser => {
  const user = useAuthStore.getState().user;
  if (!user) return {};

  const id = Number(user.id);
  return {
    ...(Number.isFinite(id) ? { id } : {}),
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatar: user.avatar,
  };
};

export const receivingExceptionService = {
  async getFactoryExceptions(
    productionColorId: string,
    module?: ExceptionModule,
  ): Promise<FactoryException[]> {
    const supplierDetail = await resolveSupplierDetail(productionColorId);
    if (!supplierDetail) throw new Error('生产色不存在');

    const fresh = await fetchFreshSupplierDetail(supplierDetail);
    return mapDetailToFactoryExceptions(fresh, module);
  },

  async getPendingExceptionCount(
    productionColorId: string,
    module: ExceptionModule,
  ): Promise<number> {
    const list = await receivingExceptionService.getFactoryExceptions(productionColorId, module);
    return list.filter((item) => item.status === 'pending').length;
  },
};
