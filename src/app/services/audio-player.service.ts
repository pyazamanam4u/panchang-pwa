import { Injectable, signal } from '@angular/core';
import { LoggerService } from '../core/services/logger.service';
import { ErrorHandlerService } from '../core/services/error-handler.service';

@Injectable({ providedIn: 'root' })
export class AudioPlayerService {
  private readonly audio = new Audio();
  private readonly isPlaying = signal(false);
  private readonly isPaused = signal(false);
  private readonly progress = signal(0);
  private readonly duration = signal(0);
  private readonly playbackRate = signal(1);
  private readonly error = signal<string | null>(null);

  get playing() {
    return this.isPlaying.asReadonly();
  }

  get paused() {
    return this.isPaused.asReadonly();
  }

  get currentTime() {
    return this.progress.asReadonly();
  }

  get totalDuration() {
    return this.duration.asReadonly();
  }

  get rate() {
    return this.playbackRate.asReadonly();
  }

  get currentError() {
    return this.error.asReadonly();
  }

  constructor(
    private logger: LoggerService,
    private errorHandler: ErrorHandlerService
  ) {
    this.audio.addEventListener('timeupdate', () => this.progress.set(this.audio.currentTime));
    this.audio.addEventListener('durationchange', () => this.duration.set(this.audio.duration));
    this.audio.addEventListener('play', () => {
      this.isPlaying.set(true);
      this.isPaused.set(false);
    });
    this.audio.addEventListener('pause', () => {
      this.isPlaying.set(false);
      this.isPaused.set(true);
    });
    this.audio.addEventListener('ended', () => {
      this.isPlaying.set(false);
      this.isPaused.set(false);
    });
    this.audio.addEventListener('error', (event) => {
      const error = this.errorHandler.handleError(new Error('Audio playback failed'), { event });
      this.error.set(error.userFriendlyMessage);
      this.logger.warn('Audio playback error', event);
    });
  }

  load(audioUrl: string): void {
    this.resetError();
    this.audio.src = audioUrl;
    this.audio.load();
  }

  play(): void {
    this.resetError();
    this.audio.play().catch((error) => {
      const appError = this.errorHandler.handleError(error, { source: 'AudioPlayerService.play' });
      this.error.set(appError.userFriendlyMessage);
    });
  }

  pause(): void {
    if (!this.audio.paused) {
      this.audio.pause();
    }
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying.set(false);
    this.isPaused.set(false);
  }

  seek(position: number): void {
    if (!isNaN(position) && this.duration() > 0) {
      this.audio.currentTime = Math.min(Math.max(position, 0), this.audio.duration);
    }
  }

  setPlaybackRate(rate: number): void {
    this.audio.playbackRate = rate;
    this.playbackRate.set(rate);
  }

  download(filename = 'sankalpam-audio.mp3'): void {
    if (!this.audio.src) {
      return;
    }

    const anchor = document.createElement('a');
    anchor.href = this.audio.src;
    anchor.download = filename;
    anchor.click();
  }

  private resetError(): void {
    this.error.set(null);
  }
}
