import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nyaysetu.app',
  appName: 'NyaySetu',
  webDir: 'public',
  server: {
    url: 'https://nyay-setu-omega.vercel.app',
    cleartext: true,
    allowNavigation: ['*']
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
