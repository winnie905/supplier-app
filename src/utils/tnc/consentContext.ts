import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import type { TncDeviceInfo } from '@/types/tnc';

/** Mock IP；后端就绪后由接口返回或网关注入 */
const MOCK_CLIENT_IP = '203.0.113.42';

export async function collectTncDeviceInfo(): Promise<TncDeviceInfo> {
  const deviceId = await DeviceInfo.getUniqueId().catch(() => undefined);
  const deviceModel = DeviceInfo.getModel();

  return {
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    osVersion: DeviceInfo.getSystemVersion(),
    deviceModel,
    ...(deviceId ? { deviceId } : {}),
  };
}

export function getTncAppVersion(): string {
  return DeviceInfo.getVersion();
}

export function getMockClientIp(): string {
  return MOCK_CLIENT_IP;
}
