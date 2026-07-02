import type { ReactNode } from 'react';

import { usePermission } from '@/hooks/usePermission';
import type { PermissionType, ProductPrivilegeMap } from '@/types/roles';

interface PermissionViewProps<P extends keyof ProductPrivilegeMap> {
  children: ReactNode;
  product: P;
  permission: ProductPrivilegeMap[P];
  type: PermissionType;
  fallback?: ReactNode;
}

const PermissionView = <P extends keyof ProductPrivilegeMap>({
  children,
  product,
  permission,
  type,
  fallback = null,
}: PermissionViewProps<P>) => {
  const hasPermission = usePermission({ product, permission, type });

  if (!hasPermission) {
    return fallback;
  }

  return children;
};

export default PermissionView;
