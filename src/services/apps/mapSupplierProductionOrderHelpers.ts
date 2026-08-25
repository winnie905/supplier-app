import type { ProductionOrderAggregateStatus } from '@/types/apps';
import { ProductionStatus, type User } from '@/types/productionOrder';

export const emptyUser = (partial?: Partial<User>): User => ({
  username: partial?.username ?? '',
  email: partial?.email ?? '',
  firstName: partial?.firstName ?? '',
  lastName: partial?.lastName ?? '',
  avatar: partial?.avatar ?? '',
  dateOfBirth: '',
  gender: '',
  ...partial,
});

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
