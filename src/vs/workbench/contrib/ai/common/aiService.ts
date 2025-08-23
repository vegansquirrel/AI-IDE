// /home/rishav/ai-ide-workspace/your-ai-ide/src/vs/workbench/contrib/ai/common/aiService.ts

import { IAIService, IAIMessage, AIProvider, IAIConfig } from '../common/ai.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';

export class AIService extends Disposable implements IAIService {
	readonly _serviceBrand: undefined;

	private _onDidReceiveMessage = this._register(new Emitter<IAIMessage>());
	readonly onDidReceiveMessage: Event<IAIMessage> = this._onDidReceiveMessage.event;

	private config: IAIConfig = {
		apiKey: '',  // This will be your OPENROUTER_API_KEY
		provider: AIProvider.OpenAI,
		model: 'openai/gpt-4', // OpenRouter format: provider/model
		temperature: 0.7,
		maxTokens: 2000
	};

	private conversationHistory: IAIMessage[] = [];

	// OpenRouter endpoint
	private readonly OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

	// Available models on OpenRouter
	private readonly OPENROUTER_MODELS: Record<string, string> = {
		// OpenAI Models
		'gpt-4': 'openai/gpt-4',
		'gpt-4-turbo': 'openai/gpt-4-turbo-preview',
		'gpt-5': 'openai/gpt-5',

		// Anthropic Models
		'claude-sonnet-4': 'anthropic/claude-sonnet-4',
		'claude-opus-4': 'anthropic/claude-opus-4',

		// DeepSeek Models
		'deepseek-v3.1-base': 'deepseek/deepseek-v3.1-base',

		// Google Models
		'gemini-2.5-pro': 'google/gemini-2.5-pro',
		'gemini-2.5-flash': 'google/gemini-2.5-flash',

		// Meta Models
		'llama-4-scout-free': 'meta-llama/llama-4-scout:free',
		'llama-4-maverick-free': 'meta-llama/llama-4-maverick:free',

		// Mistral Models
		'mixtral-8x7b': 'mistralai/mixtral-8x7b-instruct',
		'mistral-7b': 'mistralai/mistral-7b-instruct',

		// Other Models
		'kimi-vl-a3b-thinking-free': 'moonshotai/kimi-vl-a3b-thinking:free',
		'deepseek-coder': 'deepseek/deepseek-coder-33b-instruct',
		'phind-codellama': 'phind/phind-codellama-34b-v2',
		'wizardcoder': 'wizardlm/wizardcoder-33b-v1.1'
	};

	constructor() {
		super();
		console.log('AI Service initialized with OpenRouter');

		// Set default model
		this.config.model = this.OPENROUTER_MODELS['gpt-4'];
	}

	setApiKey(key: string): void {
		this.config.apiKey = key;
		console.log('OpenRouter API key set');
	}

	setProvider(provider: AIProvider): void {
		// With OpenRouter, we just change the model
		this.config.provider = provider;

		// Set appropriate default model based on provider
		if (provider === AIProvider.OpenAI) {
			this.config.model = this.OPENROUTER_MODELS['gpt-4'];
		} else if (provider === AIProvider.Anthropic) {
			this.config.model = this.OPENROUTER_MODELS['claude-3-sonnet'];
		}
	}

	setModel(modelKey: string): void {
		// Allow setting specific model
		if (this.OPENROUTER_MODELS[modelKey]) {
			this.config.model = this.OPENROUTER_MODELS[modelKey];
		} else {
			// If not in our map, assume it's a direct OpenRouter model string
			this.config.model = modelKey;
		}
		console.log(`Model set to: ${this.config.model}`);
	}

	async processFile(content: string, instruction: string): Promise<string> {
		const prompt = `
			You are an expert code assistant. Analyze the following code and provide helpful insights.

			File Content:
			\`\`\`
			${content}
			\`\`\`

			Instruction: ${instruction}

			Please provide a detailed and helpful response.
		`;

		return this.makeOpenRouterCall([
			{ role: 'system', content: 'You are an expert programming assistant with deep knowledge of software development best practices.' },
			{ role: 'user', content: prompt }
		]);
	}

