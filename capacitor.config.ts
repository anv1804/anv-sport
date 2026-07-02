import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.anvsport.app',
  appName: 'ANV Sport',
  webDir: 'public',
  server: {
    url: 'https://anvsport.xyz',
    cleartext: false,
    androidScheme: 'https',
    // Giữ tất cả navigation trong WebView, không mở Chrome
    allowNavigation: ['anvsport.xyz', '*.anvsport.xyz', '*']
  },
  android: {
    allowMixedContent: false,
  }
};

export default config;
