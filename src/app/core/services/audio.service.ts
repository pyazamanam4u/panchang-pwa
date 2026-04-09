import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { ErrorHandlerService } from './error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private readonly logger = inject(LoggerService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private readonly isPlaying = signal(false);
  private readonly isPaused = signal(false);
  private readonly isReady = signal(false);
  private readonly stopRequested = signal(false);
  private readonly error = signal<string | null>(null);

  get playing() {
    return this.isPlaying.asReadonly();
  }

  get paused() {
    return this.isPaused.asReadonly();
  }

  get ready() {
    return this.isReady.asReadonly();
  }

  get currentError() {
    return this.error.asReadonly();
  }

  prepareAudio(text: string): void {
    if (!text) {
      const error = this.errorHandler.handleError(new Error('No text available to prepare for audio'));
      this.error.set(error.userFriendlyMessage);
      return;
    }

    if (!this.isSpeechSynthesisSupported()) {
      const error = this.errorHandler.handleError(new Error('Speech synthesis not supported'), { code: 'SPEECH_SYNTHESIS_ERROR' });
      this.error.set(error.userFriendlyMessage);
      return;
    }

    this.logger.debug('Preparing audio for text', { textLength: text.length });
    this.error.set(null);
    this.stopRequested.set(false);
    this.isReady.set(true);
    this.isPlaying.set(false);
    this.isPaused.set(false);
  }

  play(text: string): void {
    if (!text) {
      const error = this.errorHandler.handleError(new Error('No text available to play'));
      this.error.set(error.userFriendlyMessage);
      return;
    }

    if (!this.isSpeechSynthesisSupported()) {
      const error = this.errorHandler.handleError(new Error('Speech synthesis not supported'), { code: 'SPEECH_SYNTHESIS_ERROR' });
      this.error.set(error.userFriendlyMessage);
      return;
    }

    this.logger.info('Starting audio playback');
    this.stopRequested.set(false);

    // If already speaking and paused, resume
    if (speechSynthesis.paused && speechSynthesis.speaking) {
      speechSynthesis.resume();
      this.isPlaying.set(true);
      this.isPaused.set(false);
      return;
    }

    // Cancel any ongoing speech and reset any previous audio run
    speechSynthesis.cancel();
    this.resetState();

    // Process pause markers and create utterances
    this.playWithPauses(text);
  }

  private async playWithPauses(text: string): Promise<void> {
    // First, remove all pause markers from the text and collect pause positions
    const pauseMarkers: Array<{ position: number; duration: number }> = [];
    const pauseRegex = /\[--\s*(pause|short pause)\s*--\]/gi;

    let match;
    let textWithoutMarkers = text;
    let offset = 0;

    // Find all pause markers and their positions
    while ((match = pauseRegex.exec(text)) !== null) {
      const isShortPause = match[1].toLowerCase().includes('short');
      const duration = isShortPause ? 400 : 700; // 400ms for short pause, 700ms for regular pause

      pauseMarkers.push({
        position: match.index - offset,
        duration
      });

      // Remove the marker from the text
      textWithoutMarkers = textWithoutMarkers.replace(match[0], '');
      offset += match[0].length;
    }

    // Split the cleaned text into parts based on pause positions
    const parts: string[] = [];
    let lastPosition = 0;

    for (const marker of pauseMarkers) {
      if (marker.position > lastPosition) {
        parts.push(textWithoutMarkers.substring(lastPosition, marker.position));
      }
      parts.push(`__PAUSE_${marker.duration}__`); // Placeholder for pause
      lastPosition = marker.position;
    }

    // Add remaining text
    if (lastPosition < textWithoutMarkers.length) {
      parts.push(textWithoutMarkers.substring(lastPosition));
    }

    this.isPlaying.set(true);
    this.isPaused.set(false);
    this.error.set(null);

    for (const part of parts) {
      if (this.stopRequested()) {
        this.logger.debug('Audio playback loop cancelled via stop request');
        break;
      }

      // Skip empty parts
      if (!part.trim()) continue;

      // Check if this is a pause placeholder
      if (part.startsWith('__PAUSE_') && part.endsWith('__')) {
        const duration = parseInt(part.replace('__PAUSE_', '').replace('__', ''));
        this.logger.debug(`Pausing for ${duration}ms`);
        await this.delay(duration);
        if (this.stopRequested()) {
          break;
        }
        continue;
      }

      if (this.stopRequested()) {
        break;
      }

      // Create utterance for text part
      const utterance = new SpeechSynthesisUtterance(part.trim());
      utterance.lang = environment.speech.defaultLang;
      utterance.rate = environment.speech.defaultRate;
      utterance.volume = environment.speech.defaultVolume;
      utterance.pitch = environment.speech.defaultPitch;

      // Try to select a calm Sanskrit/Hindi voice
      const selectedVoice = this.selectBestVoice();
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      this.currentUtterance = utterance;

      // Speak the utterance
      speechSynthesis.speak(utterance);

      // Wait for this utterance to complete
      await new Promise<void>((resolve) => {
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve(); // Continue even if there's an error
      });

      if (this.stopRequested()) {
        break;
      }
    }

    // All done or cancelled
    if (this.stopRequested()) {
      this.logger.debug('Audio playback stopped before completion');
    } else {
      this.logger.debug('Audio playback sequence completed');
    }

    this.resetState();
  }

  private selectBestVoice(): SpeechSynthesisVoice | null {
    const voices = speechSynthesis.getVoices();

    // Priority 1: Microsoft Madhuri Online (Natural) - best for Sanskrit/Hindi
    const madhuriVoice = voices.find(voice =>
      voice.name.toLowerCase().includes('madhuri') &&
      voice.name.toLowerCase().includes('online') &&
      voice.name.toLowerCase().includes('natural')
    );
    if (madhuriVoice) {
      this.logger.debug('Selected Madhuri Online Natural voice', { voiceName: madhuriVoice.name });
      return madhuriVoice;
    }

    // Priority 2: Microsoft Kalpana - good female voice for Hindi
    const kalpanaVoice = voices.find(voice =>
      voice.name.toLowerCase().includes('kalpana')
    );
    if (kalpanaVoice) {
      this.logger.debug('Selected Kalpana voice', { voiceName: kalpanaVoice.name });
      return kalpanaVoice;
    }

    // Priority 3: Google Hindi voice
    const googleHindiVoice = voices.find(voice =>
      voice.name.toLowerCase().includes('google') &&
      voice.lang.startsWith('hi')
    );
    if (googleHindiVoice) {
      this.logger.debug('Selected Google Hindi voice', { voiceName: googleHindiVoice.name });
      return googleHindiVoice;
    }

    // Priority 4: Any Microsoft female Hindi voice
    const microsoftFemaleHindi = voices.find(voice =>
      voice.name.toLowerCase().includes('microsoft') &&
      (voice.name.toLowerCase().includes('female') ||
       voice.name.toLowerCase().includes('zira')) &&
      voice.lang.startsWith('hi')
    );
    if (microsoftFemaleHindi) {
      this.logger.debug('Selected Microsoft female Hindi voice', { voiceName: microsoftFemaleHindi.name });
      return microsoftFemaleHindi;
    }

    // Priority 5: Any Hindi voice
    const anyHindiVoice = voices.find(voice =>
      voice.lang.startsWith('hi') || voice.lang.startsWith('en-IN')
    );
    if (anyHindiVoice) {
      this.logger.debug('Selected any Hindi voice', { voiceName: anyHindiVoice.name });
      return anyHindiVoice;
    }

    this.logger.warn('No suitable voice found');
    return null;
  }

  private supportsSSML(): boolean {
    // Check if the browser supports SSML
    // This is a basic check - in practice, you'd need to test with a sample SSML utterance
    return 'speechSynthesis' in window && speechSynthesis.getVoices().length > 0;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  pause(): void {
    if (this.isSpeechSynthesisSupported() && speechSynthesis.speaking && !speechSynthesis.paused) {
      this.logger.debug('Pausing audio playback');
      speechSynthesis.pause();
      this.isPaused.set(true);
      this.isPlaying.set(false);
    }
  }

  resume(): void {
    if (this.isSpeechSynthesisSupported() && speechSynthesis.paused) {
      this.logger.debug('Resuming audio playback');
      speechSynthesis.resume();
      this.isPaused.set(false);
      this.isPlaying.set(true);
    }
  }

  stop(): void {
    if (this.isSpeechSynthesisSupported() && (speechSynthesis.speaking || speechSynthesis.paused)) {
      this.logger.debug('Stopping audio playback');
      this.stopRequested.set(true);
      speechSynthesis.cancel();
      this.resetState();
    }
  }

  private resetState(): void {
    this.isPlaying.set(false);
    this.isPaused.set(false);
    this.currentUtterance = null;
  }

  private isSpeechSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  clearError(): void {
    this.error.set(null);
  }
}