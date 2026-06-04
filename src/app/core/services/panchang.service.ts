import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { getDailyPanchang } from 'panchang-ts';
import { environment } from '../../../environments/environment';
import { PanchangResponse, PanchangWithFormData, FormData, LocationData } from '../types/panchang.types';
import { LoggerService } from './logger.service';
import { ErrorHandlerService } from './error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class PanchangService {
  private readonly http = inject(HttpClient);
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

    try {
      this.logger.info('Starting panchang calculation', { formData, locationData });

      const requestPayload = {
        date: formData.date,
        latitude: locationData.latitude,
        longitude: locationData.longitude
      };

      let panchangResult: PanchangResponse;
      const endpoint = environment.api.panchangBaseUrl;

      if (endpoint) {
        try {
          panchangResult = await firstValueFrom(
            this.http.post<PanchangResponse>(endpoint, requestPayload).pipe(
              timeout(environment.api.timeout),
              retry(2),
              catchError((error) => {
                this.logger.warn('External Panchang API failed, using local engine', error);
                throw error;
              })
            )
          );
        } catch {
          panchangResult = this.calculateLocally(requestPayload);
        }
      } else {
        panchangResult = this.calculateLocally(requestPayload);
      }

      const combinedData: PanchangWithFormData = {
        ...panchangResult,
        userData: formData,
        locationData
      };

      this.loading.set(false);
      return combinedData;
    } catch (err) {
      const appError = this.errorHandler.handleError(err, { formData, locationData });
      this.error.set(appError.userFriendlyMessage);
      this.loading.set(false);
      throw err;
    }
  }

  private calculateLocally(request: { date: string; latitude: number; longitude: number }): PanchangResponse {
    const panchangDate = new Date(request.date);
    const options = {
      timezone: 'Asia/Kolkata'
    };

    return getDailyPanchang(panchangDate, {
      latitude: request.latitude,
      longitude: request.longitude
    }, options) as unknown as PanchangResponse;
  }

  getActiveItem<T extends { isActiveAtSunrise?: boolean }>(items?: T[] | null): T | null {
    return items?.find(item => item.isActiveAtSunrise) ?? items?.[0] ?? null;
  }

  clearError(): void {
    this.error.set(null);
  }
}