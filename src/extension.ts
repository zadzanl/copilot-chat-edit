import * as vscode from 'vscode';
import { LOG } from './utils';
import { PorterUriHandler } from './uriHandler';
import { ExportChatHistoryTool, ImportChatHistoryTool } from './lmTools';
import { commandExport, commandImport } from './commands';

export function activate(context: vscode.ExtensionContext) {
	LOG.info('Extension activated');

	context.subscriptions.push(
		vscode.lm.registerTool('exportChatHistory', new ExportChatHistoryTool()),
		vscode.lm.registerTool('importChatHistory', new ImportChatHistoryTool()),
		vscode.window.registerUriHandler(new PorterUriHandler()),
		vscode.commands.registerCommand('copilot-chat-porter.export', commandExport),
		vscode.commands.registerCommand('copilot-chat-porter.import', commandImport),
	);
}

export function deactivate() {}

