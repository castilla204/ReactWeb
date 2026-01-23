import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inspecciono.app',
  appName: 'Inspecciono',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    // En desarrollo, puedes usar localhost
    // url: 'http://localhost:5173',
    // cleartext: true
    // ✅ Habilitar cleartext para desarrollo local
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      backgroundColor: '#ffffff',
      style: 'light',
      overlaysWebView: false,
    },
  },
};

export default config;
