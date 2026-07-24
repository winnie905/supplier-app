import { receivingCuttingService } from '@/services/receiving/receivingCuttingService';
import { receivingMaterialService } from '@/services/receiving/receivingMaterialService';
import { receivingPackingService } from '@/services/receiving/receivingPackingService';
import {
  emptySizeQuantities,
  sumQuantities,
  todayString,
} from '@/services/receiving/receivingServiceShared';
import { receivingSessionService } from '@/services/receiving/receivingSessionService';
import { receivingSewingService } from '@/services/receiving/receivingSewingService';

export const receivingService = {
  ...receivingSessionService,
  ...receivingMaterialService,
  ...receivingCuttingService,
  ...receivingSewingService,
  ...receivingPackingService,
};

export { emptySizeQuantities, sumQuantities, todayString };
