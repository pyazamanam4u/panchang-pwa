import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { LanguageService } from '../../../services/language.service';
import { VoiceService } from '../../../services/voice.service';
import { SankalpamLanguage } from '../../../core/types/api.models';

@Component({
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule],
  templateUrl: './language-select.component.html',
  styleUrls: ['./language-select.component.scss']
})
export class LanguageSelectComponent {

  private lang = inject(LanguageService);
  private voice = inject(VoiceService);
  private router = inject(Router);

  languages: Array<{ code: SankalpamLanguage; label: string; display: string }> = [
    { code: 'en-IN', label: 'English', display: 'English' },
    { code: 'hi-IN', label: 'Hindi', display: 'हिन्दी' },
    { code: 'te-IN', label: 'Telugu', display: 'తెలుగు' },
    { code: 'kn-IN', label: 'Kannada', display: 'ಕನ್ನಡ' },
    { code: 'ta-IN', label: 'Tamil', display: 'தமிழ்' },
    { code: 'sa-IN', label: 'Sanskrit', display: 'संस्कृतम्' }
  ];

  async select(langCode: SankalpamLanguage) {

    this.lang.setLanguage(langCode);

    await this.voice.speak(
      langCode === 'te-IN'
        ? 'సంకల్పం ప్రారంభమవుతుంది'
        : langCode === 'hi-IN'
        ? 'संकल्पम प्रारंभ होता है'
        : 'Sankalpam will begin now',
      langCode
    );

    this.router.navigate(['/conversation']);
  }
}