import { Injectable } from '@angular/core';
declare var SpeechSDK: any;

import { LanguageService } from './language.service';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VoiceService {

  private key = environment.azureSpeechKey;
  private region = 'eastus2';

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

    return new Promise((resolve, reject) => {

      try {

        const config =
          SpeechSDK.SpeechConfig.fromSubscription(this.key, this.region);

        config.speechSynthesisVoiceName = this.getVoice(language);

        this.synthesizer = new SpeechSDK.SpeechSynthesizer(config);

        this.synthesizer.speakTextAsync(
          text,
          () => {
            this.cleanupSpeak();
            resolve();
          },
          (err: any) => {
            this.cleanupSpeak();
            reject(err);
          }
        );

      } catch (e) {
        this.cleanupSpeak();
        reject(e);
      }
    });
  }

  // =========================
  // SPEAK WITH AUDIO (NO AUTO PLAY)
  // =========================
  async speakWithAudio(text: string): Promise<string> {

    const language = this.langService.getLanguage();

    const config =
      SpeechSDK.SpeechConfig.fromSubscription(this.key, this.region);

    config.speechSynthesisVoiceName = this.getVoice(language);

    // 🔥 DO NOT use speaker output here
    const audioConfig = SpeechSDK.AudioConfig.fromStreamOutput(
      SpeechSDK.AudioOutputStream.createPullStream()
    );

    const synth = new SpeechSDK.SpeechSynthesizer(config, audioConfig);

    return new Promise((resolve, reject) => {

      synth.speakTextAsync(
        text,
        (result: any) => {

          synth.close();

          const audioData = result.audioData;
          const blob = new Blob([audioData], { type: 'audio/wav' });

          const reader = new FileReader();

          reader.onloadend = () => {
            resolve(reader.result as string);
          };

          reader.readAsDataURL(blob);
        },
        (err: any) => {
          synth.close();
          reject(err);
        }
      );

    });
  }

  // =========================
  // LISTEN (ONE-SHOT)
  // =========================
  async listen(lang?: string): Promise<string> {

    const language = lang || this.langService.getLanguage();

    if (this.listening) return '';

    this.listening = true;
    this.listening$.next(true);

    const config =
      SpeechSDK.SpeechConfig.fromSubscription(this.key, this.region);

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
          reject(err);
        }
      );

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