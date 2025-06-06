import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mtgdeckbuilder.app',
  appName: 'MTG Deck Builder',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
