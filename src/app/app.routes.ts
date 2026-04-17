import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { ConversationCommon } from 'microsoft-cognitiveservices-speech-sdk/distrib/lib/src/sdk/Transcription/ConversationCommon';
import { ConversationComponent } from './features/panchang-form/conversation.component';
import { LanguageSelectComponent } from './features/language/language/language-select.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: LanguageSelectComponent, canActivate: [AuthGuard] },
  { path: 'conversation', component: ConversationComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/login' }
];
