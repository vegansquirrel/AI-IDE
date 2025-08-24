/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// /home/rishav/ai-ide-workspace/your-ai-ide/src/vs/workbench/contrib/ai/browser/aiChatView.ts

import './aiChat.css';
// import { $, append } from '../../../../base/browser/dom.js';
import { ViewPane } from '../../../browser/parts/views/viewPane.js';
import { IViewletViewOptions } from '../../../browser/parts/views/viewsViewlet.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IViewDescriptorService } from '../../../common/views.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IAIService, IAIMessage } from '../common/ai.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';
import { IAccessibleViewInformationService } from '../../../services/accessibility/common/accessibleViewInformationService.js';

export const AI_CHAT_VIEW_ID = 'workbench.view.aiChat';

export class AIChatViewPane extends ViewPane {
	static readonly ID = 'workbench.view.aiChat';
	static readonly TITLE = 'AI Assistant';

	private chatContainer!: HTMLElement;
	private messagesContainer!: HTMLElement;
	private inputContainer!: HTMLElement;
	private inputField!: HTMLTextAreaElement;
	private sendButton!: HTMLButtonElement;
	private messages: IAIMessage[] = [];
	private attachedContext?: string;
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

		const title = document.createElement('div');
		title.className = 'ai-chat-title';
		const titleIcon = document.createElement('span'); titleIcon.className = 'codicon codicon-sparkle';
		const titleText = document.createElement('span'); titleText.textContent = 'AI Assistant';
		title.append(titleIcon, titleText);


		const actions = document.createElement('div');
		actions.className = 'ai-chat-actions';

		const clearBtn = document.createElement('button');
		clearBtn.className = 'ai-action-button';
		clearBtn.title = 'Clear Chat';
		const clearIcon = document.createElement('span');
		clearIcon.className = 'codicon codicon-clear-all';
		clearBtn.appendChild(clearIcon);

		const settingsBtn = document.createElement('button');
		settingsBtn.className = 'ai-action-button';
		settingsBtn.title = 'Settings';
		const settingsIcon = document.createElement('span');
		settingsIcon.className = 'codicon codicon-settings-gear';
		settingsBtn.appendChild(settingsIcon);

		actions.appendChild(clearBtn);
		actions.appendChild(settingsBtn);
		header.appendChild(title);
		header.appendChild(actions);


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
		const ctxIcon = document.createElement('span');
		ctxIcon.className = 'codicon codicon-file';
		const ctxText = document.createElement('span');
		ctxText.className = 'context-text';
		ctxText.textContent = 'No file context';
		contextIndicator.appendChild(ctxIcon);
		contextIndicator.appendChild(ctxText);

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
		attachButton.className = 'ai-action-button'; attachButton.title = 'Attach current file';
		const attachIcon = document.createElement('span'); attachIcon.className = 'codicon codicon-attach';
		attachButton.appendChild(attachIcon);
		attachButton.onclick = () => this.attachCurrentFile();

		// Send button
		this.sendButton = document.createElement('button');
		this.sendButton.className = 'ai-send-button'; this.sendButton.title = 'Send message (Enter)';
		const sendIcon = document.createElement('span'); sendIcon.className = 'codicon codicon-send';
		this.sendButton.appendChild(sendIcon);
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

		const makeQA = (label: string, iconClass: string, action: string) => {
			const b = document.createElement('button');
			b.className = 'ai-quick-action';
			b.dataset.action = action;
			const ic = document.createElement('span');
			ic.className = `codicon ${iconClass}`;
			b.appendChild(ic);
			b.appendChild(document.createTextNode(' ' + label));
			return b;
		};

		quickActions.appendChild(makeQA('Explain', 'codicon-info', 'explain'));
		quickActions.appendChild(makeQA('Improve', 'codicon-edit', 'improve'));
		quickActions.appendChild(makeQA('Fix Bug', 'codicon-debug', 'fix'));
		quickActions.appendChild(makeQA('Test', 'codicon-beaker', 'test'));


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
		const wrap = document.createElement('div');
		wrap.className = 'ai-message ai-message-assistant ai-welcome';

