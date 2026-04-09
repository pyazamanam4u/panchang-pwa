import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  private authService = inject(AuthService);
  private router = inject(Router);
  private readonly currentRoute = signal(this.router.url);

  protected readonly title = signal('panchang-pwa');
  protected readonly isLoggedIn = computed(() => this.authService.isLoggedIn());
  protected readonly showHeader = computed(
    () => this.isLoggedIn() && !this.currentRoute().startsWith('/login')
  );
  protected readonly isGlobalLoading = signal(false);

  constructor() {
    // Subscribe to authentication changes to keep the UI in sync
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      // The computed signal will automatically update
    });

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentRoute.set(event.urlAfterRedirects || event.url);
      }
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
