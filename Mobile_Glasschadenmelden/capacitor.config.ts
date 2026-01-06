import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.glasschadenmelden.mobile',
  appName: 'Glasschaden Melden',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3B82F6',
      showSpinner: false
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#3B82F6'
    },
    Keyboard: {
      resize: 'native',
      style: 'dark'
    }
  }
};

export default config;
