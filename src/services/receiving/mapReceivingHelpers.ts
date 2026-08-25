import type { ModuleStatusSummary } from '@/types/receiving';

export const emptyModuleStatus = (): ModuleStatusSummary => ({
  material: 'pending',
  cutting: { cutTotal: 0, hasException: false },
  sewing: { upTotal: 0, downTotal: 0 },
  packing: { boxCount: 0, pieceCount: 0 },
});

export const formatUserName = (user?: {
  firstName?: string;
  lastName?: string;
  username?: string;
}): string => {
  const name = `${user?.lastName ?? ''}${user?.firstName ?? ''}`.trim();
  return name.length > 0 ? name : (user?.username ?? '未知');
};
