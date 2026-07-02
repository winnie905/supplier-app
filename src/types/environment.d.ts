declare namespace NodeJS {
  interface ProcessEnv {
    API_BASE_URL?: string;
    APP_ENV?: 'dev' | 'uat' | 'production';
    GRAPHQL_URL?: string;
  }
}
