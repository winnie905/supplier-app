import { useAuthStore } from '@/store/authStore';
import type {
  Permission,
  PermissionObject,
  PermissionType,
  ProductPrivilegeMap,
} from '@/types/roles';

interface UsePermissionParams<P extends keyof ProductPrivilegeMap> {
  product: P;
  permission: ProductPrivilegeMap[P];
  type: PermissionType;
}

/**
 * 独立封装权限判断，方便在 hook 外部复用。
 */
export const checkPermission = <P extends keyof ProductPrivilegeMap>(
  permissions: Permission | undefined,
  product: P,
  permission: ProductPrivilegeMap[P],
  type: PermissionType,
): boolean => {
  const productPermissions = permissions?.[product] as
    | Partial<Record<ProductPrivilegeMap[P], PermissionObject>>
    | undefined;

  return Boolean(productPermissions?.[permission]?.[type]);
};

/**
 * 判断当前用户是否拥有指定产品下的某个权限。
 *
 * 示例：
 * usePermission({
 *   product: ProductEnum.ERP,
 *   permission: ErpPrivilegesType.SUB_PROCESS_COLLECT,
 *   type: 'write',
 * });
 */
export const usePermission = <P extends keyof ProductPrivilegeMap>({
  product,
  permission,
  type,
}: UsePermissionParams<P>): boolean => {
  return useAuthStore((state) =>
    checkPermission(state.user?.permissions, product, permission, type),
  );
};
