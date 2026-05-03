import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private authState = new BehaviorSubject<boolean>(this.hasToken());

  // ✅ Observable-based API (used by guard)
  isAuthenticated$(): Observable<boolean> {
    return this.authState.asObservable();
  }

  // Keep sync version (optional, for quick checks)
  isAuthenticated(): boolean {
    return this.authState.value;
  }

  loginWithSSO(): Observable<{ token: string }> {
    return new Observable(observer => {
      setTimeout(() => {
        localStorage.setItem('auth_token', 'dummy-token');
        this.authState.next(true);

        observer.next({ token: 'dummy-token' });
        observer.complete();
      }, 1500);
    });
  }

  logout() {
    localStorage.removeItem('auth_token');
    this.authState.next(false);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('auth_token');
  }
}