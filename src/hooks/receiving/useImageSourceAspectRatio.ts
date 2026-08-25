import { useEffect, useState } from 'react';
import { Image, type ImageSourcePropType } from 'react-native';

import { REMOTE_RECEIVING_IMAGE_ASPECT } from '@/utils/receiving/images';

const getSourceUri = (source: ImageSourcePropType): string | null => {
  if (typeof source === 'number') return null;
  if (Array.isArray(source)) {
    const first = source[0];
    return first && typeof first === 'object' && 'uri' in first && typeof first.uri === 'string'
      ? first.uri
      : null;
  }
  if (
    typeof source === 'object' &&
    source !== null &&
    'uri' in source &&
    typeof source.uri === 'string'
  ) {
    return source.uri;
  }
  return null;
};

const aspectCache = new Map<string, number>();

const cacheKeyForSource = (source: ImageSourcePropType): string | null => {
  if (typeof source === 'number') return `asset:${source}`;
  return getSourceUri(source);
};

/** 解析本地/远程图片宽高比（宽/高），远程图通过 Image.getSize 异步获取 */
export const useImageSourceAspectRatio = (
  source: ImageSourcePropType | undefined,
  fallback = REMOTE_RECEIVING_IMAGE_ASPECT,
) => {
  const cacheKey = source ? cacheKeyForSource(source) : null;
  const [aspectRatio, setAspectRatio] = useState(
    () => (cacheKey ? aspectCache.get(cacheKey) : undefined) ?? fallback,
  );

  useEffect(() => {
    if (!source) {
      setAspectRatio(fallback);
      return;
    }

    const key = cacheKeyForSource(source);
    const cached = key ? aspectCache.get(key) : undefined;
    if (cached != null) {
      setAspectRatio(cached);
      return;
    }

    let cancelled = false;
    setAspectRatio(fallback);

    const commit = (next: number) => {
      if (key) aspectCache.set(key, next);
      if (!cancelled) setAspectRatio(next);
    };

    if (typeof source === 'number') {
      const resolved = Image.resolveAssetSource(source);
      if (resolved?.width && resolved?.height) {
        commit(resolved.width / resolved.height);
      } else {
        commit(fallback);
      }
      return;
    }

    const uri = getSourceUri(source);
    if (!uri) {
      commit(fallback);
      return;
    }

    Image.getSize(
      uri,
      (width, height) => {
        if (width > 0 && height > 0) {
          commit(width / height);
        }
      },
      () => {
        commit(fallback);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [fallback, source]);

  return aspectRatio;
};
