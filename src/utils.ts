import * as vscode from 'vscode';

export const LOG = vscode.window.createOutputChannel('Copilot Chat Porter', { log: true });

export function isAbsolutePath(p: string): boolean {
	return p.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(p);
}

export function getWorkspaceRootUri(): vscode.Uri {
	const folders = vscode.workspace.workspaceFolders;
	if (!folders || folders.length === 0) {
		throw new Error('No workspace folder is open.');
	}
	return folders[0].uri;
}

/** Resolve a user-supplied path (absolute or relative to workspace root) to a Uri. */
export function resolvePathToUri(pathStr: string): vscode.Uri {
	if (isAbsolutePath(pathStr)) {
		// Preserve the workspace URI scheme (e.g., vscode-remote://) for remote environments
		return getWorkspaceRootUri().with({ path: pathStr });
	}
	return vscode.Uri.joinPath(getWorkspaceRootUri(), pathStr);
}

export function generateTimestampedFilename(): string {
	return `chat-history-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.json`;
}

export async function ensureParentDir(uri: vscode.Uri): Promise<void> {
	const parentDir = vscode.Uri.joinPath(uri, '..');
	try {
		await vscode.workspace.fs.createDirectory(parentDir);
	} catch { /* may already exist */ }
}

export async function fileExists(uri: vscode.Uri): Promise<boolean> {
	try {
		await vscode.workspace.fs.stat(uri);
		return true;
	} catch {
		return false;
	}
}

/** Race a promise against a timeout. */
export function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
	let timer: ReturnType<typeof setTimeout>;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
	});
	return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer!));
}
