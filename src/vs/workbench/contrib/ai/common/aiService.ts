/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IAIService, IAIMessage, AIProvider, IAIConfig } from '../common/ai.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';

export class AIService extends Disposable implements IAIService {
	readonly _serviceBrand: undefined;
	private apiKey: string = '';
	private _onDidReceiveMessage = this._register(new Emitter<IAIMessage>());
	readonly onDidReceiveMessage: Event<IAIMessage> = this._onDidReceiveMessage.event;

	private config: IAIConfig = {
		apiKey: '',
		provider: AIProvider.OpenAI,
		model: 'openai/gpt-4',
		temperature: 0.7,
		maxTokens: 2000
	};

	private conversationHistory: IAIMessage[] = [];

	private readonly OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

	private readonly OPENROUTER_MODELS: Record<string, string> = {
		// OpenAI
		'gpt-4': 'openai/gpt-4',
		'gpt-4-turbo': 'openai/gpt-4-turbo-preview',
		// Anthropic
		'claude-sonnet-4': 'anthropic/claude-sonnet-4',
		// DeepSeek
		'deepseek-coder': 'deepseek/deepseek-coder-33b-instruct',
		// Google
		'gemini-pro': 'google/gemini-pro',
		// Meta
		'llama-3-70b': 'meta-llama/llama-3-70b-instruct',
		// Mistral
		'mixtral-8x7b': 'mistralai/mixtral-8x7b-instruct',
		// Phind
		'phind-codellama': 'phind/phind-codellama-34b-v2'
	};

	constructor(
		@IConfigurationService private readonly configurationService: IConfigurationService
	) {
		super();
		console.log('AI Service initialized with OpenRouter');

		// Initial read from settings
		this.apiKey = this.configurationService.getValue<string>('optqo.ai.apiKey') || '';
		this.config.model = this.configurationService.getValue<string>('optqo.ai.model') || this.OPENROUTER_MODELS['gpt-4'];
		this.config.temperature = this.configurationService.getValue<number>('optqo.ai.temperature') ?? 0.7;
		this.config.maxTokens = this.configurationService.getValue<number>('optqo.ai.maxTokens') ?? 2000;

		// React to setting changes
		this._register(this.configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('optqo.ai.apiKey')) {
				this.apiKey = this.configurationService.getValue<string>('optqo.ai.apiKey') || '';
			}
			if (e.affectsConfiguration('optqo.ai.model')) {
				this.config.model = this.configurationService.getValue<string>('optqo.ai.model') || this.config.model;
			}
			if (e.affectsConfiguration('optqo.ai.temperature')) {
				this.config.temperature = this.configurationService.getValue<number>('optqo.ai.temperature') ?? this.config.temperature;
			}
			if (e.affectsConfiguration('optqo.ai.maxTokens')) {
				this.config.maxTokens = this.configurationService.getValue<number>('optqo.ai.maxTokens') ?? this.config.maxTokens;
			}
		}));
	}

	async sendMessage(text: string, context?: string): Promise<void> {
		const response = await this.chat(text, context);
		const aiMessage: IAIMessage = { role: 'assistant', content: response, timestamp: new Date() };
		this._onDidReceiveMessage.fire(aiMessage);
	}

	setApiKey(key: string): void {
		this.apiKey = key;
	}

	setProvider(provider: AIProvider): void {
		this.config.provider = provider;
		// pick a sensible default in our map
		if (provider === AIProvider.OpenAI) {
			this.config.model = this.OPENROUTER_MODELS['gpt-4'];
		} else if (provider === AIProvider.Anthropic) {
			this.config.model = this.OPENROUTER_MODELS['claude-sonnet-4'];
		}
	}

	setModel(modelKey: string): void {
		this.config.model = this.OPENROUTER_MODELS[modelKey] || modelKey;
	}

	async processFile(content: string, instruction: string): Promise<string> {
		const prompt = `You are an expert code assistant. Analyze the following code.\n\n\`\`\`\n${content}\n\`\`\`\n\nInstruction: ${instruction}`;
		return this.makeOpenRouterCall([
			{ role: 'system', content: 'You are an expert programming assistant with deep knowledge of best practices.' },
			{ role: 'user', content: prompt }
		]);
	}

	async chat(message: string, context?: string): Promise<string> {
		const userMessage: IAIMessage = { role: 'user', content: message, timestamp: new Date() };
		this.conversationHistory.push(userMessage);

		const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
			{ role: 'system', content: 'You are an AI programming assistant integrated into VS Code.' }
		];

		if (context) {
			messages.push({ role: 'system', content: `Current code context:\n\`\`\`\n${context}\n\`\`\`` });
		}

		for (const msg of this.conversationHistory.slice(-10)) {
			messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
		}

		const response = await this.makeOpenRouterCall(messages);

		const aiMessage: IAIMessage = { role: 'assistant', content: response, timestamp: new Date() };
		this.conversationHistory.push(aiMessage);
		this._onDidReceiveMessage.fire(aiMessage);

		return response;
	}

	async complete(prompt: string): Promise<string> {
		return this.makeOpenRouterCall([{ role: 'user', content: prompt }]);
	}

	private async makeOpenRouterCall(messages: any[]): Promise<string> {
		if (!this.apiKey) {
			return 'Please set your OpenRouter API key in Settings:\n' +
				'File → Preferences → Settings, search **optqo ai**, set **OpenRouter API key**.\n' +
				'Get a key: https://openrouter.ai/keys';
		}

		try {
			const body = {
				model: this.config.model || 'openai/gpt-4',
				messages,
				temperature: this.config.temperature ?? 0.7,
				max_tokens: this.config.maxTokens ?? 2000
			};

			const res = await fetch(this.OPENROUTER_API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.apiKey}`,
					'HTTP-Referer': 'https://github.com/your-username/ai-ide',
					'X-Title': 'AI IDE'
				},
				body: JSON.stringify(body)
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				if (res.status === 401) throw new Error('Invalid API key.');
				if (res.status === 402) throw new Error('Insufficient credits on OpenRouter.');
				if (res.status === 429) throw new Error('Rate limit exceeded. Try again shortly.');
				if (err?.error) throw new Error(err.error.message || String(err.error));
				throw new Error(`OpenRouter API error: ${res.status} ${res.statusText}`);
			}

			const data = await res.json();
			if (data?.usage && this.configurationService.getValue<boolean>('optqo.ai.showTokenUsage')) {
				console.log('Token usage:', data.usage);
			}

			const content = data?.choices?.[0]?.message?.content;
			if (!content) throw new Error('Unexpected response format from OpenRouter');
			return content;

		} catch (e: any) {
			console.error('OpenRouter API Error:', e);
			if (String(e?.message || e).includes('fetch')) {
				return 'Network error. Please check your connection.';
			}
			return `Error: ${e?.message || String(e)}`;
		}
	}

	getAvailableModels(): { [key: string]: string } { return this.OPENROUTER_MODELS; }
	clearHistory(): void { this.conversationHistory = []; }
	getConfig(): IAIConfig { return { ...this.config }; }
}
