/**
 * 存放后端权限模型到前端权限结构的转换与解析函数。
 */
import type { AuthProduct } from '@/types';
import { ProductEnum } from '@/types';
import type { Permission, PermissionObject, Role } from '@/types/roles';
import {
  AmoebaPrivilegeType,
  CumsPrivilegeType,
  ErpPrivilegesType,
  SrmPrivilegeType,
} from '@/types/roles';

/**
 * 后端返回的权限名前缀
 * 例如：PRIVILEGE_ORDER_READ
 */
const PRIVILEGE_PREFIX = 'PRIVILEGE_';
const WRITE_SUFFIX = '_WRITE';
const READ_SUFFIX = '_READ';

/**
 * 每个产品对应自己那套权限枚举
 *
 * 作用：
 * 1. 初始化权限对象时，知道每个产品有哪些权限 key
 * 2. 后续如果新增产品，只需要在这里补一项
 */
const privilegeMap = {
  [ProductEnum.ERP]: Object.values(ErpPrivilegesType),
  [ProductEnum.AMOEBA]: Object.values(AmoebaPrivilegeType),
  [ProductEnum.CUMS]: Object.values(CumsPrivilegeType),
  [ProductEnum.SRM]: Object.values(SrmPrivilegeType),
} as const;

/**
 * 支持权限转换的产品类型
 *
 * 这里取 privilegeMap 的 key，避免手写联合类型
 * 当前就是：ERP | AMOEBA | CUMS | SRM
 */
type SupportedProduct = keyof typeof privilegeMap;

/**
 * 所有产品权限 key 的联合类型
 *
 * 作用：
 * getPermission 解析权限名后，返回的 key 会落在这些枚举值里
 */
type PrivilegeKey = ErpPrivilegesType | AmoebaPrivilegeType | CumsPrivilegeType | SrmPrivilegeType;

/**
 * 创建一个“空权限对象”
 *
 * 默认所有权限都是 false
 */
const createEmptyPermissionObject = (): PermissionObject => ({
  read: false,
  write: false,
});

/**
 * 根据某个产品的权限枚举列表，生成该产品的初始权限表
 *
 * 例如传入：
 * ['ADMIN', 'ORDER', 'USER']
 *
 * 会生成：
 * {
 *   ADMIN: { read: false, write: false },
 *   ORDER: { read: false, write: false },
 *   USER: { read: false, write: false },
 * }
 */
const createPermissionRecord = <T extends string>(
  privileges: readonly T[],
): Record<T, PermissionObject> => {
  return privileges.reduce(
    (acc, privilege) => {
      acc[privilege] = createEmptyPermissionObject();
      return acc;
    },
    {} as Record<T, PermissionObject>,
  );
};

/**
 * 创建完整的初始权限对象
 *
 * 这里会把每个产品的权限全部先初始化成 false
 */
const createInitialPermissions = (): Permission => {
  return {
    [ProductEnum.ERP]: createPermissionRecord(privilegeMap[ProductEnum.ERP]),
    [ProductEnum.AMOEBA]: createPermissionRecord(privilegeMap[ProductEnum.AMOEBA]),
    [ProductEnum.CUMS]: createPermissionRecord(privilegeMap[ProductEnum.CUMS]),
    [ProductEnum.SRM]: createPermissionRecord(privilegeMap[ProductEnum.SRM]),
  } as Permission;
};

/**
 * 把后端返回的 products 数据，转换成前端统一使用的 Permission 结构
 *
 * 主要流程：
 * 1. 先创建一个“全 false”的初始权限对象
 * 2. 遍历每个产品
 * 3. 读取该产品下所有角色 roles
 * 4. 把角色里的 privileges 映射到权限表上
 */
export const convertPermission = (products: AuthProduct[]): Permission => {
  const permissions = createInitialPermissions();

  // 没有产品数据，直接返回默认全 false 的权限
  if (!products?.length) {
    return permissions;
  }

  for (const product of products) {
    // MES 当前不参与权限转换，直接跳过
    if (product.name === ProductEnum.MES) {
      continue;
    }

    // 把当前产品下的角色权限写入 permissions
    applyRolesPermission(permissions, product.roles ?? [], product.name);
  }

  return permissions;
};

/**
 * 把某个产品下的 roles 权限写入到 permissions 中
 *
 * 注意：
 * - 这里是“直接修改传入的 permissions 对象”
 * - 不会返回新对象，所以返回值是 void
 */
const applyRolesPermission = (
  permissions: Permission,
  roles: Role[],
  product: SupportedProduct,
): void => {
  const productPermissions = permissions[product];

  for (const role of roles) {
    // 没有 privileges，直接跳过
    if (!role.privileges?.length) {
      continue;
    }

    for (const privilege of role.privileges) {
      /**
       * 只处理符合格式的权限名
       * 例如：PRIVILEGE_ORDER_READ / PRIVILEGE_ORDER_WRITE
       */
      if (!privilege.name.startsWith(PRIVILEGE_PREFIX)) {
        continue;
      }

      /**
       * 把字符串权限名解析成：
       * {
       *   key: 'ORDER',
       *   value: { read: true, write: false }
       * }
       */
      const result = getPermission(privilege.name);

      // 无法解析的权限名，跳过
      if (!result) {
        continue;
      }

      /**
       * 从当前产品的权限表里取出对应权限项
       *
       * 例如：
       * permissions[ERP]['ORDER']
       */
      if (!productPermissions) {
        continue;
      }

      const permissionItem = productPermissions[result.key as keyof typeof productPermissions] as
        | PermissionObject
        | undefined;

      // 当前产品里不存在这个权限 key，就跳过
      if (!permissionItem) {
        continue;
      }

      // 把解析出的读权限写回去
      if (result.value.read) {
        permissionItem.read = true;
      }

      // 把解析出的写权限写回去
      if (result.value.write) {
        permissionItem.write = true;
      }
    }
  }
};

/**
 * 解析单个权限名
 *
 * 例如：
 * PRIVILEGE_ORDER_READ
 * => { key: 'ORDER', value: { read: true, write: false } }
 *
 * PRIVILEGE_ORDER_WRITE
 * => { key: 'ORDER', value: { read: false, write: true } }
 *
 * 如果格式不符合预期，则返回 undefined
 */
const getPermission = (
  name: string,
): { key: PrivilegeKey; value: PermissionObject } | undefined => {
  // 去掉前缀：PRIVILEGE_
  const key = name.replace(PRIVILEGE_PREFIX, '');

  // 默认读写都没有
  const value: PermissionObject = { read: false, write: false };

  let privilegeType: PrivilegeKey | undefined;

  /**
   * 判断是否是写权限
   * 例如：ORDER_WRITE
   * 解析后得到：ORDER
   */
  if (key.endsWith(WRITE_SUFFIX)) {
    privilegeType = key.slice(0, -WRITE_SUFFIX.length) as PrivilegeKey;
    value.write = true;
  }

  /**
   * 判断是否是读权限
   * 例如：ORDER_READ
   * 解析后得到：ORDER
   */
  if (key.endsWith(READ_SUFFIX)) {
    privilegeType = key.slice(0, -READ_SUFFIX.length) as PrivilegeKey;
    value.read = true;
  }

  // 只有成功解析出权限 key，才返回结果
  return privilegeType ? { key: privilegeType, value } : undefined;
};
