import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {}

  login(email: string, password: string): Observable<boolean> {
    // Mock authentication - replace with real API call
    return new Observable(observer => {
      setTimeout(() => {
        if (email === 'user@example.com' && password === 'password') {
          localStorage.setItem('isLoggedIn', 'true');
          this.isAuthenticatedSubject.next(true);
          observer.next(true);
        } else {
          observer.next(false);
        }
        observer.complete();
      }, 1000);
    });
  }

  logout(): void {
    localStorage.removeItem('isLoggedIn');
    this.isAuthenticatedSubject.next(false);
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }
}