import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
   <div class="login-container">
  <div class="login-card">

    <!-- Header -->
    <div class="text-center mb-4">
      <div class="logo-circle">ॐ</div>
      <h2 class="mt-3 fw-bold">Welcome Back</h2>
      <p class="text-muted">Sign in to access Panchang</p>
    </div>

    <!-- Form -->
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">

      <!-- Email -->
      <div class="form-floating mb-3">
        <input
          type="email"
          id="email"
          class="form-control"
          placeholder="name@example.com"
          formControlName="email"
          [class.is-invalid]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
        />
        <label for="email">Email address</label>

        <div class="invalid-feedback">
          Please enter a valid email
        </div>
      </div>

      <!-- Password -->
      <div class="form-floating mb-3 position-relative">
        <input
          [type]="'password'"
          id="password"
          class="form-control"
          placeholder="Password"
          formControlName="password"
          [class.is-invalid]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
        />
        <label for="password">Password</label>

        <div class="invalid-feedback">
          Password is required
        </div>
      </div>

      <!-- Remember + Forgot -->
      <div class="d-flex justify-content-between align-items-center mb-3 small">
        <div>
          <input type="checkbox" id="remember" class="form-check-input me-1" />
          <label for="remember" class="form-check-label">Remember me</label>
        </div>
        <a href="#" class="text-decoration-none">Forgot password?</a>
      </div>

      <!-- Submit -->
      <button
        type="submit"
        class="btn btn-primary w-100 py-2 fw-semibold"
        [disabled]="loginForm.invalid || loading"
      >
        <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
        {{ loading ? 'Signing In...' : 'Sign In' }}
      </button>
    </form>

    <!-- Divider -->
    <div class="text-center my-4">
      <span class="text-muted small">OR</span>
    </div>

    <!-- Social Login (UI only) -->
    <div class="d-grid gap-2 mb-3">
      <button type="button" class="btn btn-outline-dark">
        Continue with Google
      </button>
      <button type="button" class="btn btn-outline-primary">
        Continue with Microsoft
      </button>
    </div>

    <!-- Demo Credentials -->
    <div class="text-center small text-muted">
      <div><strong>Demo Credentials</strong></div>
      <code>user@example.com / password</code>
    </div>

  </div>
</div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = false;

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email || '', password || '').subscribe({
      next: (success) => {
        this.loading = false;
        if (success) {
          console.log('Login successful for:', email);
          // Navigate to the protected route after successful login
          this.router.navigate(['/']);
        } else {
          alert('Invalid credentials. Please check your email and password.');
          this.loginForm.get('password')?.setValue(''); // Clear password on failure
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Login error:', error);
        alert('Login failed. Please try again later.');
      },
    });
  }
}