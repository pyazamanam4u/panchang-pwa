import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from '../../../services/language.service';
import { VoiceService } from '../../../services/voice.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-select.component.html',
  styleUrls: ['./language-select.component.scss']
})
export class LanguageSelectComponent {

  constructor(
    private lang: LanguageService,
    private voice: VoiceService,
    private router: Router
  ) {}

  async select(langCode: any) {

    this.lang.setLanguage(langCode);

    await this.voice.speak(
      langCode === 'te-IN'
        ? 'సంకల్పం ప్రారంభమవుతుంది'
        : 'Sankalpam will begin now',
      langCode
    );

    this.router.navigate(['/conversation']);
  }
}