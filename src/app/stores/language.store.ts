import { Injectable, signal } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { SankalpamLanguage } from '../core/types/api.models';

@Injectable({ providedIn: 'root' })
export class LanguageStore {
  private readonly storageKey = 'sankalpam_selected_language';
  readonly language = signal<SankalpamLanguage>('en-IN');

  constructor(private storage: StorageService) {
    const saved = this.storage.getItem<{ language: SankalpamLanguage }>(this.storageKey);
    if (saved?.language) {
      this.language.set(saved.language);
    }
  }

  setLanguage(language: SankalpamLanguage): void {
    this.language.set(language);
    this.storage.setItem(this.storageKey, { language });
  }
}
