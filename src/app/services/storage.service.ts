import { Injectable } from '@angular/core';
import { LoggerService } from '../core/services/logger.service';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly dbName = 'sankalpam-db';
  private readonly storeName = 'keyval';

  constructor(private logger: LoggerService) {
    this.openDatabase().catch((err) => {
      this.logger.warn('IndexedDB unavailable, falling back to localStorage', err);
    });
  }

  private async openDatabase(): Promise<IDBDatabase | undefined> {
    if (!('indexedDB' in window)) {
      return undefined;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = () => {
        request.result.createObjectStore(this.storeName);
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async withObjectStore<T>(callback: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
    try {
      const db = await this.openDatabase();
      if (!db) {
        return undefined;
      }

      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      return callback(store).result;
    } catch (error) {
      this.logger.warn('IndexedDB operation failed', error);
      return undefined;
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const value = localStorage.getItem(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.warn('Failed to read from localStorage', error);
      return null;
    }
  }

  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      this.logger.warn('Failed to write to localStorage', error);
    }

    this.withObjectStore((store) => store.put(value, key)).catch(() => {
      this.logger.debug('IndexedDB persistence skipped for key', key);
    });
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      this.logger.warn('Failed to remove localStorage key', error);
    }

    this.withObjectStore((store) => store.delete(key)).catch(() => {
      this.logger.debug('IndexedDB delete skipped for key', key);
    });
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      this.logger.warn('Failed to clear localStorage', error);
    }

    this.withObjectStore((store) => store.clear()).catch(() => {
      this.logger.debug('IndexedDB clear skipped');
    });
  }
}
