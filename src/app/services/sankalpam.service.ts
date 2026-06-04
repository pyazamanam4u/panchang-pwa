import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { LoggerService } from '../core/services/logger.service';
import { ErrorHandlerService } from '../core/services/error-handler.service';
import { VoiceService } from './voice.service';
import { environment } from '../../environments/environment';
import { SankalpamRequest, SankalpamResult, SankalpamResponse } from '../core/types/api.models';

@Injectable({ providedIn: 'root' })
export class SankalpamService {
  private readonly baseUrl = environment.api.sankalpamBaseUrl || '';

  constructor(
    private http: HttpClient,
    private logger: LoggerService,
    private errorHandler: ErrorHandlerService,
    private voiceService: VoiceService
  ) {}

  async generateSankalpam(request: SankalpamRequest): Promise<SankalpamResult> {
    this.logger.info('Generating Sankalpam', request);

    if (!this.baseUrl) {
      return this.fallbackResponse(request);
    }

    try {
      const response = await firstValueFrom(
        this.http.get<SankalpamResponse>(this.baseUrl+ `?date=${request.userDetails.date.split('T')[0]}&latitude=${17.2}&longitude=${78.0}`).pipe(
          timeout(environment.api.timeout),
          retry(2),
          catchError((error) => {
            this.logger.warn('External Sankalpam API failed, falling back', error);
            return of({ sankalpaTemplate: '', audioUrl: '' } as SankalpamResponse);
          })
        )
      );
console.log('Sankalpam API response', response.sankalpaTemplate);
      if (!response.sankalpaTemplate) {
        return this.fallbackResponse(request);
      }

      return {
        sankalpaTemplate: response.sankalpaTemplate,
        audioUrl: response.audioUrl,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      this.errorHandler.handleError(error, request);
      return this.fallbackResponse(request);
    }
  }

  private fallbackResponse(request: SankalpamRequest): SankalpamResult {
    const sankalpamText = this.buildFallbackSankalpam(request);
    const audioUrl = '';

    return {
      sankalpaTemplate: sankalpamText,
      audioUrl,
      generatedAt: new Date().toISOString()
    };
  }

  private buildFallbackSankalpam(request: SankalpamRequest): string {
    const { userDetails, language } = request;
    const formattedName = userDetails.fullName || 'Devotee';
    const ceremonyDate = new Date(userDetails.date).toLocaleDateString(language, { day: 'numeric', month: 'long', year: 'numeric' });
    const panchang = this.extractPanchangSummary(request.panchangam);

    return `Om Sri Maha Ganapataye Namaha 🙏\n\n` +
      `Today is ${ceremonyDate}. ${formattedName} of ${userDetails.gotra} gotra is offering a Sankalpam.\n` +
      `Connected to ${panchang.tithi} tithi, ${panchang.nakshatra} nakshatra, and ${panchang.yoga}.\n\n` +
      `May this Sankalpam bring peace, clarity, and abundant blessings.`;
  }

  private extractPanchangSummary(panchangam: SankalpamRequest['panchangam']): { tithi: string; nakshatra: string; yoga: string } {
    if ('tithi' in panchangam && 'nakshatra' in panchangam && 'yoga' in panchangam) {
      return {
        tithi: panchangam.tithi || 'unknown',
        nakshatra: panchangam.nakshatra || 'unknown',
        yoga: panchangam.yoga || 'unknown'
      };
    }

    return {
      tithi: panchangam.tithis?.[0]?.name ?? 'unknown',
      nakshatra: panchangam.nakshatras?.[0]?.name ?? 'unknown',
      yoga: panchangam.yogas?.[0]?.name ?? 'unknown'
    };
  }
}
