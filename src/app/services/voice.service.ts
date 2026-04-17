import { Injectable } from '@angular/core';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { LanguageService } from './language.service';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VoiceService {

  private key =  environment.azureSpeechKey;
  private region = 'centralindia';

  private speaking = false;
  private listening = false;
private speaking$ = new BehaviorSubject<boolean>(false);
private listening$ = new BehaviorSubject<boolean>(false);

isSpeaking$ = this.speaking$.asObservable();
isListening$ = this.listening$.asObservable();
  constructor(private langService: LanguageService) {}

  private wait(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }

  // =========================
  // SPEAK (AUTO LANGUAGE)
  // =========================
  async speak(text: string, lang?: string): Promise<void> {

    const language = lang || this.langService.getLanguage();

    while (this.speaking) {
      await this.wait(100);
    }

this.speaking$.next(true);
    console.log('🗣️ TTS:', { text, language });

    return new Promise(resolve => {

      const config =
        SpeechSDK.SpeechConfig.fromSubscription(this.key, this.region);

      config.speechSynthesisVoiceName = this.getVoice(language);

      const synth = new SpeechSDK.SpeechSynthesizer(config);

     synth.speakTextAsync(
      text,
      (result) => {
        synth.close();
      this.speaking$.next(false); // this.isSpeaking = false;
        resolve();
      },
      (err) => {
        synth.close();
      this.speaking$.next(false);  //this.isSpeaking = false;
        reject(err);
      }
    );
    });
  }
  // =========================
  // LISTEN (AUTO LANGUAGE)
  // =========================
  async listen(lang?: string): Promise<string> {

    const language = lang || this.langService.getLanguage();

    if (this.listening) return '';

this.listening$.next(true);
    console.log('🎤 STT:', language);

    const config =
      SpeechSDK.SpeechConfig.fromSubscription(this.key, this.region);

    config.speechRecognitionLanguage = language;

    const audio =
      SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

    const recognizer =
      new SpeechSDK.SpeechRecognizer(config, audio);

    return new Promise(resolve => {

      recognizer.recognizeOnceAsync(async result => {

        recognizer.close();

        this.listening = false;
        this.listening$.next(false);
        const text =
          result.reason === SpeechSDK.ResultReason.RecognizedSpeech
            ? result.text
            : '';

        console.log('🎙️ RESULT:', text);

        await this.wait(400);

        resolve((text || '').trim());
      });
    });
  }

  stop() {
    this.speaking = false;
    this.listening = false;
  }

  private getVoice(lang: string) {

    const map: any = {
      'en-IN': 'en-IN-PrabhatNeural',
      'hi-IN': 'hi-IN-MadhurNeural',
      'te-IN': 'te-IN-MohanNeural'
    };

    return map[lang] || map['en-IN'];
  }
}

function reject(err: string) {
  throw new Error('Function not implemented.');
}