	async chat(message: string, context?: string): Promise<string> {
		// Add user message to history
		const userMessage: IAIMessage = {
			role: 'user',
			content: message,
			timestamp: new Date()
		};

		this.conversationHistory.push(userMessage);
		this._onDidReceiveMessage.fire(userMessage);

		// Prepare messages for API
		const messages = [
			{
				role: 'system',
				content: 'You are an AI programming assistant integrated into VS Code. Help users with coding questions, debugging, and software development best practices.'
			}
		];

		// Add context if provided
		if (context) {
			messages.push({
				role: 'system',
				content: `Current code context:\n\`\`\`\n${context}\n\`\`\``
			});
		}

		// Add conversation history (last 10 messages for context)
		const recentHistory = this.conversationHistory.slice(-10);
		for (const msg of recentHistory) {
			messages.push({
				role: msg.role as 'user' | 'assistant',
				content: msg.content
			});
		}

		// Get AI response
		const response = await this.makeOpenRouterCall(messages);

		// Add AI response to history
		const aiMessage: IAIMessage = {
			role: 'assistant',
			content: response,
			timestamp: new Date()
		};

		this.conversationHistory.push(aiMessage);
		this._onDidReceiveMessage.fire(aiMessage);

		return response;
	}

	async complete(prompt: string): Promise<string> {
		return this.makeOpenRouterCall([
			{ role: 'user', content: prompt }
		]);
	}

	private async makeOpenRouterCall(messages: any[]): Promise<string> {
		if (!this.config.apiKey) {
			return '⚠️ Please set your OpenRouter API key in VS Code settings:\n\n' +
				'1. Go to File → Preferences → Settings\n' +
				'2. Search for "AI API Key"\n' +
				'3. Enter your OpenRouter API key\n\n' +
				'Get your API key from: https://openrouter.ai/keys';
		}

		try {
			console.log(`Making OpenRouter API call with model: ${this.config.model}`);

			const requestBody = {
				model: this.config.model || 'openai/gpt-4',
				messages: messages,
				temperature: this.config.temperature || 0.7,
				max_tokens: this.config.maxTokens || 2000,
				// Optional: Add OpenRouter specific parameters
				top_p: 1,
				frequency_penalty: 0,
				presence_penalty: 0,
				// Optional: Add your app name for OpenRouter analytics
				headers: {
					"HTTP-Referer": "https://github.com/your-username/ai-ide",
					"X-Title": "AI IDE"
				}
			};

			const response = await fetch(this.OPENROUTER_API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.config.apiKey}`,
					// Optional: Add your site URL for OpenRouter
					'HTTP-Referer': 'https://github.com/your-username/ai-ide',
					'X-Title': 'AI IDE'
				},
				body: JSON.stringify(requestBody)
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error('OpenRouter API error:', errorData);

				// Handle specific OpenRouter errors
				if (response.status === 401) {
					throw new Error('Invalid API key. Please check your OpenRouter API key.');
				} else if (response.status === 402) {
					throw new Error('Insufficient credits. Please add credits to your OpenRouter account.');
				} else if (response.status === 429) {
					throw new Error('Rate limit exceeded. Please wait a moment and try again.');
				} else if (errorData.error) {
					throw new Error(`OpenRouter error: ${errorData.error.message || errorData.error}`);
				} else {
					throw new Error(`OpenRouter API error: ${response.statusText}`);
				}
			}

			const data = await response.json();

			// Log usage info if available
			if (data.usage) {
				console.log('Token usage:', {
					prompt: data.usage.prompt_tokens,
					completion: data.usage.completion_tokens,
					total: data.usage.total_tokens
				});
			}

			// Extract the response content
			if (data.choices && data.choices[0] && data.choices[0].message) {
				return data.choices[0].message.content;
			} else {
				throw new Error('Unexpected response format from OpenRouter');
			}

		} catch (error) {
			console.error('OpenRouter API Error:', error);

			if (error.message.includes('fetch')) {
				return '❌ Network error. Please check your internet connection.';
			}

			return `❌ Error: ${error.message}`;
		}
	}

	// Method to get available models
	getAvailableModels(): { [key: string]: string } {
		return this.OPENROUTER_MODELS;
	}

	// Method to clear conversation history
	clearHistory(): void {
		this.conversationHistory = [];
		console.log('Conversation history cleared');
	}

	// Method to get current configuration
	getConfig(): IAIConfig {
		return { ...this.config };
	}
}
