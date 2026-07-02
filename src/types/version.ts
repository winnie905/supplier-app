export interface VersionCheckResponse {
  latestVersion: string;
  minSupportedVersion: string;
  forceUpdate: boolean;
  title?: string;
  message?: string;
  ios?: {
    appStoreId?: string;
    storeUrl?: string;
  };
  android?: {
    updateMode?: 'play-immediate' | 'download-page';
    downloadUrl?: string;
    packageName?: string;
  };
}
