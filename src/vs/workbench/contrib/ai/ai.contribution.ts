// /home/rishav/ai-ide-workspace/your-ai-ide/src/vs/workbench/contrib/ai/ai.contribution.ts

import { IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'vs/workbench/common/contributions.js';
import { Registry } from 'vs/platform/registry/common/platform.js';
import { LifecyclePhase } from 'vs/workbench/services/lifecycle/common/lifecycle.js';
import { registerSingleton, InstantiationType } from 'vs/platform/instantiation/common/extensions.js';
import { IAIService } from './common/ai.js';
import { AIService } from './common/aiService.js';
'./common/aiConfiguration.js';
'./browser/aiButton.js';
'./browser/aiChatView.js';
'./browser/aiActions.js';
registerSingleton(IAIService, AIService, InstantiationType.Delayed);

// Import all features
'./browser/aiButton.js';
'./browser/aiChatView.js';
'./browser/aiActions.js';

// Main contribution class
class AIContribution {
	constructor() {
		console.log('AI Feature Initialized');
	}
}

// Register the contribution
Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench)
	.registerWorkbenchContribution(AIContribution, LifecyclePhase.Restored);
