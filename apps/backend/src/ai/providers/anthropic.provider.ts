import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IAiProvider,
  AiMessage,
  AiResponse,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class AnthropicProvider implements IAiProvider {
  constructor(private configService: ConfigService) {}

  getName(): string {
    return 'ANTHROPIC';
  }

  async generateResponse(
    messages: AiMessage[],
    options?: any,
  ): Promise<AiResponse> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return {
        content:
          'Ensure battery depth-of-discharge (DoD) matches cell specifications to prolong battery lifespan.',
      };
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: options?.model || 'claude-3-5-sonnet-20241022',
          max_tokens: options?.max_tokens || 1024,
          messages,
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API returned status ${response.status}`);
      }

      const data: any = await response.json();
      return {
        content: data.content[0].text,
        tokensUsed:
          (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      };
    } catch (e: any) {
      throw new Error(`Anthropic execution error: ${e.message}`);
    }
  }
}
