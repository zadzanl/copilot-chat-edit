import * as vscode from 'vscode';
import { LOG, fileExists } from './utils';

export interface AttachmentMapping {
	from: string;
	to: string;
}

interface UriObject {
	$mid: number;
	scheme: string;
	fsPath?: string;
	path?: string;
	[key: string]: unknown;
}

function isFileUriObject(obj: unknown): obj is UriObject {
	return (
		typeof obj === 'object' && obj !== null &&
		'$mid' in obj && 'scheme' in obj &&
		(obj as UriObject).scheme === 'file'
	);
}

/** Recursively find all file URI objects in the parsed JSON. */
function findFileUriObjects(data: unknown): UriObject[] {
	const results: UriObject[] = [];

	function walk(node: unknown): void {
		if (Array.isArray(node)) {
			for (const item of node) { walk(item); }
			return;
		}
		if (typeof node === 'object' && node !== null) {
			if (isFileUriObject(node)) {
				results.push(node as UriObject);
			}
			for (const val of Object.values(node as Record<string, unknown>)) {
				walk(val);
			}
		}
	}

	walk(data);
	return results;
}

/** Extract the absolute file path from a URI object. */
function extractPathFromUriObject(obj: UriObject): string | undefined {
	return obj.fsPath ?? obj.path;
}

/** Check whether a file path is outside all workspace folders. */
function isExternalPath(filePath: string): boolean {
	const folders = vscode.workspace.workspaceFolders;
	if (!folders) { return true; }
	const normalized = filePath.replace(/\\/g, '/');
	for (const folder of folders) {
		const folderPath = folder.uri.fsPath.replace(/\\/g, '/');
		if (normalized.startsWith(folderPath + '/') || normalized === folderPath) {
			return false;
		}
	}
	return true;
}

/** Compare two files by content. */
async function filesAreEqual(a: vscode.Uri, b: vscode.Uri): Promise<boolean> {
	try {
		const [contentA, contentB] = await Promise.all([
			vscode.workspace.fs.readFile(a),
			vscode.workspace.fs.readFile(b),
		]);
		if (contentA.byteLength !== contentB.byteLength) { return false; }
		for (let i = 0; i < contentA.byteLength; i++) {
			if (contentA[i] !== contentB[i]) { return false; }
		}
		return true;
	} catch {
		return false;
	}
}

/** Split filename into name and extension. */
function splitFilename(filename: string): { name: string; ext: string } {
	const dotIdx = filename.lastIndexOf('.');
	if (dotIdx <= 0) { return { name: filename, ext: '' }; }
	return { name: filename.slice(0, dotIdx), ext: filename.slice(dotIdx) };
}

/**
 * Copy external attachments into attachmentsDir and return the mappings.
 * Handles deduplication: same name + same content → skip; same name + different content → add suffix.
 */
