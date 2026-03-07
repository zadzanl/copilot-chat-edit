import * as vscode from 'vscode';

const LOG = vscode.window.createOutputChannel('Copilot Chat Porter', { log: true });

export function activate(context: vscode.ExtensionContext) {
	LOG.info('Extension activated');
	const exportTool = vscode.lm.registerTool('exportChatHistory', new ExportChatHistoryTool());
	const importTool = vscode.lm.registerTool('importChatHistory', new ImportChatHistoryTool());
	context.subscriptions.push(exportTool, importTool);
}

class ExportChatHistoryTool implements vscode.LanguageModelTool<{ outputPath?: string }> {

	async invoke(
		options: vscode.LanguageModelToolInvocationOptions<{ outputPath?: string }>,
		_token: vscode.CancellationToken
	): Promise<vscode.LanguageModelToolResult> {
		LOG.info('Export tool invoked with options:', JSON.stringify(options.input));

		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			LOG.error('No workspace folders found');
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart('Error: No workspace folder is open.')
			]);
		}

		const rootUri = workspaceFolders[0].uri;

		// Determine output path
		const outputPath = options.input?.outputPath
			? vscode.Uri.joinPath(rootUri, options.input.outputPath)
			: vscode.Uri.joinPath(rootUri, `chat-history-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.json`);

		// Ensure parent directory exists
		const parentDir = vscode.Uri.joinPath(outputPath, '..');
		try {
			await vscode.workspace.fs.createDirectory(parentDir);
		} catch { /* may already exist */ }

		try {
			await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
			await new Promise(resolve => setTimeout(resolve, 300));

			LOG.info('Calling export command...');
			await vscode.commands.executeCommand('workbench.action.chat.export', outputPath);

			// Verify the file was created
			await vscode.workspace.fs.stat(outputPath);
			const relativePath = vscode.workspace.asRelativePath(outputPath);
			LOG.info(`Exported to: ${relativePath}`);

			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart(`Chat history exported successfully to: ${relativePath}`)
			]);
		} catch (err) {
			LOG.error('Export failed:', String(err));
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart(`Export failed: ${String(err)}`)
			]);
		}
	}
}

class ImportChatHistoryTool implements vscode.LanguageModelTool<{ inputPath: string }> {

	async invoke(
		options: vscode.LanguageModelToolInvocationOptions<{ inputPath: string }>,
		_token: vscode.CancellationToken
	): Promise<vscode.LanguageModelToolResult> {
		LOG.info('Import tool invoked with options:', JSON.stringify(options.input));

		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart('Error: No workspace folder is open.')
			]);
		}

		const inputPath = options.input?.inputPath;
		if (!inputPath) {
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart('Error: inputPath is required. Provide the path to a chat history JSON file.')
			]);
		}

		const fileUri = vscode.Uri.joinPath(workspaceFolders[0].uri, inputPath);

		try {
			// Verify file exists
			await vscode.workspace.fs.stat(fileUri);

			LOG.info(`Importing from: ${fileUri.fsPath}`);
			await vscode.commands.executeCommand('workbench.action.chat.import', { inputPath: fileUri });

			const relativePath = vscode.workspace.asRelativePath(fileUri);
			LOG.info(`Import successful: ${relativePath}`);

			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart(`Chat session restored from: ${relativePath}. The conversation has been opened in a new chat tab.`)
			]);
		} catch (err) {
			LOG.error('Import failed:', String(err));
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart(`Import failed: ${String(err)}`)
			]);
		}
	}
}

export function deactivate() {}

