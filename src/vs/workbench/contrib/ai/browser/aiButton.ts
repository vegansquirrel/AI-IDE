// /home/rishav/ai-ide-workspace/your-ai-ide/src/vs/workbench/contrib/ai/browser/aiButton.ts

import { registerEditorContribution, EditorContributionInstantiation } from '../../../../editor/browser/editorExtensions.js';
import { ICodeEditor } from '../../../../editor/browser/editorBrowser.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IAIService } from '../common/ai.js';
import { INotificationService, Severity } from '../../../../platform/notification/common/notification.js';
import { IQuickInputService, IQuickPickItem } from '../../../../platform/quickinput/common/quickInput.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { IEditorContribution } from '../../../../editor/common/editorCommon.js';

class AIEditorButton extends Disposable implements IEditorContribution {
	static readonly ID = 'editor.contrib.aiButton';

	private button: HTMLElement | null = null;
	private container: HTMLElement | null = null;

	constructor(
		private readonly editor: ICodeEditor,
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@IAIService private readonly aiService: IAIService,
		@INotificationService private readonly notificationService: INotificationService,
		@IQuickInputService private readonly quickInputService: IQuickInputService
	) {
		super();
		this.createButton();

		// Re-create button when editor changes
		this._register(this.editor.onDidChangeModel(() => {
			this.removeButton();
			this.createButton();
		}));
	}

	private createButton(): void {
		const domNode = this.editor.getDomNode();
		if (!domNode) return;

		// Create container for positioning
		this.container = document.createElement('div');
		this.container.className = 'ai-button-container';
		this.container.style.cssText = `
			position: absolute;
			top: 10px;
			right: 60px;
			z-index: 100;
		`;

		// Create button
		this.button = document.createElement('button');
		this.button.className = 'ai-editor-button codicon codicon-sparkle';
		this.button.title = 'AI Assistant (Ctrl+Shift+A)';
		this.button.style.cssText = `
			padding: 6px 12px;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			border: none;
			border-radius: 6px;
			cursor: pointer;
			font-size: 14px;
			font-weight: 500;
			display: flex;
			align-items: center;
			gap: 6px;
			box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
			transition: all 0.3s ease;
		`;

		// Add icon and text
		const icon = document.createElement('span');
		icon.className = 'codicon codicon-sparkle'; // etc
		this.button.appendChild(icon);
		this.button.appendChild(document.createTextNode(' Ask AI'));


		// Hover effect
		this.button.onmouseenter = () => {
			if (this.button) {
				this.button.style.transform = 'translateY(-2px)';
				this.button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.6)';
			}
		};

		this.button.onmouseleave = () => {
			if (this.button) {
				this.button.style.transform = 'translateY(0)';
				this.button.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.4)';
			}
		};

		// Click handler
		this.button.onclick = () => this.handleAIClick();

		this.container.appendChild(this.button);
		domNode.appendChild(this.container);
	}

	private async handleAIClick(): Promise<void> {
		const model = this.editor.getModel();
		if (!model) {
			this.notificationService.warn('No file is open');
			return;
		}

		// Show action menu
		const picks: IQuickPickItem[] = [
			{ label: '$(symbol-method) Explain Code', description: 'Get explanation of selected code' },
			{ label: '$(edit) Improve Code', description: 'Get suggestions to improve the code' },
			{ label: '$(bug) Find Bugs', description: 'Analyze code for potential issues' },
			{ label: '$(book) Add Comments', description: 'Generate documentation comments' },
			{ label: '$(symbol-class) Refactor', description: 'Suggest refactoring improvements' },
			{ label: '$(terminal) Generate Tests', description: 'Create unit tests for the code' }
		];

		const selected = await this.quickInputService.pick(picks, {
			placeHolder: 'Select an AI action for this file'
		});

		if (!selected) return;

		// Get file content or selection
		const selection = this.editor.getSelection();
		let content: string;

		if (selection && !selection.isEmpty()) {
			content = model.getValueInRange(selection);
		} else {
			content = model.getValue();
		}

		// Show processing notification
		const notification = this.notificationService.notify({
			severity: Severity.Info,
			message: `AI is ${selected.label.replace(/\$\([^)]*\) /, '')}...`,
		});

		try {
			// Make API call
			const result = await this.aiService.processFile(content, selected.label);

			// Show result in a new editor or as notification
			if (result.length > 200) {
				// For long responses, open in new editor
				await this.showInNewEditor(result, selected.label);
			} else {
				// For short responses, show as notification
				this.notificationService.info(result);
			}
		} catch (error) {
			this.notificationService.error(`AI Error: ${error.message}`);
		} finally {
			notification.close();
		}
	}

	private async showInNewEditor(content: string, title: string): Promise<void> {
		// This will open the result in a new untitled editor
		await this.instantiationService.invokeFunction(async accessor => {
			const editorService = accessor.get(IEditorService);                                // typed token
			await editorService.openEditor({ contents: content, options: { pinned: true } });
		});
	}

	private removeButton(): void {
		if (this.container && this.container.parentElement) {
			this.container.parentElement.removeChild(this.container);
		}
		this.container = null;
		this.button = null;
	}

	override dispose(): void {
		this.removeButton();
		super.dispose();
	}
}

// Register the editor contribution
registerEditorContribution(AIEditorButton.ID, AIEditorButton, EditorContributionInstantiation.Eager);
