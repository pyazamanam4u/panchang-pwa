import { Injectable, signal } from '@angular/core';
import { SankalpamResult } from '../core/types/api.models';

@Injectable({ providedIn: 'root' })
export class SankalpamStore {
  readonly result = signal<SankalpamResult | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  setResult(result: SankalpamResult): void {
    this.result.set(result);
    this.error.set(null);
  }

  clear(): void {
    this.result.set(null);
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
