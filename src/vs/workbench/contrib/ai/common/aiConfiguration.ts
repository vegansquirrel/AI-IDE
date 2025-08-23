// /home/rishav/ai-ide-workspace/your-ai-ide/src/vs/workbench/contrib/ai/common/aiConfiguration.ts

import { IConfigurationRegistry, Extensions } from '../../../../platform/configuration/common/configurationRegistry.js';
import { Registry } from '../../../../platform/registry/common/platform.js';

Registry.as<IConfigurationRegistry>(Extensions.Configuration).registerConfiguration({
	id: 'ai',
	title: 'AI Assistant',
	type: 'object',
	properties: {
		'ai.openRouterApiKey': {
			type: 'string',
			default: '',
			description: 'Your OpenRouter API key. Get one at https://openrouter.ai/keys',
			markdownDescription: 'Your OpenRouter API key. Get one at [OpenRouter](https://openrouter.ai/keys)'
		},
		'ai.model': {
			type: 'string',
			enum: [
				'openai/gpt-4',
				'openai/gpt-4-turbo-preview',
				'openai/gpt-3.5-turbo',
				'anthropic/claude-3-opus',
				'anthropic/claude-3-sonnet',
				'anthropic/claude-3-haiku',
				'google/gemini-pro',
				'meta-llama/llama-3-70b-instruct',
				'meta-llama/codellama-70b-instruct',
				'mistralai/mixtral-8x7b-instruct',
				'deepseek/deepseek-coder-33b-instruct',
				'phind/phind-codellama-34b-v2'
			],
			default: 'openai/gpt-4',
			description: 'AI model to use via OpenRouter',
			markdownDescription: 'Select the AI model to use. See [available models](https://openrouter.ai/models)'
		},
		'ai.temperature': {
			type: 'number',
			default: 0.7,
			minimum: 0,
			maximum: 2,
			description: 'Temperature for AI responses (0 = focused, 2 = creative)'
		},
		'ai.maxTokens': {
			type: 'number',
			default: 2000,
			minimum: 100,
			maximum: 32000,
			description: 'Maximum tokens in AI response'
		},
		'ai.showTokenUsage': {
			type: 'boolean',
			default: true,
			description: 'Show token usage in console after each request'
		}
	}
});
