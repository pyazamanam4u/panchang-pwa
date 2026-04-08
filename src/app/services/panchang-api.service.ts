import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface PanchangAudioRequest {
  name: string;
  gotra: string;
  date: string;
}

@Injectable({
  providedIn: 'root',
})
export class PanchangApiService {
  private readonly apiUrl = '/api/panchang-audio';

  constructor(private readonly http: HttpClient) {}

  generateAudio(request: PanchangAudioRequest): Observable<Blob> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'audio/*',
    });

    return this.http.post(this.apiUrl, request, {
      headers,
      responseType: 'blob',
    });
  }
}
