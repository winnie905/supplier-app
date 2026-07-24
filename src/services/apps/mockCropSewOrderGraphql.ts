import type { DocumentNode } from 'graphql';
import { Kind, print } from 'graphql';

import {
  createMockCropOrder,
  createMockSewOrder,
  createMockTailOrder,
  getMockBoxSpecificationsByBrand,
  getMockCropOrder,
  getMockCropOrderStatistic,
  getMockSewOrder,
  getMockSewOrderStatistic,
  getMockTailOrder,
  getMockTailOrderStatistic,
  updateMockCropOrder,
  updateMockSewOrder,
  updateMockTailOrder,
} from '@/services/apps/mockCropOrderApi';
import type {
  CropOrder,
  CropOrderStatisticInput,
  SewOrder,
  SewOrderStatisticInput,
  TailOrder,
  TailOrderStatisticInput,
} from '@/types/cropOrder';

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const getOperationName = (document: DocumentNode): string => {
  const def = document.definitions.find((item) => item.kind === Kind.OPERATION_DEFINITION);
  if (def?.kind === Kind.OPERATION_DEFINITION && def.name?.value) {
    return def.name.value;
  }
  const printed = print(document);
  const match = /\b(?:query|mutation)\s+(\w+)/.exec(printed);
  return match?.[1] ?? '';
};

/**
 * 裁床 / 车缝 / 尾部 / 箱规 mock GraphQL 执行器。
 * BFF 就绪后，service 可改为 apolloClient.query/mutate。
 */
export async function executeMockCropSewOrderGraphql<TData>(
  document: DocumentNode,
  variables: Record<string, unknown> = {},
): Promise<TData> {
  await delay();
  const operationName = getOperationName(document);

  switch (operationName) {
    case 'CropOrder': {
      const id = Number(variables.id);
      const order = getMockCropOrder(id);
      if (!order) throw new Error('裁床单不存在');
      return { cropOrder: order } as TData;
    }
    case 'CreateCropOrder': {
      const input = (variables.input ?? {}) as CropOrder;
      return { createCropOrder: createMockCropOrder(input) } as TData;
    }
    case 'UpdateCropOrder': {
      const input = (variables.input ?? {}) as CropOrder;
      return { updateCropOrder: updateMockCropOrder(input) } as TData;
    }
    case 'CropOrderStatistic': {
      const input = (variables.input ?? {}) as CropOrderStatisticInput;
      return { cropOrderStatistic: getMockCropOrderStatistic(input) } as TData;
    }
    case 'SewOrder': {
      const id = Number(variables.id);
      const order = getMockSewOrder(id);
      if (!order) throw new Error('车缝单不存在');
      return { sewOrder: order } as TData;
    }
    case 'CreateSewOrder': {
      const input = (variables.input ?? {}) as SewOrder;
      return { createSewOrder: createMockSewOrder(input) } as TData;
    }
    case 'UpdateSewOrder': {
      const input = (variables.input ?? {}) as SewOrder;
      return { updateSewOrder: updateMockSewOrder(input) } as TData;
    }
    case 'SewOrderStatistic': {
      const input = (variables.input ?? {}) as SewOrderStatisticInput;
      return { sewOrderStatistic: getMockSewOrderStatistic(input) } as TData;
    }
    case 'TailOrder': {
      const id = Number(variables.id);
      const order = getMockTailOrder(id);
      if (!order) throw new Error('尾部单不存在');
      return { tailOrder: order } as TData;
    }
    case 'CreateTailOrder': {
      const input = (variables.input ?? {}) as TailOrder;
      return { createTailOrder: createMockTailOrder(input) } as TData;
    }
    case 'UpdateTailOrder': {
      const input = (variables.input ?? {}) as TailOrder;
      return { updateTailOrder: updateMockTailOrder(input) } as TData;
    }
    case 'TailOrderStatistic': {
      const input = (variables.input ?? {}) as TailOrderStatisticInput;
      return { tailOrderStatistic: getMockTailOrderStatistic(input) } as TData;
    }
    case 'BoxSpecificationsByBrand': {
      const brandId = Number(variables.brandId);
      const includeGeneral =
        variables.includeGeneral === undefined ? true : Boolean(variables.includeGeneral);
      return {
        boxSpecificationsByBrand: getMockBoxSpecificationsByBrand(brandId, includeGeneral),
      } as TData;
    }
    default:
      throw new Error(`[mockCropSewGraphql] Unsupported operation: ${operationName || 'unknown'}`);
  }
}