		const avatar = document.createElement('div');
		avatar.className = 'ai-message-avatar';
		const icon = document.createElement('span');
		icon.className = 'codicon codicon-sparkle';
		avatar.appendChild(icon);

		const content = document.createElement('div');
		content.className = 'ai-message-content';

		const text = document.createElement('div');
		text.className = 'ai-message-text';

		const h3 = document.createElement('h3');
		h3.textContent = 'Welcome to Optqo Assistant!';

		const p1 = document.createElement('p');
		p1.textContent = 'I can help you with:';

		const ul = document.createElement('ul');
		['Explaining code', 'Finding and fixing bugs', 'Improving code quality', 'Writing documentation', 'Generating tests']
			.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });

		const p2 = document.createElement('p');
		p2.textContent = 'Select some code and ask me anything!';

		text.appendChild(h3);
		text.appendChild(p1);
		text.appendChild(ul);
		text.appendChild(p2);

		content.appendChild(text);
		wrap.appendChild(avatar);
		wrap.appendChild(content);

		this.messagesContainer.appendChild(wrap);
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

		// Optional editor context (selected text)
		let context: string | undefined;
		const editor = this.editorService.activeTextEditorControl;
		if (editor && 'getModel' in editor) {
			const model = (editor as any).getModel();
			const selection = (editor as any).getSelection();
			if (model && selection && !selection.isEmpty()) {
				context = model.getValueInRange(selection);
			}
		}
		if (!context && this.attachedContext) {          // NEW
			context = this.attachedContext;                // NEW
		}
		// Show typing indicator
		this.showTypingIndicator();

		try {
			//  This actually sends the prompt to the AI service
			await this.aiService.chat(text, context);
		} catch (error: any) {
			this.addMessage({ role: 'system', content: `Error: ${error.message}`, timestamp: new Date() });
		} finally {
			this.hideTypingIndicator();
		}
	}

	private addMessage(message: IAIMessage): void {
		this.messages.push(message);

		const messageEl = document.createElement('div');
		messageEl.className = `ai-message ai-message-${message.role}`;

		// Avatar
		const avatar = document.createElement('div');
		avatar.className = 'ai-message-avatar';
		const avatarIcon = document.createElement('span');
		avatarIcon.className =
			message.role === 'user' ? 'codicon codicon-account' :
				message.role === 'assistant' ? 'codicon codicon-sparkle' :
					'codicon codicon-info';
		avatar.appendChild(avatarIcon);

		// Content
		const content = document.createElement('div');
		content.className = 'ai-message-content';

		// Text with markdown support
		const text = document.createElement('div');
		text.className = 'ai-message-text';
		text.textContent = message.content;

		// Simple markdown rendering (you can enhance this)
		// let formattedContent = message.content
		// 	.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
		// 	.replace(/`([^`]+)`/g, '<code>$1</code>')
		// 	.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
		// 	.replace(/\*(.*?)\*/g, '<em>$1</em>')
		// 	.replace(/\n/g, '<br>');

		// text.innerHTML = formattedContent;

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

		const avatar = document.createElement('div');
		avatar.className = 'ai-message-avatar';
		const icon = document.createElement('span');
		icon.className = 'codicon codicon-sparkle';
		avatar.appendChild(icon);

		const content = document.createElement('div');
		content.className = 'ai-message-content';

		const dots = document.createElement('div');
		dots.className = 'typing-dots';
		dots.appendChild(document.createElement('span'));
		dots.appendChild(document.createElement('span'));
		dots.appendChild(document.createElement('span'));

		content.appendChild(dots);
		indicator.appendChild(avatar);
		indicator.appendChild(content);

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
			this.attachedContext = model.getValue();
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
		while (this.messagesContainer.firstChild) {
			this.messagesContainer.removeChild(this.messagesContainer.firstChild);
		}
		this.addWelcomeMessage();
	}
}
