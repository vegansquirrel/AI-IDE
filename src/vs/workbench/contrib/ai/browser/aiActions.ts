// /home/rishav/ai-ide-workspace/your-ai-ide/src/vs/workbench/contrib/ai/browser/aiActions.ts

import { registerAction2, Action2 } from '../../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { KeyCode, KeyMod } from '../../../../base/common/keyCodes.js';
import { KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { IViewsService } from '../../../services/views/common/viewsService.js';   // NEW
import { localize } from '../../../../nls.js';

class FocusAIChatAction extends Action2 {
	static readonly ID = 'aiChat.focus';

	constructor() {
		super({
			id: FocusAIChatAction.ID,
			title: { value: localize('ai.focusChat', "Focus AI Chat"), original: "Focus AI Chat" },           // ICommandActionTitle
			category: { value: localize('ai.category', "AI"), original: "AI" },
			f1: true,
			keybinding: {
				weight: KeybindingWeight.WorkbenchContrib,
				primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyI
			}
		});
	}

	run(accessor: ServicesAccessor): void {
		// Focus the AI chat panel
		const viewsService = accessor.get(IViewsService);
		viewsService.openView('workbench.panel.aiChat', true);
	}
}

registerAction2(FocusAIChatAction);
