import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAiProvider, AiMessage, AiResponse } from '../interfaces/ai-provider.interface';

@Injectable()
export class GeminiProvider implements IAiProvider {
  constructor(private configService: ConfigService) {}

  getName(): string {
    return 'GEMINI';
  }

  async generateResponse(messages: AiMessage[], options?: any): Promise<AiResponse> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      return {
        content: 'Confirm your DisCo tariff class (e.g. Band A) to estimate grid export ROI and optimize solar power utilization.',
        model: 'MOCK-GEMINI'
      };
    }

    try {
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const modelName = options?.model || this.configService.get<string>('GEMINI_MODEL') || 'gemini-3.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const data: any = await response.json();
      return {
        content: data.candidates[0].content.parts[0].text,
        tokensUsed: 0,
        model: modelName,
      };
    } catch (e: any) {
      console.error('Gemini error object:', e);
      if (e.cause) console.error('Gemini error cause:', e.cause);
      throw new Error(`Gemini execution error: ${e.message}`);
    }
  }
}
