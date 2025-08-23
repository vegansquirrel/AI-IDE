import './browser/aiChat.css';

import { Registry } from '../../../platform/registry/common/platform.js';
import { IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from '../../common/contributions.js';
import { LifecyclePhase } from '../../services/lifecycle/common/lifecycle.js';

import { IViewContainersRegistry, IViewsRegistry, Extensions as ViewContainersExtensions, Extensions as ViewsExtensions, ViewContainerLocation } from '../../common/views.js';
import { ViewPaneContainer } from '../../browser/parts/views/viewPaneContainer.js';
import { SyncDescriptor } from '../../../platform/instantiation/common/descriptors.js';
import { Codicon } from '../../../base/common/codicons.js';

import { registerSingleton, InstantiationType } from '../../../platform/instantiation/common/extensions.js';
import { IAIService } from './common/ai.js';
import { AIService } from './common/aiService.js';

// Side-effect feature modules (ensure they execute)
import './browser/aiButton.js';
import './browser/aiActions.js';
import { AIChatViewPane, AI_CHAT_VIEW_ID } from './browser/aiChatView.js';

import { localize2 } from '../../../nls.js';
// Register service
registerSingleton(IAIService, AIService, InstantiationType.Delayed);

// ----- View Container + View registration -----
const viewContainers = Registry.as<IViewContainersRegistry>(ViewContainersExtensions.ViewContainersRegistry);
const views = Registry.as<IViewsRegistry>(ViewsExtensions.ViewsRegistry);

export const AI_CONTAINER_ID = 'workbench.view.ai';

const aiContainer = viewContainers.registerViewContainer(
	{
		id: AI_CONTAINER_ID,
		title: localize2('ai.container.title', 'AI'),
		ctorDescriptor: new SyncDescriptor(ViewPaneContainer, [AI_CONTAINER_ID, { mergeViewWithContainerWhenSingleView: true }]),
		icon: Codicon.sparkle,
		storageId: AI_CONTAINER_ID
	},
	ViewContainerLocation.Sidebar,
	{}
);

views.registerViews([{
	id: AI_CHAT_VIEW_ID,          // exported from AIChatView
	name: localize2('ai.chat.view.name', 'AI Chat'),
	ctorDescriptor: new SyncDescriptor(AIChatViewPane),
	canToggleVisibility: true,
	order: 1
}], aiContainer);

// Simple workbench contribution (optional)
class AIContribution {
	constructor() {
		console.log('AI Feature Initialized');
	}
}

Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench)
	.registerWorkbenchContribution(AIContribution, LifecyclePhase.Restored);
