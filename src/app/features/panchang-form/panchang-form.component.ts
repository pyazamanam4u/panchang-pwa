import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { App } from '../../app';
import { PanchangService } from '../../core/services/panchang.service';
import { SamkalpaService } from '../../core/services/samkalpa.service';
import { AudioService } from '../../core/services/audio.service';
import { AudioCacheService } from '../../core/services/audio-cache.service';
import { LocationService } from '../../core/services/location.service';
import { LoggerService } from '../../core/services/logger.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { AccessibilityService } from '../../core/services/accessibility.service';
import { PerformanceService } from '../../core/services/performance.service';
import {
  FormData,
  LocationData,
  PanchangWithFormData,
  PanchangTithi,
  PanchangNakshatra,
  PanchangIndexItem,
  PanchangKarana,
  AudioCacheKey
} from '../../core/types/panchang.types';

@Component({
  standalone: true,
  selector: 'app-panchang-form',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './panchang-form.component.html',
  styleUrls: ['./panchang-form.component.scss'],
})
export class PanchangFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly app = inject(App);
  private readonly panchangService = inject(PanchangService);
  private readonly samkalpaService = inject(SamkalpaService);
  private readonly audioService = inject(AudioService);
  private readonly audioCacheService = inject(AudioCacheService);
  private readonly locationService = inject(LocationService);
  private readonly logger = inject(LoggerService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly accessibilityService = inject(AccessibilityService);
  private readonly performanceService = inject(PerformanceService);

  readonly today = new Date().toISOString().slice(0, 10);
  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly error = signal<string | null>(null);
  readonly panchangData = signal<PanchangWithFormData | null>(null);
  readonly generatedSamkalpa = signal<string | null>(null);
  readonly audioCacheUsed = signal(false);
  readonly samkalpaTemplate = this.samkalpaService.getSamkalpaTemplate();

  readonly locations = this.locationService.getLocations();

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    gotra: ['', [Validators.required, Validators.minLength(2)]],
    deity: ['Vishnu', [Validators.required, Validators.minLength(2)]],
    goal: ['', [Validators.required, Validators.minLength(5)]],
    date: [this.today, [Validators.required]],
    location: ['Delhi', [Validators.required]]
  });

  ngOnInit(): void {
    this.logger.info('PanchangFormComponent initialized');
    this.accessibilityService.addSkipLink('main-content', 'Skip to main content');

    // Announce page load for screen readers
    this.accessibilityService.announce('Panchang form loaded. Use Tab to navigate through form fields.');
  }

  get nameControl() {
    return this.form.controls.name;
  }

  get gotraControl() {
    return this.form.controls.gotra;
  }

  get dateControl() {
    return this.form.controls.date;
  }

  get locationControl() {
    return this.form.controls.location;
  }

  get deityControl() {
    return this.form.controls.deity;
  }

  get goalControl() {
    return this.form.controls.goal;
  }

  get activeTithi(): PanchangTithi | null {
    const data = this.panchangData();
    return data ? this.panchangService.getActiveItem(data.tithis) : null;
  }

  get activeNakshatra(): PanchangNakshatra | null {
    const data = this.panchangData();
    return data ? this.panchangService.getActiveItem(data.nakshatras) : null;
  }

  get activeYoga(): PanchangIndexItem | null {
    const data = this.panchangData();
    return data ? this.panchangService.getActiveItem(data.yogas) : null;
  }

  get activeKarana(): PanchangKarana | null {
    const data = this.panchangData();
    return data ? this.panchangService.getActiveItem(data.karanas) : null;
  }

  get audioPlaying() {
    return this.audioService.playing;
  }

  get audioPaused() {
    return this.audioService.paused;
  }

  get speechReady() {
    return this.audioService.ready;
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set(null);
    this.audioService.stop();
    this.loading.set(true);
    this.submitted.set(true);
    this.dateControl.disable({ emitEvent: false });
    this.panchangData.set(null);
    this.generatedSamkalpa.set(null);
    this.audioCacheUsed.set(false);

    // Set global loading state
    this.app.setGlobalLoading(true);

    const request = this.form.getRawValue() as FormData;

    try {
      this.logger.logUserAction('panchang_calculation_started', { name: request.name, location: request.location });

      // Get selected location
      const selectedLocation = this.locationService.getLocationByName(request.location);
      if (!selectedLocation) {
        throw new Error('Invalid location selected');
      }

      // Calculate panchang data with performance monitoring
      const combinedData = await this.performanceService.measureAsyncFunction(
        'panchang_calculation',
        () => this.panchangService.calculatePanchang(request, selectedLocation)
      );

      // Log full response to console for debugging
      console.log('╔═══════════════════════════════════════════════════════════════╗');
      console.log('║              FULL PANCHANG RESPONSE                            ║');
      console.log('╚═══════════════════════════════════════════════════════════════╝');
      console.log('📍 LOCATION INFO:');
      console.log({
        name: selectedLocation.name,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude
      });
      console.log('\n👤 USER INFO:');
      console.log({
        name: request.name,
        gotra: request.gotra,
        date: request.date
      });
      console.log('\n📅 PANCHANG DATA:');
      console.log({
        date: combinedData.date,
        vara: combinedData.vara,
        tithis: combinedData.tithis,
        nakshatras: combinedData.nakshatras,
        yogas: combinedData.yogas,
        karanas: combinedData.karanas,
        moonrise: combinedData.moonrise,
        moonset: combinedData.moonset,
        sunrise: combinedData.sunrise,
        sunset: combinedData.sunset,
        rahuKalam: combinedData.rahuKalam,
        gulikaKalam: combinedData.gulikaKalam,
        yamaganda: combinedData.yamaganda,
        abhijitMuhurta: combinedData.abhijitMuhurta
      });
      console.log('\n🔗 COMPLETE RESPONSE OBJECT:');
      console.log(combinedData);
      console.log('═══════════════════════════════════════════════════════════════');

      this.panchangData.set(combinedData);
      const samkalpaText = this.samkalpaService.generateSamkalpaText(combinedData);
      this.generatedSamkalpa.set(samkalpaText);

      // Handle audio caching and preparation
      this.prepareAudioForSamkalpa(combinedData, samkalpaText);

      this.logger.logUserAction('panchang_calculation_completed', {
        name: request.name,
        location: request.location,
        hasSamkalpa: !!samkalpaText
      });

      this.accessibilityService.announce('Panchang calculation completed successfully. Samkalpa is ready for playback.');

    } catch (err) {
      this.logger.error('Panchang calculation failed', err);
      const appError = this.errorHandler.handleError(err, { formData: request });
      this.error.set(appError.userFriendlyMessage);
      this.accessibilityService.announce(`Error: ${appError.userFriendlyMessage}`, 'assertive');
      this.loading.set(false);
      this.app.setGlobalLoading(false);
    }
  }

  private prepareAudioForSamkalpa(panchangData: PanchangWithFormData, samkalpaText: string): void {
    const cacheKey = this.createAudioCacheKey(panchangData);
    const cachedText = this.audioCacheService.getCachedText(cacheKey);

    if (cachedText) {
      this.generatedSamkalpa.set(cachedText);
      this.audioCacheUsed.set(true);
      this.logger.info('Audio cache hit', { cacheKey });
    } else {
      this.audioCacheService.setCachedText(cacheKey, samkalpaText);
      this.audioCacheUsed.set(false);
      this.logger.info('Audio cache miss, stored new text', { cacheKey });
    }

    this.audioService.prepareAudio(samkalpaText);
    this.loading.set(false);
    this.app.setGlobalLoading(false);
    // Keep form visible - don't hide it automatically
    this.logger.logUserAction('audio_prepared', { cacheUsed: this.audioCacheUsed() });
  }

  private createAudioCacheKey(panchangData: PanchangWithFormData): AudioCacheKey {
    const activeTithiName = this.activeTithi?.name ?? '';
    const activeNakshatraName = this.activeNakshatra?.name ?? '';
    const activeYogaName = this.activeYoga?.name ?? '';
    const activeKaranaName = this.activeKarana?.name ?? '';

    return {
      name: panchangData.userData.name,
      gotra: panchangData.userData.gotra,
      deity: panchangData.userData.deity,
      goal: panchangData.userData.goal,
      date: panchangData.userData.date,
      location: panchangData.locationData.name,
      tithi: activeTithiName,
      nakshatra: activeNakshatraName,
      yoga: activeYogaName,
      karana: activeKaranaName,
    };
  }



  playSamkalpa(): void {
    const text = this.generatedSamkalpa();
    if (text) {
      this.audioService.play(text);
      this.logger.logUserAction('audio_playback_started');
      this.accessibilityService.announce('Samkalpa playback started');
    }
  }

  pauseSamkalpa(): void {
    this.audioService.pause();
    this.logger.logUserAction('audio_playback_paused');
    this.accessibilityService.announce('Samkalpa playback paused');
  }

  resumeSamkalpa(): void {
    this.audioService.resume();
    this.logger.logUserAction('audio_playback_resumed');
    this.accessibilityService.announce('Samkalpa playback resumed');
  }

  stopSamkalpa(): void {
    this.audioService.stop();
    this.logger.logUserAction('audio_playback_stopped');
    this.accessibilityService.announce('Samkalpa playback stopped');
  }

  // Modern UI methods
  togglePlayback(): void {
    if (this.audioPlaying()) {
      this.pauseSamkalpa();
    } else if (this.audioPaused()) {
      this.resumeSamkalpa();
    } else {
      this.playSamkalpa();
    }
  }

  getPlaybackButtonLabel(): string {
    if (this.audioPlaying()) {
      return 'Pause samkalpa audio';
    } else if (this.audioPaused()) {
      return 'Resume samkalpa audio';
    } else {
      return 'Play samkalpa audio';
    }
  }

  getPlaybackButtonText(): string {
    if (this.audioPlaying()) {
      return 'Pause';
    } else if (this.audioPaused()) {
      return 'Resume';
    } else {
      return 'Play';
    }
  }

  getProgressPercentage(): number {
    // Since we don't have actual progress tracking, return a simple indicator
    if (this.audioPlaying()) {
      return 50; // Show some progress when playing
    } else if (this.audioPaused()) {
      return 25; // Show less progress when paused
    }
    return 0;
  }

  returnToForm(): void {
    // Stop any playing audio
    this.audioService.stop();
    // Reset form state to allow new generation
    this.generatedSamkalpa.set(null);
    this.audioCacheUsed.set(false);
    this.submitted.set(false);
    this.error.set(null);
    this.logger.logUserAction('returned_to_form');
    this.accessibilityService.announce('Returned to form. You can generate a new samkalpa.');
  }
}
