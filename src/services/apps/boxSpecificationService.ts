import { BOX_SPECIFICATIONS_BY_BRAND } from '@/graphql/operations/boxSpecification/operations';
import { executeMockCropSewOrderGraphql } from '@/services/apps/mockCropSewOrderGraphql';
import type { BoxSpecification, BoxSpecificationByBrandInput } from '@/types/boxSpecification';
import type { CartonSpec, CartonSpecType } from '@/types/receiving';

const mapTypeToCarton = (type?: string): CartonSpecType =>
  type === 'GENERAL' ? 'general' : 'brand';

/** API 箱规 → 收发 UI CartonSpec */
export const mapBoxSpecificationToCartonSpec = (item: BoxSpecification): CartonSpec => ({
  id: item.id,
  name: item.name ?? '',
  length: item.length ?? 0,
  width: item.width ?? 0,
  height: item.height ?? 0,
  type: mapTypeToCarton(item.type),
});

/**
 * 箱规服务：当前走本地 mock GraphQL，BFF 就绪后替换为 apolloClient。
 * 对齐 GET /api/box_specification/brand
 */
export const boxSpecificationService = {
  async getByBrand(input: BoxSpecificationByBrandInput): Promise<BoxSpecification[]> {
    const data = await executeMockCropSewOrderGraphql<{
      boxSpecificationsByBrand: BoxSpecification[];
    }>(BOX_SPECIFICATIONS_BY_BRAND, {
      brandId: input.brandId,
      includeGeneral: input.includeGeneral ?? true,
    });
    return data.boxSpecificationsByBrand;
  },

  async getCartonSpecsByBrand(input: BoxSpecificationByBrandInput): Promise<CartonSpec[]> {
    const list = await this.getByBrand(input);
    return list.map(mapBoxSpecificationToCartonSpec);
  },
};
