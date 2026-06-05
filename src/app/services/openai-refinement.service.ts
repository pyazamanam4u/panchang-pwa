import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoggerService } from '../core/services/logger.service';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature: number;
  max_tokens: number;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

@Injectable({ providedIn: 'root' })
export class OpenaiRefinementService {
  private apiKey = environment.openaiApiKey;
  private apiUrl = environment.openaiBaseUrl;

  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {}

  async refineText(text: string, language: string = 'en'): Promise<string> {
    if (!this.apiKey || !text) {
      return text;
    }

    try {
      const systemPrompt = this.getSystemPrompt(language);

      const request: OpenAIRequest = {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Please refine and improve the following Sankalpam text to make it more eloquent, meaningful, and suitable for audio recitation:\n\n${text}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      };

      const response = await firstValueFrom(
        this.http.post<OpenAIResponse>(`${this.apiUrl}/chat/completions`, request, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        })
      );

      const refinedText = response.choices?.[0]?.message?.content?.trim() || text;
      this.logger.info('Sankalpam refined via OpenAI', { original: text, refined: refinedText });

      return refinedText;
    } catch (error) {
      this.logger.warn('OpenAI refinement failed, using original text', error);
      return text;
    }
  }

  private getSystemPrompt(language: string): string {
    const prompts: Record<string, string> = {
      'en-IN': `You are a sacred Hindu ritual expert and eloquent Sanskrit translator. Your task is to refine Sankalpam texts to be more spiritually resonant, poetic, and suitable for audio recitation. Maintain the original meaning while improving flow, rhythm, and spiritual depth. Include appropriate Sanskrit terms and blessings where relevant.`,
      'hi-IN': `आप एक पवित्र हिंदू रीति-रिवाज विशेषज्ञ और संस्कृत अनुवादक हैं। आपका काम संकल्प पाठ को अधिक आध्यात्मिक रूप से प्रतिध्वनित, काव्यात्मक और ऑडियो पाठन के लिए उपयुक्त बनाना है। मूल अर्थ को बनाए रखते हुए प्रवाह, लय और आध्यात्मिक गहराई में सुधार करें। उपयुक्त संस्कृत शब्दों और आशीर्वादों को शामिल करें।`,
      'te-IN': `మీరు ఒక పవిత్ర హిందూ ఆచారం నిపుణుడు మరియు సంస్కృత అనువాదకుడు. మీ పని సంకల్ప గ్రంథాలను మరింత ఆధ్యాత్మికంగా గుంజన్పరచటానికి, కవితాత్మకంగా చేయటానికి మరియు ఆడియో పఠనం కోసం సరిదిద్దటానికి ఉంది. అసలు అర్థాన్ని కాపాడుకుంటూ ప్రవాహం, లయ మరియు ఆధ్యాత్మిక లోతులో సంతకాలు కలిగిస్తుంది.`
    };

    return prompts[language] || prompts['en-IN'];
  }
}
