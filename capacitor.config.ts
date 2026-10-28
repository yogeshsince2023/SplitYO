import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.splitmate.app',
  appName: 'SplitMate',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
