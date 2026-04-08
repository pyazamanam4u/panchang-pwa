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
    <div class="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div class="row justify-content-center w-100">
        <div class="col-12 col-sm-10 col-md-8 col-lg-5 mx-auto">
          <div class="card shadow-lg border-0 login-card">
            <div class="card-body login-body">
              <div class="text-center login-header">
                <div class="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
                  <span class="text-white fs-3">ॐ</span>
                </div>
                <h2 class="mt-3 mb-1 login-title">Welcome Back</h2>
                <p class="text-muted login-subtitle">Sign in to access Panchang PWA</p>
              </div>

              <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="mb-4">
                <div class="mb-4">
                  <label for="email" class="form-label login-label">Email</label>
                  <input
                    type="email"
                    class="form-control form-control-lg rounded-0 login-input"
                    id="email"
                    formControlName="email"
                    placeholder="Enter your email"
                  />
                  <div class="invalid-feedback" *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
                    Please enter a valid email.
                  </div>
                </div>

                <div class="mb-4">
                  <label for="password" class="form-label login-label">Password</label>
                  <input
                    type="password"
                    class="form-control form-control-lg rounded-0 login-input"
                    id="password"
                    formControlName="password"
                    placeholder="Enter your password"
                  />
                  <div class="invalid-feedback" *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
                    Password is required.
                  </div>
                </div>

                <button
                  type="submit"
                  class="btn btn-primary btn-lg w-100 rounded-0"
                  [disabled]="loginForm.invalid || loading"
                >
                  <span *ngIf="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                  {{ loading ? 'Signing In...' : 'Sign In' }}
                </button>
              </form>

              <div class="text-center login-demo">
                <small class="text-muted">
                  Demo credentials: user@example.com / password
                </small>
              </div>
            </div>
          </div>
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
          this.router.navigate(['/']);
        } else {
          alert('Invalid credentials');
        }
      },
      error: () => {
        this.loading = false;
        alert('Login failed');
      },
    });
  }
}