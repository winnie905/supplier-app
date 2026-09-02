import { env } from '@/config/env';
import { APP_VERSION, HTTP_TIMEOUT_MS } from '@/constants/app';
import type { VersionCheckResponse } from '@/types/version';
import { compareVersion } from '@/utils/app/version';
import { toTrimmedString } from '@/utils/core';

const fallbackVersionPolicy: VersionCheckResponse = {
  latestVersion: '1.0.0',
  version: '1.0.0',
  forceUpdate: false,
  updateContents: [],
};

const normalizeVersionPolicy = (raw: unknown): VersionCheckResponse => {
  const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const version = toTrimmedString(data.version) ?? fallbackVersionPolicy.version;
  const latestVersion = toTrimmedString(data.latestVersion) ?? version;
  const updateContents = Array.isArray(data.updateContents)
    ? data.updateContents.filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0,
      )
    : [];

  const gitHash = toTrimmedString(data.gitHash);
  const buildTime = toTrimmedString(data.buildTime);

  return {
    version,
    latestVersion,
    forceUpdate: data.forceUpdate === true,
    updateContents,
    ...(gitHash ? { gitHash } : {}),
    ...(buildTime ? { buildTime } : {}),
  };
};

export type VersionDecision =
  | {
      type: 'allow';
    }
  | {
      type: 'force_update';
      payload: VersionCheckResponse;
      currentVersion: string;
    };

export async function fetchVersionPolicy(): Promise<VersionCheckResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

  try {
    const response = await fetch(env.BUILD_INFO_URL, { signal: controller.signal });

    if (!response.ok) {
      return fallbackVersionPolicy;
    }

    return normalizeVersionPolicy(await response.json());
  } catch {
    return fallbackVersionPolicy;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkAppVersion(): Promise<VersionDecision> {
  const currentVersion = APP_VERSION;
  const policy = await fetchVersionPolicy();
  const hasNewerVersion = compareVersion(currentVersion, policy.latestVersion) < 0;

  if (policy.forceUpdate && hasNewerVersion) {
    return {
      type: 'force_update',
      payload: policy,
      currentVersion,
    };
  }

  return {
    type: 'allow',
  };
}
