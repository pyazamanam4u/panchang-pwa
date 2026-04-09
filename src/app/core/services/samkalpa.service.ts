import { Injectable } from '@angular/core';
import { PanchangWithFormData, PanchangTithi, PanchangNakshatra, PanchangIndexItem, PanchangKarana } from '../types/panchang.types';

@Injectable({
  providedIn: 'root'
})
export class SamkalpaService {
  private readonly samkalpaTemplate = `ॐ ॥

ममोपात्त समस्त दुरितक्षयद्वारा
श्री परमेश्वर प्रीत्यर्थम् ॥

[-- short pause --]

अद्य ब्रह्मणः द्वितीयपरार्धे
श्वेतवराहकल्पे
वैवस्वत मन्वन्तरे
अष्टाविंशतितमे कलियुगे
प्रथमपादे

[-- short pause --]

जम्बूद्वीपे
भारतवर्षे
भरतखण्डे

[-- short pause --]

[STATE_NAME] प्रदेशे
[CITY_NAME] नगरे वा ग्रामे

[-- short pause --]

अस्मिन् वर्तमान व्यावहारिक चांद्रमानेन
[YEAR_NAME] नाम संवत्सरे
[AYANA] अयने
[RITU] ऋौ
[MONTH] मासे
[PAKSHA] पक्षे
[TITHI] तिथौ
[VASARA] वासरे
[NAKSHATRA] नक्षत्रे
[YOGA] योगे
[KARANA] करणेषु

[-- pause --]

एवं गुणविशेषणविशिष्टायाम्
अस्यां शुभतिथौ

[-- short pause --]

[YOUR_NAME]
[GOTRA] गोत्रः
[OPTIONAL: NAKSHATRA_NAME] नक्षत्रः

[-- short pause --]

अहं मम परिवारस्य च
सकल सौभाग्य, आरोग्य, ऐश्वर्य, अभिवृद्ध्यर्थम्


[PUJA_NAME / INTENTION] करिष्ये ॥

[-- short pause --]

ॐ तत्सत् ॥`;

  generateSamkalpaText(panchangData: PanchangWithFormData): string {
    const { userData, locationData } = panchangData;

    const activeTithi = this.getActiveTithi(panchangData);
    const activeNakshatra = this.getActiveNakshatra(panchangData);
    const activeYoga = this.getActiveYoga(panchangData);
    const activeKarana = this.getActiveKarana(panchangData);

    const tokens = {
      '[STATE_NAME]': this.sanitizeInput(locationData.state || 'Not available'),
      '[CITY_NAME]': this.sanitizeInput(locationData.name || 'Not available'),
      '[YEAR_NAME]': this.getSamvatsara(panchangData),
      '[AYANA]': this.getAyana(userData.date),
      '[RITU]': this.getSeason(userData.date),
      '[MONTH]': this.getMonthName(userData.date),
      '[PAKSHA]': activeTithi?.paksha || 'Not available',
      '[TITHI]': activeTithi?.name || 'Not available',
      '[VASARA]': panchangData.vara?.englishName || panchangData.vara?.name || 'Not available',
      '[NAKSHATRA]': activeNakshatra?.name || 'Not available',
      '[YOGA]': activeYoga?.name || 'Not available',
      '[KARANA]': activeKarana?.name || 'Not available',
      '[YOUR_NAME]': this.sanitizeInput(userData.name),
      '[GOTRA]': this.sanitizeInput(userData.gotra),
      '[OPTIONAL: NAKSHATRA_NAME]': activeNakshatra?.name || '',
      '[PUJA_NAME / INTENTION]': this.sanitizeInput(userData.goal)
    };

    return Object.entries(tokens).reduce(
      (text, [key, value]) => text.split(key).join(value),
      this.samkalpaTemplate
    );
  }

  getSamkalpaTemplate(): string {
    return this.samkalpaTemplate;
  }

  private getActiveTithi(panchangData: PanchangWithFormData): PanchangTithi | null {
    return panchangData.tithis?.find(tithi => tithi.isActiveAtSunrise) ?? panchangData.tithis?.[0] ?? null;
  }

  private getActiveNakshatra(panchangData: PanchangWithFormData): PanchangNakshatra | null {
    return panchangData.nakshatras?.find(nakshatra => nakshatra.isActiveAtSunrise) ?? panchangData.nakshatras?.[0] ?? null;
  }

  private getActiveYoga(panchangData: PanchangWithFormData): PanchangIndexItem | null {
    return panchangData.yogas?.find(yoga => yoga.isActiveAtSunrise) ?? panchangData.yogas?.[0] ?? null;
  }

  private getActiveKarana(panchangData: PanchangWithFormData): PanchangKarana | null {
    return panchangData.karanas?.find(karana => karana.isActiveAtSunrise) ?? panchangData.karanas?.[0] ?? null;
  }

  private getSeason(date: string): string {
    const month = new Date(date).getMonth() + 1;
    if ([3, 4, 5].includes(month)) return 'Vasanta';
    if ([6, 7, 8].includes(month)) return 'Grishma';
    if ([9, 10, 11].includes(month)) return 'Sharad';
    return 'Hemanta';
  }

  private getAyana(date: string): string {
    const month = new Date(date).getMonth() + 1;
    return month >= 1 && month <= 6 ? 'Uttara' : 'Dakshina';
  }

  private getSamvatsara(panchangData: PanchangWithFormData): string {
    if (panchangData.samvat?.vikramSamvat) {
      return `Vikram ${panchangData.samvat.vikramSamvat}`;
    }
    if (panchangData.samvat?.shakaSamvat) {
      return `Shaka ${panchangData.samvat.shakaSamvat}`;
    }
    return 'Not available';
  }

  private getMonthName(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', { month: 'long' });
  }

  private sanitizeInput(input: string): string {
    // Basic sanitization to prevent XSS and ensure clean text
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim();
  }
}