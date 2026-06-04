import { Injectable } from '@angular/core';
let LazySpeechSDK: any | null = null;

async function loadSpeechSDK(): Promise<any | null> {
  if (LazySpeechSDK) return LazySpeechSDK;
  // Prefer global SDK if already present
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (typeof (window as any).SpeechSDK !== 'undefined') {
    // @ts-ignore
    LazySpeechSDK = (window as any).SpeechSDK;
    return LazySpeechSDK;
  }

  // Otherwise inject the official browser bundle from CDN to avoid bundling node-only modules
  const src = 'https://aka.ms/csspeech/jsbrowserpackageraw';
  return new Promise((resolve) => {
    try {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => {
        // @ts-ignore
        LazySpeechSDK = (window as any).SpeechSDK || null;
        resolve(LazySpeechSDK);
      };
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    } catch {
      resolve(null);
    }
  });
}

import { LanguageService } from './language.service';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VoiceService {

  private key = environment.azureSpeechKey;
  private endpoint = environment.azureSpeechEndpoint;
  private region = 'centralindia';
  private azureEnabled = true;

  private speaking = false;
  private listening = false;

  private synthesizer: any;
  private recognizer: any;

  private speaking$ = new BehaviorSubject<boolean>(false);
  private listening$ = new BehaviorSubject<boolean>(false);

  isSpeaking$ = this.speaking$.asObservable();
  isListening$ = this.listening$.asObservable();

  constructor(private langService: LanguageService) {}

  // =========================
  // SPEAK (INTERRUPTIBLE)
  // =========================
  async speak(text: string, lang?: string): Promise<void> {

    const language = lang || this.langService.getLanguage();

    // Stop any ongoing speech
    this.stopSpeaking();

    this.speaking = true;
    this.speaking$.next(true);

    return new Promise(async (resolve) => {
      try {
        const SpeechSDK = await loadSpeechSDK();
        if (!SpeechSDK) throw new Error('Speech SDK unavailable');

        const config = this.getSpeechConfig(SpeechSDK);
        if (!config) throw new Error('Invalid speech config');

        config.speechSynthesisVoiceName = this.getVoice(language);
        this.synthesizer = new SpeechSDK.SpeechSynthesizer(config);

        this.synthesizer.speakTextAsync(
          text,
          () => {
            this.cleanupSpeak();
            resolve();
          },
          (_err: any) => {
            this.cleanupSpeak();
            // fallback to browser TTS silently
            this.azureEnabled = false;
            this.browserSpeak(text, language).then(resolve).catch(() => resolve());
          }
        );
      } catch {
        this.cleanupSpeak();
        this.azureEnabled = false;
        this.browserSpeak(text, language).then(resolve).catch(() => resolve());
      }
    });
  }

  // =========================
  // SPEAK WITH AUDIO (NO AUTO PLAY)
  // =========================
  async speakWithAudio(text: string): Promise<string> {

    const language = this.langService.getLanguage();

    try {
      const SpeechSDK = await loadSpeechSDK();
      if (!SpeechSDK) return this.browserSpeak(text, language).then(() => '');

      const config = this.getSpeechConfig(SpeechSDK);
      if (!config) return this.browserSpeak(text, language).then(() => '');

      config.speechSynthesisVoiceName = this.getVoice(language);

      // 🔥 DO NOT use speaker output here
      const audioConfig = SpeechSDK.AudioConfig.fromStreamOutput(
        SpeechSDK.AudioOutputStream.createPullStream()
      );

      const synth = new SpeechSDK.SpeechSynthesizer(config, audioConfig);

      return await new Promise<string>((resolve) => {
        synth.speakTextAsync(
          text,
          (result: any) => {
            try { synth.close(); } catch {}

            const audioData = result.audioData;
            const blob = new Blob([audioData], { type: 'audio/wav' });

            const reader = new FileReader();

            reader.onloadend = () => {
              resolve(reader.result as string);
            };

            reader.readAsDataURL(blob);
          },
          (_err: any) => {
            try { synth.close(); } catch {}
            this.azureEnabled = false;
            this.browserSpeak(text, language).then(() => resolve('')).catch(() => resolve(''));
          }
        );
      });
    } catch {
      this.azureEnabled = false;
      return this.browserSpeak(text, language).then(() => '');
    }
  }

  // =========================
  // LISTEN (ONE-SHOT)
  // =========================
  async listen(lang?: string): Promise<string> {

    const language = lang || this.langService.getLanguage();

    if (this.listening) return '';

    this.listening = true;
    this.listening$.next(true);


    // Try to load SDK dynamically; fallback to browser native recognition
    const SpeechSDK = await loadSpeechSDK();
    if (!SpeechSDK) {
      const result = await this.browserListen(language);
      this.cleanupListen();
      return result;
    }

    const config = this.getSpeechConfig(SpeechSDK);
    if (!config) {
      const result = await this.browserListen(language);
      this.cleanupListen();
      return result;
    }

    config.speechRecognitionLanguage = language;

    const audio = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

    this.recognizer = new SpeechSDK.SpeechRecognizer(config, audio);

    return new Promise<string>((resolve, reject) => {

      this.recognizer.recognizeOnceAsync(
        (result: any) => {

          this.cleanupListen();

          const text =
            result.reason === SpeechSDK.ResultReason.RecognizedSpeech
              ? result.text
              : '';

          resolve((text || '').trim());
        },
        (err: any) => {
          this.cleanupListen();
          this.azureEnabled = false;
          this.browserListen(language).then(resolve).catch(() => resolve(''));
        }
      );

    });
  }

  private getSpeechConfig(SpeechSDKParam: any): any | null {
    if (!this.azureEnabled || !SpeechSDKParam) {
      return null;
    }

    const endpointUrl = this.endpoint?.trim();
    if (endpointUrl) {
      const genericRegionHost = /^[a-z0-9-]+\.api\.cognitive\.microsoft\.com$/i;
      try {
        const url = new URL(endpointUrl);
        const host = url.host;
        if (genericRegionHost.test(host)) {
          const region = host.split('.')[0];
          return SpeechSDKParam.SpeechConfig.fromSubscription(this.key, region);
        }
        return SpeechSDKParam.SpeechConfig.fromEndpoint(endpointUrl, this.key);
      } catch {
        return SpeechSDKParam.SpeechConfig.fromSubscription(this.key, this.region);
      }
    }

    return SpeechSDKParam.SpeechConfig.fromSubscription(this.key, this.region);
  }

  private async browserSpeak(text: string, lang: string): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.volume = environment.speech.defaultVolume ?? 1;
      utterance.rate = environment.speech.defaultRate ?? 1;
      utterance.pitch = environment.speech.defaultPitch ?? 1;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  }

  private browserListen(lang: string): Promise<string> {
    const win = window as any;
    const Recognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Recognition) {
      return Promise.resolve('');
    }
    return new Promise((resolve) => {
      const recognizer = new Recognition();
      recognizer.lang = lang;
      recognizer.interimResults = false;
      recognizer.maxAlternatives = 1;
      recognizer.onresult = (event: any) => {
        const result = event.results?.[0]?.[0]?.transcript ?? '';
        resolve(result.trim());
      };
      recognizer.onerror = () => {
        resolve('');
      };
      recognizer.onend = () => {
        resolve('');
      };
      try {
        recognizer.start();
      } catch {
        resolve('');
      }
    });
  }

  // =========================
  // STOP (GLOBAL CONTROL)
  // =========================
  stop(): void {
    this.stopSpeaking();
    this.stopListening();
  }

  private stopSpeaking() {
    if (this.synthesizer) {
      this.synthesizer.close();
      this.synthesizer = null;
    }

    this.speaking = false;
    this.speaking$.next(false);
  }

  private stopListening() {
    if (this.recognizer) {
      this.recognizer.close();
      this.recognizer = null;
    }

    this.listening = false;
    this.listening$.next(false);
  }

  private cleanupSpeak() {
    this.stopSpeaking();
  }

  private cleanupListen() {
    this.stopListening();
  }

  // =========================
  // VOICE MAP
  // =========================
  private getVoice(lang: string): string {

    const map: Record<string, string> = {
      'en-IN': 'en-IN-PrabhatNeural',
      'hi-IN': 'hi-IN-MadhurNeural',
      'te-IN': 'te-IN-MohanNeural'
    };

    return map[lang] || map['en-IN'];
  }
}