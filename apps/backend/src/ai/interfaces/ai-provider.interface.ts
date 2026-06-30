export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiResponse {
  content: string;
  tokensUsed?: number;
}

export interface IAiProvider {
  getName(): string;
  generateResponse(messages: AiMessage[], options?: any): Promise<AiResponse>;
}
