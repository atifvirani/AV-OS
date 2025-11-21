export interface AppData {
  label: string;
  packageName: string;
  icon: string; // Base64 encoded string
}

export interface InstalledAppsPlugin {
  getApps(): Promise<{ apps: AppData[] }>;
  launchApp(options: { packageName: string }): Promise<void>;
}