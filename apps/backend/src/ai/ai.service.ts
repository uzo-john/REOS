import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAiProvider, AiMessage, AiResponse } from './interfaces/ai-provider.interface';
import { OpenAiProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { AnthropicProvider } from './providers/anthropic.provider';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private providers: Map<string, IAiProvider> = new Map();

  constructor(
    private configService: ConfigService,
    private openAi: OpenAiProvider,
    private gemini: GeminiProvider,
    private anthropic: AnthropicProvider,
  ) {
    this.providers.set(this.openAi.getName(), this.openAi);
    this.providers.set(this.gemini.getName(), this.gemini);
    this.providers.set(this.anthropic.getName(), this.anthropic);
  }

  async generateResponse(messages: AiMessage[], options?: any): Promise<AiResponse> {
    const primaryName = (this.configService.get<string>('AI_PROVIDER') || 'GEMINI').toUpperCase();
    const provider = this.providers.get(primaryName);

    if (!provider) {
      throw new Error(`AI Provider '${primaryName}' not supported`);
    }

    try {
      this.logger.log(`Invoking primary AI provider: ${primaryName}`);
      return await provider.generateResponse(messages, options);
    } catch (e: any) {
      this.logger.warn(`Primary AI provider '${primaryName}' failed: ${e.message}. Initiating failover logic.`);
      
      const alternateNames = Array.from(this.providers.keys()).filter(name => name !== primaryName);
      
      for (const altName of alternateNames) {
        try {
          const altProvider = this.providers.get(altName)!;
          this.logger.log(`Failover rebound: Attempting provider: ${altName}`);
          const response = await altProvider.generateResponse(messages, options);
          this.logger.log(`Failover successful with provider: ${altName}`);
          return response;
        } catch (err: any) {
          this.logger.warn(`Failover provider '${altName}' failed: ${err.message}`);
        }
      }

      throw new Error(`AI generation failed: All providers exhausted. Primary error: ${e.message}`);
    }
  }
}
