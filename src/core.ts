import * as vscode from 'vscode';
import { LOG, isAbsolutePath, ensureParentDir } from './utils';
import { AttachmentMapping, processAttachments } from './attachments';

export interface ExportResult {
	success: boolean;
	outputPath?: string;
	attachments?: AttachmentMapping[];
	error?: string;
}

export async function coreExport(outputUri: vscode.Uri, attachmentsDir?: string): Promise<ExportResult> {
	LOG.info(`coreExport: outputUri=${outputUri.fsPath}, attachmentsDir=${attachmentsDir ?? '(none)'}`);

	if (attachmentsDir && isAbsolutePath(attachmentsDir)) {
		throw new Error('attachmentsDir must be a relative path (resolved from the exported JSON file\'s directory). Absolute paths are not allowed.');
	}

	await ensureParentDir(outputUri);

	LOG.info('Calling workbench.action.chat.export...');
	await vscode.commands.executeCommand('workbench.action.chat.export', outputUri);
	await vscode.workspace.fs.stat(outputUri);

	let mappings: AttachmentMapping[] = [];

	if (attachmentsDir) {
		const rawBytes = await vscode.workspace.fs.readFile(outputUri);
		let jsonStr = new TextDecoder().decode(rawBytes);

		const result = await processAttachments(jsonStr, outputUri, attachmentsDir);
		jsonStr = result.jsonStr;
		mappings = result.mappings;

		if (mappings.length > 0) {
			await vscode.workspace.fs.writeFile(outputUri, new TextEncoder().encode(jsonStr));
		}
	}

	const relativePath = vscode.workspace.asRelativePath(outputUri);
	LOG.info(`Export complete: ${relativePath}`);

	return {
		success: true,
		outputPath: outputUri.fsPath,
		attachments: mappings.length > 0 ? mappings : undefined,
	};
}

export async function coreImport(inputUri: vscode.Uri): Promise<void> {
	LOG.info(`coreImport: inputUri=${inputUri.fsPath}`);

	await vscode.workspace.fs.stat(inputUri);
	await vscode.commands.executeCommand('workbench.action.chat.import', { inputPath: inputUri });

	LOG.info(`Import complete: ${vscode.workspace.asRelativePath(inputUri)}`);
}

export function formatExportResult(result: ExportResult): string {
	const relPath = vscode.workspace.asRelativePath(vscode.Uri.file(result.outputPath!));
	const lines = [`Chat history exported successfully to: ${relPath}`];
	if (result.attachments && result.attachments.length > 0) {
		lines.push('Attachments synced:');
		for (const a of result.attachments) {
			lines.push(`  ${a.from} → ${a.to}`);
		}
	}
	return lines.join('\n');
}
