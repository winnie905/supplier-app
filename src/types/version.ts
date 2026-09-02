export interface VersionCheckResponse {
  version: string;
  latestVersion: string;
  forceUpdate: boolean;
  updateContents: string[];
  gitHash?: string;
  buildTime?: string;
}
