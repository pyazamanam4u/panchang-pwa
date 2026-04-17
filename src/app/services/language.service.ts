import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Lang = 'en-IN' | 'hi-IN' | 'te-IN';

@Injectable({ providedIn: 'root' })
export class LanguageService {

  private langSubject = new BehaviorSubject<Lang>('en-IN');

  lang$ = this.langSubject.asObservable();

  // =========================
  // SET LANGUAGE (GLOBAL)
  // =========================
  setLanguage(lang: Lang) {

    console.log('🌐 LANGUAGE SET:', lang);

    localStorage.setItem('lang', lang);

    this.langSubject.next(lang);
  }

  // =========================
  // GET CURRENT
  // =========================
  getLanguage(): Lang {
    return this.langSubject.value;
  }

  // =========================
  // INIT FROM STORAGE
  // =========================
  init() {

    const saved = localStorage.getItem('lang') as Lang;

    if (saved) {
      this.langSubject.next(saved);
    }
  }
}