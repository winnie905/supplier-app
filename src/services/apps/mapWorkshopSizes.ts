import { uniqueSizeNames } from '@/services/receiving/sizeQuantity';
import type { CropProcess, CropProcessSizeRange } from '@/types/cropOrder';
import type { SizeQuantity } from '@/types/receiving';
import type { User } from '@/types/user';

/** CropProcess.sizeRange → 尺码数量列表（裁床/车缝/尾部共用） */
export const toSizeQuantities = (process: CropProcess): SizeQuantity[] =>
  (process.sizeRange ?? []).map((item) => ({
    size: item.name,
    quantity: item.cropQuantity ?? 0,
  }));

/** 尺码数量列表 → CropProcess.sizeRange（写入方向） */
export const toCropSizeRange = (values: SizeQuantity[]): CropProcessSizeRange[] =>
  values.map((item) => ({
    name: item.size,
    cropQuantity: item.quantity,
  }));

export const sumCropQuantity = (sizeRange: CropProcessSizeRange[]): number =>
  sizeRange.reduce((sum, item) => sum + (item.cropQuantity ?? 0), 0);

export const sumProcessQuantity = (processes: CropProcess[]): number =>
  processes.reduce((sum, item) => sum + (item.totalQuantity ?? 0), 0);

/** 页面本地新建记录 id（`local-` 前缀），提交后端时不携带 */
export const isLocalRecordId = (id: string) => id.startsWith('local-');

/**
 * 计划码数：优先生产单尺码表，再按传入顺序回退到已有记录的码数。
 * 与 `a ?? b ?? []` 语义一致，仅在候选为 null/undefined 时继续回退。
 */
export const planSizeNames = (...candidates: (string[] | undefined)[]): string[] =>
  uniqueSizeNames(candidates.find((names) => names != null) ?? []);

/** 提交裁床/车缝/尾部时写入 CropProcess 的维护人与维护时间 */
export interface CropProcessSubmitAudit {
  targetIds: string[];
  maintainer: User;
  maintenanceDate: string;
}

/** GraphQL User 入参不能带 __typename，只回传 schema 允许的字段 */
const sanitizeMaintainer = (user?: User): User | undefined => {
  if (!user) return undefined;
  const id = user.id != null ? Number(user.id) : NaN;
  const next: User = {
    ...(Number.isFinite(id) ? { id } : {}),
    ...(user.username ? { username: user.username } : {}),
    ...(user.firstName ? { firstName: user.firstName } : {}),
    ...(user.lastName ? { lastName: user.lastName } : {}),
    ...(user.email ? { email: user.email } : {}),
    ...(user.avatar ? { avatar: user.avatar } : {}),
  };
  return Object.keys(next).length > 0 ? next : undefined;
};

/** 本次提交的工序盖章当前用户/时间；其余工序保留已有维护信息 */
export const withCropProcessAudit = (
  process: CropProcess,
  params: {
    stamp: boolean;
    audit: CropProcessSubmitAudit;
    existing?: CropProcess;
  },
): CropProcess => {
  if (params.stamp) {
    return {
      ...process,
      maintainer: sanitizeMaintainer(params.audit.maintainer) ?? params.audit.maintainer,
      maintenanceDate: params.audit.maintenanceDate,
    };
  }
  const maintainer = sanitizeMaintainer(params.existing?.maintainer);
  return {
    ...process,
    ...(maintainer ? { maintainer } : {}),
    ...(params.existing?.maintenanceDate
      ? { maintenanceDate: params.existing.maintenanceDate }
      : {}),
  };
};

export const findCropProcessById = (
  processes: CropProcess[] | undefined,
  id?: string,
): CropProcess | undefined => (id ? processes?.find((item) => item.id === id) : undefined);
