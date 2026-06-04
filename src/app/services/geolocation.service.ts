import { Injectable, signal } from '@angular/core';
import { ErrorHandlerService } from '../core/services/error-handler.service';
import { LoggerService } from '../core/services/logger.service';

export interface LocationInfo {
  name: string;
  latitude: number;
  longitude: number;
}

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  private readonly locating = signal(false);
  private readonly lastError = signal<string | null>(null);

  get isLocating() {
    return this.locating.asReadonly();
  }

  get errorMessage() {
    return this.lastError.asReadonly();
  }

  constructor(
    private logger: LoggerService,
    private errorHandler: ErrorHandlerService
  ) {}

  async getCurrentPosition(): Promise<LocationInfo | null> {
    if (!navigator.geolocation) {
      const error = this.errorHandler.handleError({ message: 'Geolocation is not supported in this browser.', code: 'GEOLOCATION_UNSUPPORTED' });
      this.lastError.set(error.userFriendlyMessage);
      return null;
    }

    this.locating.set(true);
    this.lastError.set(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationInfo = {
            name: `Lat ${position.coords.latitude.toFixed(4)}, Lon ${position.coords.longitude.toFixed(4)}`,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };

          this.logger.info('Geolocation position acquired', location);
          this.locating.set(false);
          resolve(location);
        },
        (geoError) => {
          const error = this.errorHandler.handleError(geoError, { code: 'GEOLOCATION_ERROR' });
          this.lastError.set(error.userFriendlyMessage);
          this.locating.set(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000
        }
      );
    });
  }
}
