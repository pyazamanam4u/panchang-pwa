import { Injectable, signal } from '@angular/core';
import { PanchangWithFormData } from '../core/types/panchang.types';

@Injectable({ providedIn: 'root' })
export class PanchangStore {
  readonly panchang = signal<PanchangWithFormData | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  setPanchang(value: PanchangWithFormData): void {
    this.panchang.set(value);
    this.error.set(null);
  }

  clear(): void {
    this.panchang.set(null);
    this.loading.set(false);
    this.error.set(null);
  }

  setLoading(value: boolean): void {
    this.loading.set(value);
  }

  setError(message: string | null): void {
    this.error.set(message);
  }
}
