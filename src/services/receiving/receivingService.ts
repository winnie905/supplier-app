import { receivingCuttingService } from '@/services/receiving/receivingCuttingService';
import { receivingExceptionService } from '@/services/receiving/receivingExceptionService';
import { receivingMaterialService } from '@/services/receiving/receivingMaterialService';
import { receivingPackingService } from '@/services/receiving/receivingPackingService';
import { receivingSessionService } from '@/services/receiving/receivingSessionService';
import { receivingSewingService } from '@/services/receiving/receivingSewingService';
import {
  emptySizeQuantities,
  sizeNamesFromRange,
  sumQuantities,
} from '@/services/receiving/sizeQuantity';
import { todayString } from '@/utils/date';

export const receivingService = {
  ...receivingSessionService,
  ...receivingMaterialService,
  ...receivingExceptionService,
  ...receivingCuttingService,
  ...receivingSewingService,
  ...receivingPackingService,
};

export { emptySizeQuantities, sizeNamesFromRange, sumQuantities, todayString };
