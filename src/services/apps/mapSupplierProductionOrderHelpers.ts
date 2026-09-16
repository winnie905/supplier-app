import type { ProductionOrderAggregateStatus } from '@/types/apps';
import type { ProductionOrderUser } from '@/types/productionOrder';
import { ProductionStatus } from '@/types/productionOrder';
import type { User } from '@/types/user';

export const emptyUser = (partial?: Partial<ProductionOrderUser> | User): ProductionOrderUser => {
  const id = partial?.id != null ? Number(partial.id) : NaN;
  return {
    ...(Number.isFinite(id) ? { id } : {}),
    username: partial?.username ?? '',
    email: partial?.email ?? '',
    firstName: partial?.firstName ?? '',
    lastName: partial?.lastName ?? '',
    avatar: partial?.avatar ?? '',
    dateOfBirth: '',
    gender: '',
    ...(partial?.mobile != null ? { mobile: partial.mobile } : {}),
    ...(partial?.createdAt != null ? { createdAt: partial.createdAt } : {}),
    ...(partial?.updatedAt != null ? { updatedAt: partial.updatedAt } : {}),
    ...(partial?.isDeleted != null ? { isDeleted: partial.isDeleted } : {}),
  };
};

export const mapSupplierStatusToAggregate = (status?: string): ProductionOrderAggregateStatus => {
  if (status === 'Finished') return 'completed';
  if (status === 'InProgress') return 'in_progress';
  return 'pending';
};

export const mapColorStatusToProductionStatus = (status?: string): ProductionStatus => {
  switch (status) {
    case 'Finished':
      return ProductionStatus.Finished;
    case 'InProgress':
      return ProductionStatus.InProgress;
    case 'PartialComplete':
      return ProductionStatus.PartialComplete;
    case 'Ordered':
      return ProductionStatus.Ordered;
    case 'Pending':
    default:
      return ProductionStatus.Pending;
  }
};
