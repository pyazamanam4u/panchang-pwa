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
  azureSpeechKey: 'CJpvskn0rAn21gYnuOyx7ZD6T6PWc2kPHC1zfTgauF2DYqTcRi2IJQQJ99CFACGhslBXJ3w3AAAYACOG4dW5',
  azureSpeechEndpoint: 'https://centralindia.api.cognitive.microsoft.com/',
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