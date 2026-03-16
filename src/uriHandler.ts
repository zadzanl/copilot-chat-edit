import * as vscode from 'vscode';
import { LOG, isAbsolutePath, resolvePathToUri, getWorkspaceRootUri, generateTimestampedFilename } from './utils';
import { coreExport, coreImport } from './core';

function parseQueryParams(query: string): Map<string, string> {
	const params = new Map<string, string>();
	if (!query) { return params; }
	for (const pair of query.split('&')) {
		const eqIdx = pair.indexOf('=');
		if (eqIdx === -1) {
			params.set(decodeURIComponent(pair), '');
		} else {
			params.set(
				decodeURIComponent(pair.slice(0, eqIdx)),
				decodeURIComponent(pair.slice(eqIdx + 1)),
			);
		}
	}
	return params;
}

async function writeCallback(callbackPath: string, data: object): Promise<void> {
	try {
		const uri = vscode.Uri.file(callbackPath);
		const content = new TextEncoder().encode(JSON.stringify(data));
		await vscode.workspace.fs.writeFile(uri, content);
		LOG.info(`Callback written to: ${callbackPath}`);
	} catch (err) {
		LOG.error(`Failed to write callback: ${String(err)}`);
	}
}

export class PorterUriHandler implements vscode.UriHandler {
	async handleUri(uri: vscode.Uri): Promise<void> {
		LOG.info(`URI received: ${uri.toString()}`);
		const action = uri.path.replace(/^\//, '');
		const params = parseQueryParams(uri.query);

		if (action === 'export') {
			await this.handleExport(params);
		} else if (action === 'import') {
			await this.handleImport(params);
		} else {
			LOG.warn(`Unknown URI action: ${action}`);
		}
	}

	private async handleExport(params: Map<string, string>): Promise<void> {
		const callbackPath = params.get('callback');
		if (callbackPath && !isAbsolutePath(callbackPath)) {
			LOG.error('URI export: callback must be an absolute path');
			return;
		}
		try {
			// URI handler is invoked externally — always focus the main chat panel.
			// This means URI export always targets the panel session, not editor tabs.
			await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
			await new Promise(resolve => setTimeout(resolve, 300));

			const outputPathStr = params.get('outputPath');
			const attachmentsDir = params.get('attachmentsDir');

			const outputUri = outputPathStr
				? resolvePathToUri(outputPathStr)
				: vscode.Uri.joinPath(getWorkspaceRootUri(), generateTimestampedFilename());

			const result = await coreExport(outputUri, attachmentsDir || undefined);

			if (callbackPath) {
				await writeCallback(callbackPath, result);
			}
		} catch (err) {
			LOG.error(`URI export failed: ${String(err)}`);
			if (callbackPath) {
				await writeCallback(callbackPath, { success: false, error: String(err) });
			}
		}
	}

	private async handleImport(params: Map<string, string>): Promise<void> {
		const inputPathStr = params.get('inputPath');
		if (!inputPathStr) {
			LOG.error('URI import: inputPath is required');
			return;
		}
		try {
			const inputUri = resolvePathToUri(inputPathStr);
			await coreImport(inputUri);
		} catch (err) {
			LOG.error(`URI import failed: ${String(err)}`);
		}
	}
}
