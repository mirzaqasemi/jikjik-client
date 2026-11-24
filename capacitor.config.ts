import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jikjik.app',
  appName: 'JikJik',
  webDir: 'dist',
  android: {
  allowMixedContent: process.env.JIKJIK_LOCAL_HTTP === '1',
  },
};

export default config;
