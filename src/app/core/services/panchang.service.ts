import { Injectable, inject, signal } from '@angular/core';
import { getDailyPanchang } from 'panchang-ts';
import { PanchangResponse, PanchangWithFormData, FormData, LocationData } from '../types/panchang.types';
import { LoggerService } from './logger.service';
import { ErrorHandlerService } from './error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class PanchangService {
  private readonly logger = inject(LoggerService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly loading = signal(false);
  private readonly error = signal<string | null>(null);

  get isLoading() {
    return this.loading.asReadonly();
  }

  get currentError() {
    return this.error.asReadonly();
  }

  async calculatePanchang(formData: FormData, locationData: LocationData): Promise<PanchangWithFormData> {
    this.loading.set(true);
    this.error.set(null);

    const startTime = performance.now();

    try {
      this.logger.info('Starting panchang calculation', { formData, locationData });

      const panchangDate = new Date(formData.date);
      const location = {
        latitude: locationData.latitude,
        longitude: locationData.longitude
      };
      const options = {
        timezone: 'Asia/Kolkata'
      };

      const panchangResult = getDailyPanchang(panchangDate, location, options) as unknown as PanchangResponse;

      const combinedData: PanchangWithFormData = {
        ...panchangResult,
        userData: formData,
        locationData: locationData
      };

      const endTime = performance.now();
      this.logger.info(`Panchang calculation completed in ${endTime - startTime}ms`, {
        date: combinedData.date,
        location: combinedData.locationData.name
      });

      this.loading.set(false);
      return combinedData;
    } catch (err) {
      const appError = this.errorHandler.handleError(err, { formData, locationData });
      this.error.set(appError.userFriendlyMessage);
      this.loading.set(false);
      throw err;
    }
  }

  getActiveItem<T extends { isActiveAtSunrise?: boolean }>(items?: T[] | null): T | null {
    return items?.find(item => item.isActiveAtSunrise) ?? items?.[0] ?? null;
  }

  clearError(): void {
    this.error.set(null);
  }
}