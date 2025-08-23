// /home/rishav/ai-ide-workspace/your-ai-ide/src/vs/workbench/contrib/ai/common/ai.ts

import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { Event } from '../../../../base/common/event.js';

export const IAIService = createDecorator<IAIService>('aiService');

export interface IAIService {
	readonly _serviceBrand: undefined;
	onDidReceiveMessage: Event<IAIMessage>;

	processFile(content: string, instruction: string): Promise<string>;
	chat(message: string, context?: string): Promise<string>;
	complete(prompt: string): Promise<string>;
	setApiKey(key: string): void;
	setProvider(provider: AIProvider): void;
}

export interface IAIMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: Date;
}

export enum AIProvider {
	OpenAI = 'openai',
	Anthropic = 'anthropic',
	Local = 'local'
}

export interface IAIConfig {
	apiKey: string;
	provider: AIProvider;
	model?: string;
	temperature?: number;
	maxTokens?: number;
}
