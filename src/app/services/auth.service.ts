import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AuthStore } from '../stores/auth.store';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStore = inject(AuthStore);

  isAuthenticated$(): Observable<boolean> {
    return toObservable(this.authStore.isAuthenticated);
  }

  getUserName(): string | null {
    return this.authStore.userName();
  }

  login(username: string, password: string): Observable<boolean> {
    if (!username.trim() || !password.trim()) {
      return throwError(() => new Error('Username and password are required.'));
    }

    return of(true).pipe(delay(800));
  }

  completeLogin(username: string): void {
    this.authStore.setUser(username.trim());
  }

  logout(): void {
    this.authStore.clear();
  }
}
