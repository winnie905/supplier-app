import type { DocumentNode } from '@apollo/client';

import { apolloClient } from '@/graphql/client';
import type { CropOrder, CropOrderType } from '@/types/cropOrder';

interface WorkshopOrderServiceConfig {
  /** 错误文案中的单据名称，如「裁床单」 */
  label: string;
  /** 入参未带 cropOrderType 时的兜底值 */
  defaultType: CropOrderType;
  documents: {
    get: DocumentNode;
    create: DocumentNode;
    update: DocumentNode;
  };
  /** GraphQL 响应的根字段名 */
  fields: {
    get: string;
    create: string;
    update: string;
  };
}

export interface WorkshopOrderService<T extends CropOrder> {
  getById: (id: number) => Promise<T>;
  tryGetById: (id: number) => Promise<T | null>;
  create: (input: T) => Promise<T>;
  update: (input: T) => Promise<T>;
}

/**
 * 裁床 / 车缝 / 尾部单三者的 GraphQL 读写结构一致，
 * 差异只有 document、响应根字段名、默认单据类型与错误文案。
 */
export const createWorkshopOrderService = <T extends CropOrder>({
  label,
  defaultType,
  documents,
  fields,
}: WorkshopOrderServiceConfig): WorkshopOrderService<T> => {
  const service: WorkshopOrderService<T> = {
    async getById(id) {
      const { data } = await apolloClient.query<Record<string, T | null>>({
        query: documents.get,
        variables: { id },
        fetchPolicy: 'network-only',
      });

      const order = data?.[fields.get];
      if (!order) {
        throw new Error(`${label}不存在`);
      }
      return order;
    },

    async tryGetById(id) {
      try {
        return await service.getById(id);
      } catch {
        return null;
      }
    },

    async create(input) {
      const { data } = await apolloClient.mutate<Record<string, T | null>>({
        mutation: documents.create,
        variables: { input, type: input.cropOrderType ?? defaultType },
      });

      const order = data?.[fields.create];
      if (!order) {
        throw new Error(`创建${label}失败`);
      }
      return order;
    },

    async update(input) {
      const { data } = await apolloClient.mutate<Record<string, T | null>>({
        mutation: documents.update,
        variables: { input, type: input.cropOrderType ?? defaultType },
      });

      const order = data?.[fields.update];
      if (!order) {
        throw new Error(`更新${label}失败`);
      }
      return order;
    },
  };

  return service;
};
