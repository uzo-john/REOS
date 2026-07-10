import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAiProvider, AiMessage, AiResponse } from '../interfaces/ai-provider.interface';

@Injectable()
export class OpenAiProvider implements IAiProvider {
  constructor(private configService: ConfigService) {}

  getName(): string {
    return 'OPENAI';
  }

  async generateResponse(messages: AiMessage[], options?: any): Promise<AiResponse> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      return {
        content: 'Your system design meets the standard autonomy target of 1.0 days. Inverter capacity is recommended to include a 1.25x safety margin.',
        model: 'MOCK-OPENAI'
      };
    }

    try {
      const modelName = options?.model || 'gpt-4o-mini';
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: options?.temperature ?? 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API returned status ${response.status}`);
      }

      const data: any = await response.json();
      return {
        content: data.choices[0].message.content,
        tokensUsed: data.usage?.total_tokens,
        model: modelName,
      };
    } catch (e: any) {
      throw new Error(`OpenAI execution error: ${e.message}`);
    }
  }
}
