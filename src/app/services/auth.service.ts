import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Store user data when logged in
  private currentUser = signal<{email: string, name: string} | null>(null);

  constructor() {
    // Initialize user data if already logged in
    if (this.isLoggedIn()) {
      const userData = localStorage.getItem('userData');
      if (userData) {
        this.currentUser.set(JSON.parse(userData));
      }
    }
  }

  login(email: string, password: string): Observable<boolean> {
    // Enhanced dummy business logic with multiple user scenarios
    return new Observable(observer => {
      // Simulate network delay
      setTimeout(() => {
        // Dummy authentication logic
        const validCredentials = [
          { email: 'user@example.com', password: 'password', name: 'Demo User' },
          { email: 'admin@panchang.com', password: 'admin123', name: 'Admin User' },
          { email: 'test@test.com', password: 'test123', name: 'Test User' }
        ];

        const user = validCredentials.find(cred =>
          cred.email === email && cred.password === password
        );

        if (user) {
          // Store authentication state
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userData', JSON.stringify({
            email: user.email,
            name: user.name,
            loginTime: new Date().toISOString()
          }));

          // Update signals
          this.currentUser.set({
            email: user.email,
            name: user.name
          });
          this.isAuthenticatedSubject.next(true);

          observer.next(true);
        } else {
          observer.next(false);
        }
        observer.complete();
      }, 1500); // Realistic delay
    });
  }

  logout(): void {
    // Clear all authentication data
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userData');

    // Reset signals
    this.currentUser.set(null);
    this.isAuthenticatedSubject.next(false);
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  getCurrentUser() {
    return this.currentUser();
  }

  getUserName(): string {
    const user = this.currentUser();
    return user ? user.name : '';
  }

  getUserEmail(): string {
    const user = this.currentUser();
    return user ? user.email : '';
  }
}