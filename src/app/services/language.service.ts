import { Injectable } from '@angular/core';
import { LanguageStore } from '../stores/language.store';
import { SankalpamLanguage } from '../core/types/api.models';


@Injectable({ providedIn: 'root' })
export class LanguageService {
  constructor(private languageStore: LanguageStore) {}

  get selectedLanguage(): SankalpamLanguage {
    return this.languageStore.language();
  }

  setLanguage(language: SankalpamLanguage): void {
    this.languageStore.setLanguage(language);
  }

  getLanguage(): SankalpamLanguage {
    return this.languageStore.language();
  }
}
