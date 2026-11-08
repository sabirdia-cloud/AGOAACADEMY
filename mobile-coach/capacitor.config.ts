import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.agoa.coach',
  appName: 'أكاديمية أجيال وادي العثمانية',
  webDir: '../dist-coaches-mobile',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: "#09090b",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#09090b',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
    },
  }
};

export default config;
