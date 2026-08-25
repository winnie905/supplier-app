import {
  CREATE_CROP_ORDER,
  CROP_ORDER,
  UPDATE_CROP_ORDER,
} from '@/graphql/operations/cropOrder/operations';
import { createWorkshopOrderService } from '@/services/apps/workshopOrderService';
import type { CropOrder } from '@/types/cropOrder';

/** 裁床单服务：直连 apex-bff GraphQL */
export const cropOrderService = createWorkshopOrderService<CropOrder>({
  label: '裁床单',
  defaultType: 'CropOrder',
  documents: { get: CROP_ORDER, create: CREATE_CROP_ORDER, update: UPDATE_CROP_ORDER },
  fields: { get: 'cropOrder', create: 'createCropOrder', update: 'updateCropOrder' },
});
