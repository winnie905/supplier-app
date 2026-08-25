import {
  CREATE_TAIL_ORDER,
  TAIL_ORDER,
  UPDATE_TAIL_ORDER,
} from '@/graphql/operations/tailOrder/operations';
import { createWorkshopOrderService } from '@/services/apps/workshopOrderService';
import type { TailOrder } from '@/types/cropOrder';

/** 尾部单服务：直连 apex-bff GraphQL */
export const tailOrderService = createWorkshopOrderService<TailOrder>({
  label: '尾部单',
  defaultType: 'TailOrder',
  documents: { get: TAIL_ORDER, create: CREATE_TAIL_ORDER, update: UPDATE_TAIL_ORDER },
  fields: { get: 'tailOrder', create: 'createTailOrder', update: 'updateTailOrder' },
});
