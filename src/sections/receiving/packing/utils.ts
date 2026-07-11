import type { CartonSpec, PackingBoxRecord } from '@/types/receiving';

export const sortBoxesNewestFirst = (boxes: PackingBoxRecord[]) =>
  [...boxes].sort((a, b) => b.boxNo - a.boxNo);

export const formatCartonDim = (spec: CartonSpec) =>
  `${spec.length}*${spec.width}*${spec.height}cm`;
