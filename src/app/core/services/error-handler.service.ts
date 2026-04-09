import { Injectable } from '@angular/core';
import { LoggerService } from './logger.service';

export interface AppError {
  id: string;
  message: string;
  code?: string;
  timestamp: Date;
  context?: any;
  userFriendlyMessage: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private errors: AppError[] = [];

  constructor(private logger: LoggerService) {}

  handleError(error: any, context?: any): AppError {
    const appError: AppError = {
      id: this.generateErrorId(),
      message: error?.message || 'Unknown error occurred',
      code: error?.code,
      timestamp: new Date(),
      context,
      userFriendlyMessage: this.getUserFriendlyMessage(error)
    };

    this.errors.push(appError);
    this.logger.error('Application Error', appError);

    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }

    return appError;
  }

  getErrors(): AppError[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }

  getUserFriendlyMessage(error: any): string {
    if (error?.code === 'NETWORK_ERROR') {
      return 'Network connection issue. Please check your internet connection and try again.';
    }

    if (error?.code === 'VALIDATION_ERROR') {
      return 'Please check your input and try again.';
    }

    if (error?.code === 'SPEECH_SYNTHESIS_ERROR') {
      return 'Speech synthesis is not available. Please try a different browser or device.';
    }

    if (error?.code === 'LOCATION_ERROR') {
      return 'Unable to find the selected location. Please choose a different location.';
    }

    // Default messages
    if (error?.message?.includes('panchang')) {
      return 'Unable to calculate panchang data. Please try again later.';
    }

    if (error?.message?.includes('speech')) {
      return 'Unable to play audio. Please check your browser settings.';
    }

    return 'An unexpected error occurred. Please try again.';
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Report error to external service (for production)
  reportError(error: AppError): void {
    // In production, this would send to error reporting service
    this.logger.warn('Error reported to external service', error);
  }
}