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

  submitSankalp(data: any) {
    console.log('Submitting sankalp data to API', data);
    return this.http.post('https://mydemowebapi-avbdfuh0b5b4hjcp.centralindia-01.azurewebsites.net/api/panchang?date=' + data.split('T')[0] + '&latitude=17&longitude=78', {});
  }
}