async function copyAttachments(
	externalPaths: string[],
	attachmentsDirUri: vscode.Uri,
): Promise<AttachmentMapping[]> {
	await vscode.workspace.fs.createDirectory(attachmentsDirUri);

	const mappings: AttachmentMapping[] = [];
	const usedNames = new Map<string, vscode.Uri>(); // filename → target Uri

	for (const srcPath of externalPaths) {
		const srcUri = vscode.Uri.file(srcPath);

		if (!(await fileExists(srcUri))) {
			LOG.warn(`Attachment not found, skipping: ${srcPath}`);
			continue;
		}

		const originalFilename = srcPath.split('/').pop() ?? srcPath.split('\\').pop() ?? 'attachment';
		let targetFilename = originalFilename;
		let targetUri = vscode.Uri.joinPath(attachmentsDirUri, targetFilename);

		// Deduplication: check base name first, then search suffixed names
		const baseConflict =
			usedNames.has(targetFilename)
				? await filesAreEqual(srcUri, usedNames.get(targetFilename)!)
					? 'same' : 'different'
			: await fileExists(targetUri)
				? await filesAreEqual(srcUri, targetUri)
					? 'same' : 'different'
			: 'none';

		if (baseConflict === 'same') {
			if (!usedNames.has(targetFilename)) { usedNames.set(targetFilename, targetUri); }
			mappings.push({ from: srcPath, to: (usedNames.get(targetFilename) ?? targetUri).fsPath });
			continue;
		}

		if (baseConflict === 'different') {
			// Search suffixed names: reuse if content matches, skip if different, use if free
			const { name, ext } = splitFilename(originalFilename);
			let suffix = 1;
			let reused = false;
			while (true) {
				targetFilename = `${name}-${suffix}${ext}`;
				targetUri = vscode.Uri.joinPath(attachmentsDirUri, targetFilename);
				if (usedNames.has(targetFilename)) {
					if (await filesAreEqual(srcUri, usedNames.get(targetFilename)!)) {
						mappings.push({ from: srcPath, to: usedNames.get(targetFilename)!.fsPath });
						reused = true;
						break;
					}
				} else if (await fileExists(targetUri)) {
					if (await filesAreEqual(srcUri, targetUri)) {
						usedNames.set(targetFilename, targetUri);
						mappings.push({ from: srcPath, to: targetUri.fsPath });
						reused = true;
						break;
					}
				} else {
					break; // Free slot
				}
				suffix++;
			}
			if (reused) { continue; }
		}

		await vscode.workspace.fs.copy(srcUri, targetUri, { overwrite: false });
		usedNames.set(targetFilename, targetUri);
		mappings.push({ from: srcPath, to: targetUri.fsPath });
		LOG.info(`Copied attachment: ${srcPath} → ${targetUri.fsPath}`);
	}

	return mappings;
}

/** Build path and URI replacement pairs, then replaceAll on the JSON string. */
function rewritePaths(jsonStr: string, mappings: AttachmentMapping[]): string {
	let result = jsonStr;
	for (const { from, to } of mappings) {
		if (from === to) { continue; }

		// Replace absolute path strings (forward slash normalized)
		const fromNormalized = from.replace(/\\/g, '/');
		const toNormalized = to.replace(/\\/g, '/');
		result = result.replaceAll(fromNormalized, toNormalized);

		// Replace backslash-escaped paths (as they appear in JSON string values)
		const fromEscaped = from.replace(/\\/g, '\\\\').replace(/\//g, '\\/');
		const toEscaped = to.replace(/\\/g, '\\\\').replace(/\//g, '\\/');
		if (fromEscaped !== fromNormalized) {
			result = result.replaceAll(fromEscaped, toEscaped);
		}

		// Replace file:// URI form (use vscode.Uri for correct encoding)
		const fromFileUri = vscode.Uri.file(from).toString();
		const toFileUri = vscode.Uri.file(to).toString();
		result = result.replaceAll(fromFileUri, toFileUri);
	}
	return result;
}

/**
 * Discover external file references in exported JSON and collect them into attachmentsDir.
 * Returns the mappings and the (possibly rewritten) JSON string.
 */
export async function processAttachments(
	jsonStr: string,
	outputUri: vscode.Uri,
	attachmentsDir: string,
): Promise<{ jsonStr: string; mappings: AttachmentMapping[] }> {
	const attachmentsDirUri = vscode.Uri.joinPath(outputUri, '..', attachmentsDir);
	const parsed = JSON.parse(jsonStr);

	const uriObjects = findFileUriObjects(parsed);
	const externalPaths = new Set<string>();

	for (const obj of uriObjects) {
		const filePath = extractPathFromUriObject(obj);
		if (filePath && isExternalPath(filePath)) {
			externalPaths.add(filePath);
		}
	}

	if (externalPaths.size === 0) {
		LOG.info('No external file references found');
		return { jsonStr, mappings: [] };
	}

	LOG.info(`Found ${externalPaths.size} external file reference(s)`);
	const mappings = await copyAttachments([...externalPaths], attachmentsDirUri);

	if (mappings.length > 0) {
		jsonStr = rewritePaths(jsonStr, mappings);
		LOG.info('Paths rewritten in exported JSON');
	}

	return { jsonStr, mappings };
}
