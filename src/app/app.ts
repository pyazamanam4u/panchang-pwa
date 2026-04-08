import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  private authService = inject(AuthService);
  private router = inject(Router);

  protected readonly title = signal('panchang-pwa');
  protected readonly isLoggedIn = computed(() => this.authService.isLoggedIn());
  protected readonly isGlobalLoading = signal(false);

  constructor() {
    // Subscribe to authentication changes to keep the UI in sync
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      // The computed signal will automatically update
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Method to control global loading state (can be called by child components)
  setGlobalLoading(loading: boolean): void {
    this.isGlobalLoading.set(loading);
  }
}
