import type { NavigatorScreenParams, ParamListBase } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { PhoneCountryCode } from '@/components/PhoneNumberField';
import type { LoginMode } from '@/sections/auth/login/LoginOtpFormSection';
import type { ProductionOrderTab } from '@/types/apps';

export interface RootStackParamList extends ParamListBase {
  AppTabs: NavigatorScreenParams<AppTabParamList>;
  AuthStack: NavigatorScreenParams<AuthStackParamList>;
}

export interface AuthStackParamList extends ParamListBase {
  Login: undefined;
  PersonalInfoCollectionList: undefined;
  PrivacyPolicy: undefined;
  SdkShareList: undefined;
  UserServiceAgreement: undefined;
}

export interface AppsStackParamList extends ParamListBase {
  AppsHome: undefined;
  /** keyword：搜索框展示；productionOrderCode：选中后按单号拉统计/列表；tab：回填时选中的分类 */
  ProductionOrders:
    | {
        keyword?: string;
        productionOrderCode?: string;
        tab?: ProductionOrderTab;
      }
    | undefined;
  AppsSearch: { initialKeyword?: string } | undefined;
}

export interface ReportsStackParamList extends ParamListBase {
  ReportsHome: undefined;
}

export interface LogisticsStackParamList extends ParamListBase {
  LogisticsHome: undefined;
  QrScan: undefined;
  ReceivingSearch: { initialKeyword?: string } | undefined;
  MaterialConfirmation: { productionColorId: string };
  ExceptionReplyList: { productionColorId: string; module: 'material' | 'cutting' };
  CuttingRecords: { productionColorId: string };
  SewingRecords: { productionColorId: string };
  PackingRecords: { productionColorId: string };
}

export interface MessagesStackParamList extends ParamListBase {
  MessagesHome: undefined;
}

export interface MeStackParamList extends ParamListBase {
  About: undefined;
  MeHome: undefined;
  PersonalInfoCollectionList: undefined;
  PrivacyPolicy: undefined;
  SdkShareList: undefined;
  UserServiceAgreement: undefined;
}

export interface AppTabParamList extends ParamListBase {
  AppsTab: NavigatorScreenParams<AppsStackParamList>;
  ReportsTab: NavigatorScreenParams<ReportsStackParamList>;
  LogisticsTab: NavigatorScreenParams<LogisticsStackParamList>;
  MessagesTab: NavigatorScreenParams<MessagesStackParamList>;
  MeTab: NavigatorScreenParams<MeStackParamList>;
}

export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type AppsScreenProps<T extends keyof AppsStackParamList> = NativeStackScreenProps<
  AppsStackParamList,
  T
>;

export type ReportsScreenProps<T extends keyof ReportsStackParamList> = NativeStackScreenProps<
  ReportsStackParamList,
  T
>;

export type LogisticsScreenProps<T extends keyof LogisticsStackParamList> = NativeStackScreenProps<
  LogisticsStackParamList,
  T
>;

export type MessagesScreenProps<T extends keyof MessagesStackParamList> = NativeStackScreenProps<
  MessagesStackParamList,
  T
>;

export type MeScreenProps<T extends keyof MeStackParamList> = NativeStackScreenProps<
  MeStackParamList,
  T
>;

export type { LoginMode, PhoneCountryCode };
