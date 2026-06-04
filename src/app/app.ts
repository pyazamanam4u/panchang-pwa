import { Component, inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class App {

  private authService = inject(AuthService);

  constructor() {
    this.authService.isAuthenticated$().subscribe(isAuth => {
    });
  }
}