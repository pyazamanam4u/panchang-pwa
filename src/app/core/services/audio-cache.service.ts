import { Injectable } from '@angular/core';
import { AudioCacheKey } from '../types/panchang.types';
import { environment } from '../../../environments/environment';

export interface AudioCacheEntry {
  key: string;
  text: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class AudioCacheService {
  private readonly storageKey = 'panchang_audio_cache';
  private readonly cacheDurationMs = environment.cache.audioCacheDuration;
  private cache: Record<string, AudioCacheEntry> = this.loadCache();

  getCachedText(cacheKey: AudioCacheKey): string | null {
    this.cleanupExpired();
    const key = JSON.stringify(cacheKey);
    const entry = this.cache[key];
    return entry ? entry.text : null;
  }

  setCachedText(cacheKey: AudioCacheKey, text: string): void {
    const key = JSON.stringify(cacheKey);
    this.cache[key] = {
      key,
      text,
      timestamp: Date.now(),
    };
    this.saveCache();
  }

  private cleanupExpired(): void {
    const now = Date.now();
    let changed = false;

    for (const storedKey of Object.keys(this.cache)) {
      if (now - this.cache[storedKey].timestamp > this.cacheDurationMs) {
        delete this.cache[storedKey];
        changed = true;
      }
    }

    if (changed) {
      this.saveCache();
    }
  }

  private loadCache(): Record<string, AudioCacheEntry> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw) as Record<string, AudioCacheEntry>;
      return parsed ?? {};
    } catch {
      return {};
    }
  }

  private saveCache(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.cache));
    } catch {
      // Ignore storage write failures in browsers that disable localStorage.
    }
  }
}