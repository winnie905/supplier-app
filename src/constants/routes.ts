export const ROUTES = {
  ROOT: {
    APP_TABS: 'AppTabs',
    AUTH_STACK: 'AuthStack',
  },
  AUTH: {
    LOGIN: 'Login',
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
    SEARCH: 'ReceivingSearch',
    MATERIAL_CONFIRMATION: 'MaterialConfirmation',
    EXCEPTION_REPLY_LIST: 'ExceptionReplyList',
    CUTTING_RECORDS: 'CuttingRecords',
    SEWING_RECORDS: 'SewingRecords',
    PACKING_RECORDS: 'PackingRecords',
  },
  MESSAGES: {
    MESSAGES_HOME: 'MessagesHome',
  },
  ME: {
    ME_HOME: 'MeHome',
    ABOUT: 'About',
    USER_SERVICE_AGREEMENT: 'UserServiceAgreement',
    PRIVACY_POLICY: 'PrivacyPolicy',
    PERSONAL_INFO_COLLECTION_LIST: 'PersonalInfoCollectionList',
    SDK_SHARE_LIST: 'SdkShareList',
  },
} as const;
