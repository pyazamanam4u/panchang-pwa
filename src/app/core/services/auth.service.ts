import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedIn = false;
  private currentUser: { email: string } | null = null;
  private readonly STORAGE_KEY = 'panchang_auth';

  constructor(private logger: LoggerService) {
    this.loadAuthState();
  }

  /**
   * Simulated login with hardcoded demo credentials
   * In production, this would call a real API
   */
  login(email: string, password: string): Observable<boolean> {
    // Demo credentials
    const validEmail = 'user@example.com';
    const validPassword = 'password';

    this.logger.info('Login attempt', { email });

    // Simulate API call with delay
    return of(email === validEmail && password === validPassword).pipe(
      delay(800),
      tap((success) => {
        if (success) {
          this.loggedIn = true;
          this.currentUser = { email };
          this.saveAuthState();
          this.logger.info('Login successful', { email });
        } else {
          this.logger.warn('Login failed - invalid credentials', { email });
        }
      })
    );
  }

  /**
   * Logout the current user
   */
  logout(): void {
    this.loggedIn = false;
    this.currentUser = null;
    this.clearAuthState();
    this.logger.info('User logged out');
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.loggedIn;
  }

  /**
   * Get current user info
   */
  getCurrentUser(): { email: string } | null {
    return this.currentUser;
  }

  /**
   * Save auth state to localStorage
   */
  private saveAuthState(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        loggedIn: this.loggedIn,
        user: this.currentUser,
        timestamp: new Date().getTime()
      }));
    } catch (error) {
      this.logger.error('Failed to save auth state', error);
    }
  }

  /**
   * Load auth state from localStorage
   */
  private loadAuthState(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        // Check if session is not too old (24 hours)
        const maxAge = 24 * 60 * 60 * 1000;
        if (new Date().getTime() - state.timestamp < maxAge) {
          this.loggedIn = state.loggedIn;
          this.currentUser = state.user;
        } else {
          this.clearAuthState();
        }
      }
    } catch (error) {
      this.logger.error('Failed to load auth state', error);
      this.clearAuthState();
    }
  }

  /**
   * Clear auth state from localStorage
   */
  private clearAuthState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      this.logger.error('Failed to clear auth state', error);
    }
  }
}
