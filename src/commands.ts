import * as vscode from 'vscode';
import { getWorkspaceRootUri, generateTimestampedFilename } from './utils';
import { coreExport, coreImport, formatExportResult } from './core';

export async function commandExport(): Promise<void> {
	const defaultUri = vscode.Uri.joinPath(getWorkspaceRootUri(), generateTimestampedFilename());

	const outputUri = await vscode.window.showSaveDialog({
		defaultUri,
		filters: { 'JSON Files': ['json'] },
		title: 'Export Chat History',
	});
	if (!outputUri) { return; }

	const attachmentsDir = await vscode.window.showInputBox({
		prompt: 'Attachments directory (relative to exported file, leave empty to skip)',
		placeHolder: 'e.g. attachments',
	});
	if (attachmentsDir === undefined) { return; } // cancelled

	try {
		const result = await coreExport(outputUri, attachmentsDir || undefined);
		vscode.window.showInformationMessage(formatExportResult(result));
	} catch (err) {
		vscode.window.showErrorMessage(`Export failed: ${String(err)}`);
	}
}

export async function commandImport(): Promise<void> {
	const uris = await vscode.window.showOpenDialog({
		canSelectMany: false,
		filters: { 'JSON Files': ['json'] },
		title: 'Import Chat History',
	});
	if (!uris || uris.length === 0) { return; }

	try {
		await coreImport(uris[0]);
		vscode.window.showInformationMessage(`Chat session restored from: ${vscode.workspace.asRelativePath(uris[0])}`);
	} catch (err) {
		vscode.window.showErrorMessage(`Import failed: ${String(err)}`);
	}
}
