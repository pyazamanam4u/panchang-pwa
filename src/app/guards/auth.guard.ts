import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

/**
 * Functional Guard (Modern Angular Recommended)
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$().pipe(
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      }

      // Preserve return URL for post-login redirect
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });

      return false;
    })
  );
};