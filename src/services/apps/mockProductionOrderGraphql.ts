import type { DocumentNode } from 'graphql';
import { Kind, print } from 'graphql';

import {
  getMockDetail,
  getMockSearch,
  getMockStatistic,
  mockConfirmArriveMaterial,
  mockCreateExceptionRecord,
} from '@/services/apps/mockSupplierProductionOrderApi';
import type {
  ConfirmArriveMaterialInput,
  CreateExceptionRecordInput,
  ProductionOrderSupplierSearchInput,
  ProductionOrderSupplierStatisticInput,
} from '@/types/supplierProductionOrder';

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const getOperationName = (document: DocumentNode): string => {
  const def = document.definitions.find((item) => item.kind === Kind.OPERATION_DEFINITION);
  if (def?.kind === Kind.OPERATION_DEFINITION && def.name?.value) {
    return def.name.value;
  }
  // fallback: parse printed string
  const printed = print(document);
  const match = /\b(?:query|mutation)\s+(\w+)/.exec(printed);
  return match?.[1] ?? '';
};

/**
 * 本地 mock GraphQL 执行器：按 operation name 分发到供应商生产单 mock。
 * BFF 就绪后，service 可改为 apolloClient.query/mutate，本文件可删除或仅用于单测。
 */
export async function executeMockProductionOrderGraphql<TData>(
  document: DocumentNode,
  variables: Record<string, unknown> = {},
): Promise<TData> {
  await delay();
  const operationName = getOperationName(document);

  switch (operationName) {
    case 'ProductionOrderSupplierStatistic': {
      const input = (variables.input ?? {}) as ProductionOrderSupplierStatisticInput;
      return {
        productionOrderSupplierStatistic: getMockStatistic(input),
      } as TData;
    }
    case 'ProductionOrderSupplierSearch': {
      const input = (variables.input ?? {}) as ProductionOrderSupplierSearchInput;
      return {
        productionOrderSupplierSearch: getMockSearch(input),
      } as TData;
    }
    case 'ProductionOrderSupplierDetail': {
      const productionOrderCode =
        typeof variables.productionOrderCode === 'string' ? variables.productionOrderCode : '';
      const color = typeof variables.color === 'string' ? variables.color : '';
      const detail = getMockDetail(productionOrderCode, color);
      if (!detail) {
        throw new Error('生产单详情不存在');
      }
      return { productionOrderSupplierDetail: detail } as TData;
    }
    case 'ConfirmArriveMaterial': {
      const productionId = Number(variables.productionId);
      const input = (variables.input ?? {}) as ConfirmArriveMaterialInput;
      const detail = mockConfirmArriveMaterial(productionId, input);
      if (!detail) {
        throw new Error('确认到料失败：生产单不存在');
      }
      return { confirmArriveMaterial: detail } as TData;
    }
    case 'CreateProductionOrderExceptionRecord': {
      const input = (variables.input ?? {}) as CreateExceptionRecordInput;
      return {
        createProductionOrderExceptionRecord: mockCreateExceptionRecord(input),
      } as TData;
    }
    default:
      throw new Error(`[mockGraphql] Unsupported operation: ${operationName || 'unknown'}`);
  }
}
