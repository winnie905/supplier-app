import {
  CREATE_CROP_ORDER,
  CROP_ORDER,
  CROP_ORDER_STATISTIC,
  UPDATE_CROP_ORDER,
} from '@/graphql/operations/cropOrder/operations';
import { executeMockCropSewOrderGraphql } from '@/services/apps/mockCropSewOrderGraphql';
import type { CropOrder, CropOrderStatistic, CropOrderStatisticInput } from '@/types/cropOrder';

/**
 * 裁床单服务：当前走本地 mock GraphQL，BFF 就绪后替换为 apolloClient。
 */
export const cropOrderService = {
  async getById(id: number): Promise<CropOrder> {
    const data = await executeMockCropSewOrderGraphql<{ cropOrder: CropOrder }>(CROP_ORDER, {
      id,
    });
    return data.cropOrder;
  },

  async tryGetById(id: number): Promise<CropOrder | null> {
    try {
      return await this.getById(id);
    } catch {
      return null;
    }
  },

  async create(input: CropOrder): Promise<CropOrder> {
    const data = await executeMockCropSewOrderGraphql<{ createCropOrder: CropOrder }>(
      CREATE_CROP_ORDER,
      { input },
    );
    return data.createCropOrder;
  },

  async update(input: CropOrder): Promise<CropOrder> {
    const data = await executeMockCropSewOrderGraphql<{ updateCropOrder: CropOrder }>(
      UPDATE_CROP_ORDER,
      { input },
    );
    return data.updateCropOrder;
  },

  async getStatistic(input: CropOrderStatisticInput = {}): Promise<CropOrderStatistic> {
    const data = await executeMockCropSewOrderGraphql<{
      cropOrderStatistic: CropOrderStatistic;
    }>(CROP_ORDER_STATISTIC, { input });
    return data.cropOrderStatistic;
  },
};
