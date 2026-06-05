import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface SpeechRequest {
  text: string;
  voice?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiTtsService {

  private readonly apiUrl =
    '/api/ai/speech';

  private audioCache =
    new Map<string, string>();

  constructor(
    private http: HttpClient
  ) {}

  async getAudio(
    text: string,
    voice: string = 'alloy'
  ): Promise<string> {

    const cacheKey =
      `${voice}_${this.hash(text)}`;

    const cached =
      this.audioCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const blob =
      await firstValueFrom(
        this.http.post(
          this.apiUrl,
          {
            text,
            voice
          },
          {
            responseType: 'blob'
          }
        )
      );

    const blobUrl =
      URL.createObjectURL(blob);

    this.audioCache.set(
      cacheKey,
      blobUrl
    );

    return blobUrl;
  }

  async play(
    text: string,
    voice: string = 'alloy'
  ): Promise<void> {

    const audioUrl =
      await this.getAudio(
        text,
        voice
      );

    const audio =
      new Audio(audioUrl);

    await audio.play();
  }

  clearCache(): void {

    this.audioCache.forEach(url => {
      URL.revokeObjectURL(url);
    });

    this.audioCache.clear();
  }

  private hash(text: string): string {

    let hash = 0;

    for (let i = 0; i < text.length; i++) {

      const chr =
        text.charCodeAt(i);

      hash =
        ((hash << 5) - hash) + chr;

      hash |= 0;
    }

    return Math.abs(hash)
      .toString(16);
  }
}