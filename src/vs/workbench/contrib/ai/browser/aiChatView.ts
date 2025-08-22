// /home/rishav/ai-ide-workspace/your-ai-ide/src/vs/workbench/contrib/ai/browser/aiChatView.ts

import 'vs/css!./media/aiChat.js';
import { ViewPane } from 'vs/workbench/browser/parts/views/viewPane.js';
import { IViewletViewOptions } from 'vs/workbench/browser/parts/views/viewsViewlet.js';
import { Registry } from 'vs/platform/registry/common/platform.js';
import { Extensions as ViewExtensions, IViewsRegistry, IViewContainersRegistry, ViewContainerLocation, ViewContainer } from 'vs/workbench/common/views.js';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation.js';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding.js';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView.js';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration.js';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey.js';
import { IViewDescriptorService } from 'vs/workbench/common/views.js';
import { IOpenerService } from 'vs/platform/opener/common/opener.js';
import { IThemeService } from 'vs/platform/theme/common/themeService.js';
import { IAIService, IAIMessage } from '../common/ai.js';
import { IEditorService } from 'vs/workbench/services/editor/common/editorService.js';
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors.js';
import { Codicon } from 'vs/base/common/codicons.js';
import { DisposableStore } from 'vs/base/common/lifecycle.js';
import { localize2 } from 'vs/nls.js';
import { IHoverService } from 'vs/platform/hover/browser/hover.js';
import { IAccessibleViewInformationService } from 'vs/workbench/services/accessibility/common/accessibleViewInformationService.js';

export class AIChatViewPane extends ViewPane {
	static readonly ID = 'workbench.panel.aiChat';
	static readonly TITLE = 'AI Assistant';

	private chatContainer!: HTMLElement;
	private messagesContainer!: HTMLElement;
	private inputContainer!: HTMLElement;
	private inputField!: HTMLTextAreaElement;
	private sendButton!: HTMLButtonElement;
	private messages: IAIMessage[] = [];
	private readonly disposables = this._register(new DisposableStore());

	constructor(
		options: IViewletViewOptions,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IOpenerService openerService: IOpenerService,
		@IThemeService themeService: IThemeService,
		@IAccessibleViewInformationService accessibleViewInfoService: IAccessibleViewInformationService, // <-- NEW param
		@IHoverService hoverService: IHoverService,
		@IAIService private readonly aiService: IAIService,
		@IEditorService private readonly editorService: IEditorService
	) {
		super(options, keybindingService, contextMenuService, configurationService,
			contextKeyService, viewDescriptorService, instantiationService,
			openerService, themeService, hoverService, accessibleViewInfoService
		);

		// Listen to AI messages
		this.disposables.add(this.aiService.onDidReceiveMessage(message => {
			this.addMessage(message);
		}));
	}

