import {
  CREATE_SEW_ORDER,
  SEW_ORDER,
  SEW_ORDER_STATISTIC,
  UPDATE_SEW_ORDER,
} from '@/graphql/operations/sewOrder/operations';
import { executeMockCropSewOrderGraphql } from '@/services/apps/mockCropSewOrderGraphql';
import type { SewOrder, SewOrderStatistic, SewOrderStatisticInput } from '@/types/cropOrder';

/**
 * 车缝单服务：当前走本地 mock GraphQL，BFF 就绪后替换为 apolloClient。
 */
export const sewOrderService = {
  async getById(id: number): Promise<SewOrder> {
    const data = await executeMockCropSewOrderGraphql<{ sewOrder: SewOrder }>(SEW_ORDER, {
      id,
    });
    return data.sewOrder;
  },

  async tryGetById(id: number): Promise<SewOrder | null> {
    try {
      return await this.getById(id);
    } catch {
      return null;
    }
  },

  async create(input: SewOrder): Promise<SewOrder> {
    const data = await executeMockCropSewOrderGraphql<{ createSewOrder: SewOrder }>(
      CREATE_SEW_ORDER,
      { input },
    );
    return data.createSewOrder;
  },

  async update(input: SewOrder): Promise<SewOrder> {
    const data = await executeMockCropSewOrderGraphql<{ updateSewOrder: SewOrder }>(
      UPDATE_SEW_ORDER,
      { input },
    );
    return data.updateSewOrder;
  },

  async getStatistic(input: SewOrderStatisticInput = {}): Promise<SewOrderStatistic> {
    const data = await executeMockCropSewOrderGraphql<{
      sewOrderStatistic: SewOrderStatistic;
    }>(SEW_ORDER_STATISTIC, { input });
    return data.sewOrderStatistic;
  },
};
