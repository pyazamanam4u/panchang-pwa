import { Injectable, signal } from '@angular/core';
import { UserDetails } from '../core/types/api.models';

@Injectable({ providedIn: 'root' })
export class UserStore {
  readonly user = signal<UserDetails | null>(null);

  setUser(user: UserDetails): void {
    this.user.set(user);
  }

  clear(): void {
    this.user.set(null);
  }
}
