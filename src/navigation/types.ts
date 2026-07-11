import type { NavigatorScreenParams, ParamListBase } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { PhoneCountryCode } from '@/components/PhoneNumberField';
import type { LoginMode } from '@/sections/auth/login/LoginOtpFormSection';

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
