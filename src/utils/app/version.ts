/**
 * 存放应用版本与更新策略相关工具：版本号比较、跳转应用商店/下载页、
 * 可选更新偏好持久化、退出应用等。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackHandler, Linking, Platform } from 'react-native';

import type { VersionCheckResponse } from '@/types/version';

const OPTIONAL_UPDATE_DISMISSED_VERSION_KEY = '@app/optional-update-dismissed-version';

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

export function isVersionLowerThan(current: string, minSupported: string): boolean {
  return compareVersion(current, minSupported) < 0;
}
/**
 * Android:
 * - Play 渠道：这里建议接原生 In-App Update（Immediate）
 * - 非 Play 渠道：先走下载页
 *
 * iOS:
 * - 优先打开 storeUrl
 * - 没有时可根据 appStoreId 组装链接
 */
export async function openUpdateTarget(policy: VersionCheckResponse): Promise<void> {
  if (Platform.OS === 'ios') {
    const iosUrl =
      policy.ios?.storeUrl ??
      (policy.ios?.appStoreId
        ? `https://apps.apple.com/app/id${policy.ios.appStoreId}`
        : undefined);

    if (!iosUrl) {
      throw new Error('iOS update url is missing');
    }

    await Linking.openURL(iosUrl);
    return;
  }

  const androidMode = policy.android?.updateMode ?? 'download-page';

  if (androidMode === 'play-immediate') {
    /**
     * TODO:
     * 这里接 Android 原生桥：
     * NativeModules.AppUpdateModule.startImmediateUpdate()
     *
     * 如果你们确认走 Google Play 分发，这一段应该优先用
     * Play In-App Update 的 Immediate flow。
     */
    throw new Error('Android immediate update bridge is not implemented yet');
  }

  const androidUrl = policy.android?.downloadUrl;

  if (!androidUrl) {
    throw new Error('Android download url is missing');
  }

  await Linking.openURL(androidUrl);
}

/**
 * 退出动作：
 * - Android：可以接原生 finishAffinity / moveTaskToBack
 * - iOS：建议不要真正 exit，阻塞在强更页即可
 */
export function exitAppSafely(): void {
  if (Platform.OS === 'android') {
    BackHandler.exitApp();
    return;
  }

  /**
   * iOS 正式版建议不要程序化退出。
   * 直接停留在强更阻塞页即可。
   */
}

export async function getDismissedOptionalUpdateVersion(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(OPTIONAL_UPDATE_DISMISSED_VERSION_KEY);
  } catch {
    return null;
  }
}

export async function setDismissedOptionalUpdateVersion(version: string): Promise<void> {
  try {
    await AsyncStorage.setItem(OPTIONAL_UPDATE_DISMISSED_VERSION_KEY, version);
  } catch {
    // ignore
  }
}
