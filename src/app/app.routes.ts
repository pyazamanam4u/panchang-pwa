import { Routes } from '@angular/router';
import { PanchangFormComponent } from './features/panchang-form/panchang-form.component';
import { LoginComponent } from './features/login/login.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: PanchangFormComponent, canActivate: [AuthGuard] },
];
