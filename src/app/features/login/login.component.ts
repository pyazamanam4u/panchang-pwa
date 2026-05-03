import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  private router = inject(Router);

  isLoading = false;

onLogin() {
  this.isLoading = true;

  setTimeout(() => {
    this.isLoading = false;
    this.router.navigate(['/language']);
  }, 1200);
}
}