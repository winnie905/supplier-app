export type AppEnv = 'dev' | 'production' | 'uat';

const DEFAULT_API_BASE_URL = 'https://jsonplaceholder.typicode.com';
const DEFAULT_GRAPHQL_URL = 'https://dev.api.apex-bff.dnjapex.com/graphql';
const rawAppEnv = process.env.APP_ENV ?? 'dev';
const rawApiBaseUrl = process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;
const rawGraphqlUrl = process.env.GRAPHQL_URL ?? DEFAULT_GRAPHQL_URL;

const isAppEnv = (value: string): value is AppEnv =>
  value === 'dev' || value === 'uat' || value === 'production';

if (!isAppEnv(rawAppEnv)) {
  throw new Error(`Invalid APP_ENV value: ${String(rawAppEnv)}`);
}

if (!rawApiBaseUrl) {
  throw new Error('API_BASE_URL is required');
}

export const env = {
  API_BASE_URL: rawApiBaseUrl,
  APP_ENV: rawAppEnv,
  GRAPHQL_URL: rawGraphqlUrl,
} as const;
