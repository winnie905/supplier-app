declare namespace NodeJS {
  interface ProcessEnv {
    API_BASE_URL?: string;
    APP_ENV?: 'dev' | 'uat' | 'production';
    APP_VERSION?: string;
    BUILD_INFO_URL?: string;
    GRAPHQL_URL?: string;
    VITE_USER_URL?: string;
  }
}
