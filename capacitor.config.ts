import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.anvsport.app',
  appName: 'ANV Sport',
  webDir: 'public', // Sử dụng thư mục tạm vì chúng ta load từ URL
  server: {
    url: 'https://anvsport.xyz', // THAY ĐỔI URL NÀY THÀNH LINK THẬT CỦA BẠN
    cleartext: true
  }
};

export default config;
