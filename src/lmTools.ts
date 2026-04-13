import * as vscode from 'vscode';
import { LOG, resolvePathToUri, getWorkspaceRootUri, generateTimestampedFilename } from './utils';
import { coreExport, coreImport, formatExportResult } from './core';

interface ExportToolInput {
	outputPath?: string;
	attachmentsDir?: string;
}

export class ExportChatHistoryTool implements vscode.LanguageModelTool<ExportToolInput> {
	async invoke(
		options: vscode.LanguageModelToolInvocationOptions<ExportToolInput>,
		_token: vscode.CancellationToken,
	): Promise<vscode.LanguageModelToolResult> {
		try {
			const rootUri = getWorkspaceRootUri();

			const outputUri = options.input?.outputPath
				? resolvePathToUri(options.input.outputPath)
				: vscode.Uri.joinPath(rootUri, generateTimestampedFilename());

			const result = await coreExport(outputUri, options.input?.attachmentsDir);

			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart(formatExportResult(result)),
			]);
		} catch (err) {
			LOG.error('[LM Tool] Export failed:', String(err));
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart(`Export failed: ${String(err)}`),
			]);
		}
	}
}

export class ImportChatHistoryTool implements vscode.LanguageModelTool<{ inputPath: string }> {
	async invoke(
		options: vscode.LanguageModelToolInvocationOptions<{ inputPath: string }>,
		_token: vscode.CancellationToken,
	): Promise<vscode.LanguageModelToolResult> {
		LOG.info('Import tool invoked with options:', JSON.stringify(options.input));

		const inputPath = options.input?.inputPath;
		if (!inputPath) {
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart('Error: inputPath is required. Provide the path to a chat history JSON file.'),
			]);
		}

		try {
			const fileUri = resolvePathToUri(inputPath);
			await coreImport(fileUri);

			const relativePath = vscode.workspace.asRelativePath(fileUri);
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart(`Chat session restored from: ${relativePath}. The conversation has been opened in a new chat tab.`),
			]);
		} catch (err) {
			LOG.error('Import failed:', String(err));
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart(`Import failed: ${String(err)}`),
			]);
		}
	}
}
