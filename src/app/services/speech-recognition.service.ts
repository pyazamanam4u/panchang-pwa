import { Injectable, signal } from '@angular/core';
import { LoggerService } from '../core/services/logger.service';
import { ErrorHandlerService } from '../core/services/error-handler.service';
import { SankalpamLanguage } from '../core/types/api.models';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

@Injectable({ providedIn: 'root' })
export class SpeechRecognitionService {
  private readonly isListening = signal(false);
  private readonly lastError = signal<string | null>(null);

  get listening() {
    return this.isListening.asReadonly();
  }

  get errorMessage() {
    return this.lastError.asReadonly();
  }

  constructor(
    private logger: LoggerService,
    private errorHandler: ErrorHandlerService
  ) {}

  isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  async listen(language: SankalpamLanguage = 'en-IN'): Promise<string> {
    if (!this.isSupported()) {
      const error = this.errorHandler.handleError({ message: 'Speech recognition is not supported by this browser.', code: 'SPEECH_RECOGNITION_UNSUPPORTED' });
      this.lastError.set(error.userFriendlyMessage);
      return '';
    }

    this.lastError.set(null);
    this.isListening.set(true);

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    return new Promise((resolve) => {
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim() || '';
        this.logger.info('Speech recognition result', { transcript });
        this.isListening.set(false);
        resolve(transcript);
      };

      recognition.onerror = (event: any) => {
        const error = this.errorHandler.handleError(event.error || new Error('Voice input failed'), { source: 'SpeechRecognitionService' });
        this.lastError.set(error.userFriendlyMessage);
        this.logger.warn('Speech recognition error', event);
        this.isListening.set(false);
        resolve('');
      };

      recognition.onend = () => {
        this.isListening.set(false);
      };

      try {
        recognition.start();
      } catch (err) {
        const error = this.errorHandler.handleError(err, { source: 'SpeechRecognitionService' });
        this.lastError.set(error.userFriendlyMessage);
        this.isListening.set(false);
        resolve('');
      }
    });
  }
}
