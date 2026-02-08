import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.finemax.valueon',
  appName: 'ValueOn',
  webDir: 'out',
  // 실시간 개발을 위한 Live Reload 설정 (필요시 주석 해제)

  server: {
    url: 'http://192.168.219.106:3000', // 본인의 컴퓨터 IP 주소
    cleartext: true
  }

};

export default config;
