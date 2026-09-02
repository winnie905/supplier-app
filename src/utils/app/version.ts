/**
 * 存放应用版本与更新策略相关工具：版本号比较、跳转下载页等。
 */
import { Linking } from 'react-native';

import { APP_DOWNLOAD_PAGE_URL } from '@/constants/app';

function normalizeVersion(version: string): number[] {
  return version
    .split('.')
    .map((part) => Number(part.trim()))
    .map((num) => (Number.isNaN(num) ? 0 : num));
}

export function compareVersion(a: string, b: string): number {
  const av = normalizeVersion(a);
  const bv = normalizeVersion(b);
  const len = Math.max(av.length, bv.length);

  for (let i = 0; i < len; i += 1) {
    const ai = av[i] ?? 0;
    const bi = bv[i] ?? 0;

    if (ai > bi) {
      return 1;
    }

    if (ai < bi) {
      return -1;
    }
  }

  return 0;
}

/** Opens the app download page in the device's default browser. */
export async function openUpdateTarget(): Promise<void> {
  await Linking.openURL(APP_DOWNLOAD_PAGE_URL);
}
