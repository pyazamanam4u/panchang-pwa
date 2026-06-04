import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { ConversationComponent } from './features/panchang-form/conversation.component';
import { LanguageSelectComponent } from './features/language/language/language-select.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'language', component: LanguageSelectComponent, canActivate: [authGuard] },
  { path: 'conversation', component: ConversationComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];