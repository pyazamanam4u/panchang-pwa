import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { ConversationComponent } from './features/panchang-form/conversation.component';
import { LanguageSelectComponent } from './features/language/language/language-select.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'language', component: LanguageSelectComponent }, // 👈 target
  { path: 'conversation', component: ConversationComponent },
  { path: '**', redirectTo: 'login' }
];