	protected override renderBody(container: HTMLElement): void {
		super.renderBody(container);

		// Main chat container
		this.chatContainer = document.createElement('div');
		this.chatContainer.className = 'ai-chat-container';

		// Header
		const header = document.createElement('div');
		header.className = 'ai-chat-header';
		header.innerHTML = `
			<div class="ai-chat-title">
				<span class="codicon codicon-sparkle"></span>
				<span>AI Assistant</span>
			</div>
			<div class="ai-chat-actions">
				<button class="ai-action-button" title="Clear Chat">
					<span class="codicon codicon-clear-all"></span>
				</button>
				<button class="ai-action-button" title="Settings">
					<span class="codicon codicon-settings-gear"></span>
				</button>
			</div>
		`;

		// Messages container
		this.messagesContainer = document.createElement('div');
		this.messagesContainer.className = 'ai-chat-messages';

		// Welcome message
		this.addWelcomeMessage();

		// Input container
		this.inputContainer = document.createElement('div');
		this.inputContainer.className = 'ai-chat-input-container';

		// Context indicator
		const contextIndicator = document.createElement('div');
		contextIndicator.className = 'ai-context-indicator';
		contextIndicator.innerHTML = `
			<span class="codicon codicon-file"></span>
			<span class="context-text">No file context</span>
		`;

		// Input wrapper
		const inputWrapper = document.createElement('div');
		inputWrapper.className = 'ai-input-wrapper';

		// Input field
		this.inputField = document.createElement('textarea');
		this.inputField.className = 'ai-chat-input';
		this.inputField.placeholder = 'Ask me anything about your code...';
		this.inputField.rows = 3;

		// Auto-resize textarea
		this.inputField.addEventListener('input', () => {
			this.inputField.style.height = 'auto';
			this.inputField.style.height = Math.min(this.inputField.scrollHeight, 150) + 'px';
		});

		// Handle Enter key
		this.inputField.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				this.sendMessage();
			}
		});

		// Action buttons container
		const actionButtons = document.createElement('div');
		actionButtons.className = 'ai-input-actions';

		// Attach file button
		const attachButton = document.createElement('button');
		attachButton.className = 'ai-action-button';
		attachButton.title = 'Attach current file';
		attachButton.innerHTML = '<span class="codicon codicon-attach"></span>';
		attachButton.onclick = () => this.attachCurrentFile();

		// Send button
		this.sendButton = document.createElement('button');
		this.sendButton.className = 'ai-send-button';
		this.sendButton.title = 'Send message (Enter)';
		this.sendButton.innerHTML = '<span class="codicon codicon-send"></span>';
		this.sendButton.onclick = () => this.sendMessage();

		actionButtons.appendChild(attachButton);
		actionButtons.appendChild(this.sendButton);

		inputWrapper.appendChild(this.inputField);
		inputWrapper.appendChild(actionButtons);

		this.inputContainer.appendChild(contextIndicator);
		this.inputContainer.appendChild(inputWrapper);

		// Quick actions
		const quickActions = document.createElement('div');
		quickActions.className = 'ai-quick-actions';
		quickActions.innerHTML = `
			<button class="ai-quick-action" data-action="explain">
				<span class="codicon codicon-info"></span> Explain
			</button>
			<button class="ai-quick-action" data-action="improve">
				<span class="codicon codicon-edit"></span> Improve
			</button>
			<button class="ai-quick-action" data-action="fix">
				<span class="codicon codicon-debug"></span> Fix Bug
			</button>
			<button class="ai-quick-action" data-action="test">
				<span class="codicon codicon-beaker"></span> Test
			</button>
		`;

		// Add event listeners to quick actions
		quickActions.querySelectorAll('.ai-quick-action').forEach(button => {
			button.addEventListener('click', (e) => {
				const action = (e.currentTarget as HTMLElement).dataset.action;
				this.handleQuickAction(action!);
			});
		});

		// Assemble chat container
		this.chatContainer.appendChild(header);
		this.chatContainer.appendChild(this.messagesContainer);
		this.chatContainer.appendChild(quickActions);
		this.chatContainer.appendChild(this.inputContainer);

		container.appendChild(this.chatContainer);

		// Clear chat button
		header.querySelector('.ai-action-button')?.addEventListener('click', () => {
			this.clearChat();
		});
	}

	private addWelcomeMessage(): void {
		const welcomeMsg = document.createElement('div');
		welcomeMsg.className = 'ai-message ai-message-assistant ai-welcome';
		welcomeMsg.innerHTML = `
			<div class="ai-message-avatar">
				<span class="codicon codicon-sparkle"></span>
			</div>
			<div class="ai-message-content">
				<div class="ai-message-text">
					<h3>👋 Welcome to AI Assistant!</h3>
					<p>I can help you with:</p>
					<ul>
						<li>📝 Explaining code</li>
						<li>🐛 Finding and fixing bugs</li>
						<li>✨ Improving code quality</li>
						<li>📚 Writing documentation</li>
						<li>🧪 Generating tests</li>
					</ul>
					<p>Select some code and ask me anything!</p>
				</div>
			</div>
		`;
		this.messagesContainer.appendChild(welcomeMsg);
	}

	private async sendMessage(): Promise<void> {
		const text = this.inputField.value.trim();
		if (!text) return;

		// Clear input
		this.inputField.value = '';
		this.inputField.style.height = 'auto';

		// Add user message to UI
		this.addMessage({
			role: 'user',
			content: text,
			timestamp: new Date()
		});

		// Get current editor context
		const editor = this.editorService.activeTextEditorControl;

		if (editor && 'getModel' in editor) {
			const model = (editor as any).getModel();
			const selection = (editor as any).getSelection();

			if (model && selection && !selection.isEmpty()) {
				context = model.getValueInRange(selection);
			}
		}

		// Show typing indicator
		this.showTypingIndicator();

		try {

			// Remove typing indicator
			this.hideTypingIndicator();

			// Response is already added via the event listener
		} catch (error) {
			this.hideTypingIndicator();
			this.addMessage({
				role: 'system',
				content: `Error: ${error.message}`,
				timestamp: new Date()
			});
		}
	}

	private addMessage(message: IAIMessage): void {
		this.messages.push(message);

		const messageEl = document.createElement('div');
		messageEl.className = `ai-message ai-message-${message.role}`;

		// Avatar
		const avatar = document.createElement('div');
		avatar.className = 'ai-message-avatar';
		if (message.role === 'user') {
			avatar.innerHTML = '<span class="codicon codicon-account"></span>';
		} else if (message.role === 'assistant') {
			avatar.innerHTML = '<span class="codicon codicon-sparkle"></span>';
		} else {
			avatar.innerHTML = '<span class="codicon codicon-info"></span>';
		}

		// Content
		const content = document.createElement('div');
		content.className = 'ai-message-content';

		// Text with markdown support
		const text = document.createElement('div');
		text.className = 'ai-message-text';

		// Simple markdown rendering (you can enhance this)
		let formattedContent = message.content
			.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
			.replace(/`([^`]+)`/g, '<code>$1</code>')
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.*?)\*/g, '<em>$1</em>')
			.replace(/\n/g, '<br>');

		text.innerHTML = formattedContent;

		// Timestamp
		const timestamp = document.createElement('div');
		timestamp.className = 'ai-message-timestamp';
		timestamp.textContent = new Date(message.timestamp).toLocaleTimeString();

		content.appendChild(text);
		content.appendChild(timestamp);

		messageEl.appendChild(avatar);
		messageEl.appendChild(content);

		this.messagesContainer.appendChild(messageEl);

		// Scroll to bottom
		this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
	}

	private showTypingIndicator(): void {
		const indicator = document.createElement('div');
		indicator.className = 'ai-message ai-message-assistant ai-typing-indicator';
		indicator.id = 'ai-typing-indicator';
		indicator.innerHTML = `
			<div class="ai-message-avatar">
				<span class="codicon codicon-sparkle"></span>
			</div>
			<div class="ai-message-content">
				<div class="typing-dots">
					<span></span>
					<span></span>
					<span></span>
				</div>
			</div>
		`;
		this.messagesContainer.appendChild(indicator);
		this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
	}

	private hideTypingIndicator(): void {
		const indicator = document.getElementById('ai-typing-indicator');
		if (indicator) {
			indicator.remove();
		}
	}

	private async attachCurrentFile(): Promise<void> {
		const editor = this.editorService.activeTextEditorControl;
		if (!editor || !('getModel' in editor)) {
			return;
		}

		const model = (editor as any).getModel();
		if (model) {
			const fileName = model.uri?.path?.split('/').pop() || 'current file';
			const contextIndicator = this.inputContainer.querySelector('.context-text');
			if (contextIndicator) {
				contextIndicator.textContent = `Context: ${fileName}`;
			}
		}
	}

	private async handleQuickAction(action: string): Promise<void> {
		const editor = this.editorService.activeTextEditorControl;
		if (!editor || !('getModel' in editor)) {
			this.inputField.value = `Please ${action} the code`;
			this.sendMessage();
			return;
		}

		const model = (editor as any).getModel();
		const selection = (editor as any).getSelection();

		if (model && selection && !selection.isEmpty()) {
			this.inputField.value = `Please ${action} the selected code`;
		} else {
			this.inputField.value = `Please ${action} this file`;
		}

		this.sendMessage();
	}

	private clearChat(): void {
		this.messages = [];
		this.messagesContainer.innerHTML = '';
		this.addWelcomeMessage();
	}
}

// Register view container (sidebar icon)
const VIEW_CONTAINER: ViewContainer = Registry.as<IViewContainersRegistry>(ViewExtensions.ViewContainersRegistry).registerViewContainer({
	id: 'aiAssistant',
	title: localize2('aiAssistant.title', 'AI Assistant'),
	icon: Codicon.sparkle,
	order: 2,
	ctorDescriptor: new SyncDescriptor(AIChatViewPane),
	storageId: 'aiAssistantView'
}, ViewContainerLocation.Sidebar);

// Register the view
Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry).registerViews([{
	id: AIChatViewPane.ID,
	name: localize2('aiAssistant.viewName', 'AI Assistant'),
	containerIcon: Codicon.sparkle,
	ctorDescriptor: new SyncDescriptor(AIChatViewPane),
	order: 0,
	weight: 30,
	canToggleVisibility: true,
	canMoveView: true,
	focusCommand: { id: 'aiChat.focus' }
}], VIEW_CONTAINER);
