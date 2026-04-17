export const environment = {
  production: false,
  appName: 'Panchang PWA',
  version: '1.0.0',
  api: {
    timeout: 30000,
    retries: 3
  },
    azureSpeechKey: 'Ah9bBtBjOC4qe0pFur23ry8vk5cFnq89lTY34mdEhKp3asLh2NVJJQQJ99CDACGhslBXJ3w3AAAYACOG6RLI',
  cache: {
    audioCacheDuration: 10 * 60 * 1000, // 10 minutes
    panchangCacheDuration: 24 * 60 * 60 * 1000 // 24 hours
  },
  speech: {
    defaultLang: 'hi-IN',
    defaultRate: 1.0, // Clear, natural speed for better comprehension
    defaultVolume: 0.9, // Good volume for clarity
    defaultPitch: 0.9, // Natural pitch for clear pronunciation
    preferredVoices: [
      'Microsoft Madhuri Online (Natural) - Hindi (India)', // Primary female voice
      'Google हिन्दी', // Alternative female voice
      'Microsoft Kalpana - Hindi (India)', // Female voice
      'Microsoft Hemant - Hindi (India)', // Male fallback
      'Microsoft Zira - English (United States)', // Female fallback
      'Microsoft David - English (United States)' // Male fallback
    ],
    useSSML: false // Using manual pauses for better control
  },
  features: {
    enableAudioCache: true,
    enableOfflineSupport: true,
    enableAnalytics: false
  }
};
