export const ROUTES = {
  ROOT: {
    APP_TABS: 'AppTabs',
    AUTH_STACK: 'AuthStack',
  },
  AUTH: {
    LOGIN: 'Login',
    COUNTRY_REGION_SELECT: 'CountryRegionSelect',
    PERSONAL_INFO_COLLECTION_LIST: 'PersonalInfoCollectionList',
    PRIVACY_POLICY: 'PrivacyPolicy',
    SDK_SHARE_LIST: 'SdkShareList',
    USER_SERVICE_AGREEMENT: 'UserServiceAgreement',
  },
  TABS: {
    APPS_TAB: 'AppsTab',
    REPORTS_TAB: 'ReportsTab',
    LOGISTICS_TAB: 'LogisticsTab',
    MESSAGES_TAB: 'MessagesTab',
    ME_TAB: 'MeTab',
  },
  APPS: {
    APPS_HOME: 'AppsHome',
  },
  REPORTS: {
    REPORTS_HOME: 'ReportsHome',
  },
  LOGISTICS: {
    LOGISTICS_HOME: 'LogisticsHome',
    QR_SCAN: 'QrScan',
  },
  MESSAGES: {
    MESSAGES_HOME: 'MessagesHome',
  },
  ME: {
    ME_HOME: 'MeHome',
    ABOUT: 'About',
  },
} as const;
