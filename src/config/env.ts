export type AppEnv = 'dev' | 'production' | 'uat';

const DEFAULT_API_BASE_URL = 'https://jsonplaceholder.typicode.com';
const DEFAULT_GRAPHQL_URL = 'https://dev.api.apex-bff.dnjapex.com/graphql';
const DEFAULT_BUILD_INFO_URL =
  'https://apex-erp.s3.cn-northwest-1.amazonaws.com.cn/supplier-app/dev/android/buildInfo.json';

const APP_DOWNLOAD_PATH = 'app-download';

const rawAppEnv = process.env.APP_ENV ?? 'dev';
const rawApiBaseUrl = process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;
const rawGraphqlUrl = process.env.GRAPHQL_URL ?? DEFAULT_GRAPHQL_URL;
const rawBuildInfoUrl = process.env.BUILD_INFO_URL ?? DEFAULT_BUILD_INFO_URL;
const rawViteUserUrl = process.env.VITE_USER_URL;

const isAppEnv = (value: string): value is AppEnv =>
  value === 'dev' || value === 'uat' || value === 'production';

if (!isAppEnv(rawAppEnv)) {
  throw new Error(`Invalid APP_ENV value: ${String(rawAppEnv)}`);
}

if (!rawApiBaseUrl) {
  throw new Error('API_BASE_URL is required');
}

if (!rawBuildInfoUrl) {
  throw new Error('BUILD_INFO_URL is required');
}

if (!rawViteUserUrl) {
  throw new Error(
    'VITE_USER_URL is required. Set it via CI (GitHub vars → VITE_USER_URL) or local .env.local',
  );
}

const joinUrl = (base: string, path: string): string =>
  `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

const rawAppDownloadPageUrl = joinUrl(rawViteUserUrl, APP_DOWNLOAD_PATH);

export const env = {
  API_BASE_URL: rawApiBaseUrl,
  APP_DOWNLOAD_PAGE_URL: rawAppDownloadPageUrl,
  APP_ENV: rawAppEnv,
  BUILD_INFO_URL: rawBuildInfoUrl,
  GRAPHQL_URL: rawGraphqlUrl,
  VITE_USER_URL: rawViteUserUrl,
} as const;
