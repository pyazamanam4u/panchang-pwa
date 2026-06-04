import { Injectable, signal } from '@angular/core';
import { StorageService } from '../services/storage.service';

export interface AuthState {
  userName: string;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly storageKey = 'sankalpam_auth_state';
  readonly isAuthenticated = signal(false);
  readonly userName = signal<string | null>(null);

  constructor(private storage: StorageService) {
    const saved = this.storage.getItem<AuthState>(this.storageKey);
    if (saved?.userName) {
      this.isAuthenticated.set(true);
      this.userName.set(saved.userName);
    }
  }

  setUser(userName: string): void {
    this.isAuthenticated.set(true);
    this.userName.set(userName);
    this.storage.setItem(this.storageKey, { userName });
  }

  clear(): void {
    this.isAuthenticated.set(false);
    this.userName.set(null);
    this.storage.removeItem(this.storageKey);
  }
}
