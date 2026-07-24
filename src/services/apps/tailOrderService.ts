import {
  CREATE_TAIL_ORDER,
  TAIL_ORDER,
  TAIL_ORDER_STATISTIC,
  UPDATE_TAIL_ORDER,
} from '@/graphql/operations/tailOrder/operations';
import { executeMockCropSewOrderGraphql } from '@/services/apps/mockCropSewOrderGraphql';
import type { TailOrder, TailOrderStatistic, TailOrderStatisticInput } from '@/types/cropOrder';

/**
 * 尾部单服务：当前走本地 mock GraphQL，BFF 就绪后替换为 apolloClient。
 */
export const tailOrderService = {
  async getById(id: number): Promise<TailOrder> {
    const data = await executeMockCropSewOrderGraphql<{ tailOrder: TailOrder }>(TAIL_ORDER, {
      id,
    });
    return data.tailOrder;
  },

  async tryGetById(id: number): Promise<TailOrder | null> {
    try {
      return await this.getById(id);
    } catch {
      return null;
    }
  },

  async create(input: TailOrder): Promise<TailOrder> {
    const data = await executeMockCropSewOrderGraphql<{ createTailOrder: TailOrder }>(
      CREATE_TAIL_ORDER,
      { input },
    );
    return data.createTailOrder;
  },

  async update(input: TailOrder): Promise<TailOrder> {
    const data = await executeMockCropSewOrderGraphql<{ updateTailOrder: TailOrder }>(
      UPDATE_TAIL_ORDER,
      { input },
    );
    return data.updateTailOrder;
  },

  async getStatistic(input: TailOrderStatisticInput = {}): Promise<TailOrderStatistic> {
    const data = await executeMockCropSewOrderGraphql<{
      tailOrderStatistic: TailOrderStatistic;
    }>(TAIL_ORDER_STATISTIC, { input });
    return data.tailOrderStatistic;
  },
};
