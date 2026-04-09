export const environment = {
  production: true,
  appName: 'Panchang PWA',
  version: '1.0.0',
  api: {
    timeout: 30000,
    retries: 3
  },
  cache: {
    audioCacheDuration: 10 * 60 * 1000, // 10 minutes
    panchangCacheDuration: 24 * 60 * 60 * 1000 // 24 hours
  },
  speech: {
    defaultLang: 'hi-IN',
    defaultRate: 1.1,
    defaultVolume: 1,
    defaultPitch: 1
  },
  features: {
    enableAudioCache: true,
    enableOfflineSupport: true,
    enableAnalytics: false
  }
};