import {
  CREATE_SEW_ORDER,
  SEW_ORDER,
  UPDATE_SEW_ORDER,
} from '@/graphql/operations/sewOrder/operations';
import { createWorkshopOrderService } from '@/services/apps/workshopOrderService';
import type { SewOrder } from '@/types/cropOrder';

/** 车缝单服务：直连 apex-bff GraphQL */
export const sewOrderService = createWorkshopOrderService<SewOrder>({
  label: '车缝单',
  defaultType: 'SewingOrder',
  documents: { get: SEW_ORDER, create: CREATE_SEW_ORDER, update: UPDATE_SEW_ORDER },
  fields: { get: 'sewOrder', create: 'createSewOrder', update: 'updateSewOrder' },
});
