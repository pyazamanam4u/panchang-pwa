export const environment = {
  production: true,
  appName: 'Sankalpam',
  appDescription: 'Premium Hindu Sankalpam PWA for sacred intentions, audio prayers, and cosmic alignment.',
  themeColor: '#FF9933',
  backgroundColor: '#FFFDF7',
  version: '1.0.0',
  api: {
    timeout: 30000,
    retries: 3,
    panchangBaseUrl: '/api/panchang',
    sankalpamBaseUrl: 'https://mydemowebapi-avbdfuh0b5b4hjcp.centralindia-01.azurewebsites.net/'
  },
  azureSpeechKey: '',
  azureSpeechEndpoint: '',
  azureTtsEndpoint: '',
  azureSttEndpoint: '',
  openaiBaseUrl: '',
  openaiApiKey: '',
  cache: {
    audioCacheDuration: 10 * 60 * 1000, // 10 minutes
    panchangCacheDuration: 24 * 60 * 60 * 1000, // 24 hours
    sankalpaTextCacheDuration: 30 * 60 * 1000, // 30 minutes - cache refined text
    sankalpaAudioCacheDuration: 60 * 60 * 1000 // 60 minutes - cache generated audio
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