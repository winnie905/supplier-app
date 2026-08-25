import { apolloClient } from '@/graphql/client';
import { BOX_SPECIFICATIONS_BY_BRAND } from '@/graphql/operations/boxSpecification/operations';
import type { BoxSpecification, BoxSpecificationByBrandInput } from '@/types/boxSpecification';
import type { BoxSpecificationType } from '@/types/cropOrder';
import type { CartonSpec, CartonSpecType } from '@/types/receiving';

const mapTypeToCarton = (type?: BoxSpecificationType): CartonSpecType =>
  type === 'General' ? 'general' : 'brand';

/** API 箱规 → 收发 UI CartonSpec */
export const mapBoxSpecificationToCartonSpec = (item: BoxSpecification): CartonSpec => ({
  id: item.id,
  name: item.name ?? '',
  length: item.length ?? 0,
  width: item.width ?? 0,
  height: item.height ?? 0,
  unit: item.unit ?? '',
  type: mapTypeToCarton(item.type),
});

/** 箱规服务：直连 apex-bff getBoxSpecifications */
export const boxSpecificationService = {
  async getByBrand(input: BoxSpecificationByBrandInput): Promise<BoxSpecification[]> {
    const { data } = await apolloClient.query<{
      boxSpecificationsByBrand: BoxSpecification[] | null;
    }>({
      query: BOX_SPECIFICATIONS_BY_BRAND,
      variables: {
        brandId: input.brandId,
        // App 侧仍用 includeGeneral；BFF 参数名为 includeGeneric
        includeGeneric: input.includeGeneral ?? true,
      },
      fetchPolicy: 'network-only',
    });

    return data?.boxSpecificationsByBrand ?? [];
  },

  async getCartonSpecsByBrand(input: BoxSpecificationByBrandInput): Promise<CartonSpec[]> {
    const list = await this.getByBrand(input);
    return list.map(mapBoxSpecificationToCartonSpec);
  },
};
