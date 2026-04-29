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

  private speaking$ = new BehaviorSubject<boolean>(false);
  private listening$ = new BehaviorSubject<boolean>(false);

  isSpeaking$ = this.speaking$.asObservable();
  isListening$ = this.listening$.asObservable();

  constructor(private langService: LanguageService) {}

  private wait(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
  }

  // =========================
  // TEXT TO SPEECH
  // =========================
  async speak(text: string, lang?: string): Promise<void> {

    const language = lang || this.langService.getLanguage();

    // Prevent overlapping speech
    while (this.speaking) {
      await this.wait(50);
    }

    this.speaking = true;
    this.speaking$.next(true);

    console.log('🗣️ TTS:', { text, language });

    return new Promise<void>((resolve, reject) => {

      try {
        const config = SpeechSDK.SpeechConfig.fromSubscription(this.key, this.region);
        config.speechSynthesisVoiceName = this.getVoice(language);

        const synth = new SpeechSDK.SpeechSynthesizer(config);

        synth.speakTextAsync(
          text,
          () => {
            synth.close();
            this.speaking = false;
            this.speaking$.next(false);
            resolve();
          },
          (err: unknown) => {   // ✅ FIXED typing
            console.error('TTS Error:', err);
            synth.close();
            this.speaking = false;
            this.speaking$.next(false);
            reject(err);
          }
        );

      } catch (e: unknown) {
        console.error('TTS Exception:', e);
        this.speaking = false;
        this.speaking$.next(false);
        reject(e);
      }
    });
  }

  // =========================
  // SPEECH TO TEXT
  // =========================
  async listen(lang?: string): Promise<string> {

    const language = lang || this.langService.getLanguage();

    if (this.listening) return '';

    this.listening = true;
    this.listening$.next(true);

    console.log('🎤 STT:', language);

    const config = SpeechSDK.SpeechConfig.fromSubscription(this.key, this.region);
    config.speechRecognitionLanguage = language;

    const audio = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SpeechSDK.SpeechRecognizer(config, audio);

    return new Promise<string>((resolve, reject) => {

      recognizer.recognizeOnceAsync(
        (result: any) => {   // ✅ FIXED typing
          recognizer.close();

          this.listening = false;
          this.listening$.next(false);

          const text =
            result?.reason === SpeechSDK.ResultReason.RecognizedSpeech
              ? result.text
              : '';

          console.log('🎙️ RESULT:', text);

          resolve((text || '').trim());
        },
        (err: unknown) => {   // ✅ FIXED typing
          console.error('STT Error:', err);
          recognizer.close();

          this.listening = false;
          this.listening$.next(false);

          reject(err);
        }
      );
    });
  }

  // =========================
  // STOP (STATE RESET)
  // =========================
  stop(): void {
    this.speaking = false;
    this.listening = false;
    this.speaking$.next(false);
    this.listening$.next(false);
  }

  // =========================
  // VOICE MAPPING
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