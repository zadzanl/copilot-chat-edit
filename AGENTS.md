# Copilot Chat Porter Guide

## Purpose and authority

- This is a VS Code workspace extension that ports Copilot Chat history.
- Runtime source and `package.json` define implemented behavior.
- The seven contracts in [`openspec/specs/`](openspec/specs/) define approved behavior.
- [`.github/copilot-instructions.md`](.github/copilot-instructions.md) defines Copilot-specific conventions.
- The dated [orientation archive](openspec/changes/archive/2026-07-20-codebase-orientation/) explains history and trade-offs.
- When these disagree, preserve runtime behavior and update the appropriate living contract through OpenSpec.

## Architecture map

- `extension.ts` registers every entry point during `activate()`.
- LM tools in `lmTools.ts`, URI handling in `uriHandler.ts`, and Command Palette flows in `commands.ts` delegate to `core.ts`.
- `core.ts` owns the shared `coreExport` and `coreImport` workflows.
- `attachments.ts` discovers file URI objects, copies external files, deduplicates, and rewrites exports.
- `utils.ts` owns `LOG`, workspace-aware paths, timestamps, filesystem helpers, and timeouts.
- Keep channel input and presentation in its adapter. Keep shared workflow behavior in `core.ts`.

## Change placement

- Add activation and registrations in `extension.ts`.
- Add LM tool input/result adapters in `lmTools.ts`.
- Add URI query parsing, callbacks, and URI-specific behavior in `uriHandler.ts`.
- Add dialogs and notifications in `commands.ts`.
- Add export/import mechanics in `core.ts`.
- Add attachment scanning, copying, equality checks, and replacements in `attachments.ts`.
- Add shared path, logging, and low-level helpers in `utils.ts`.

## Essential invariants

- Use `vscode.workspace.fs` for file operations and `vscode.Uri` APIs for paths.
- Do not use Node `fs`, `Buffer`, or `@types/node`; use `TextEncoder` and `TextDecoder`.
- Relative `outputPath` and `inputPath` use the first workspace folder as their base.
- A lexical absolute path preserves the first workspace URI scheme, including remote schemes.
- `attachmentsDir` is relative to the exported JSON directory. Lexical absolute values reject before export.
- `attachmentsDir` values containing `..` are accepted; they are not containment-checked.
- URI callbacks are export-only and must be lexical absolute paths.
- A relative URI export callback logs and aborts before focus or export begins.
- URI export focuses the chat panel, then waits a fixed 300 ms. This is not a readiness guarantee.
- Export gives the internal command 15 seconds, then gives output `stat` 5 seconds.
- Import directly awaits its internal command; it has no extension-side timeout.
- Both internal chat commands are undocumented. Do not claim import UI outcomes.
- Attachment deduplication compares complete file bytes, not hashes.
- Attachment rewrite uses raw string replacement for normalized paths, escaped paths, and `file://` URIs.
- LM tools and Command Palette export use `formatExportResult`; URI export does not.

## Adding an LM tool

1. Add a `contributes.languageModelTools` entry in `package.json` with schema and model description.
2. Implement the `vscode.LanguageModelTool<T>` class in `lmTools.ts`.
3. Register the tool with `vscode.lm.registerTool()` in `extension.ts`.
4. Set `toolReferenceName` when `canBeReferencedInPrompt` is `true`.

## Build and verification

- Run `npm run compile` for a one-time TypeScript build.
- Run `npm run watch` while developing.
- Run `npm run package` to produce the VSIX in `dist/`.
- Run `openspec validate --specs --strict` after contract changes.
- No automated test suite exists. Use F5 Extension Development Host for manual behavior checks.

## Change discipline

- Update a living spec when observable behavior changes.
- Preserve the channel/core split; do not duplicate workflow logic in adapters.
- Log operational events and failures through `LOG`.
- Report user-facing paths with `vscode.workspace.asRelativePath`.
- Keep undocumented-command claims conservative, especially for import.
- Consult the linked instructions, [living specs](openspec/specs/), and [archive](openspec/changes/archive/2026-07-20-codebase-orientation/) before changing boundary behavior.