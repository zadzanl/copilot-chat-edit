You are working on **Copilot Chat Porter**, a VS Code extension that lets GitHub Copilot Chat export and import its own conversation history.

## Tech Stack

- **Language**: TypeScript
- **Runtime**: VS Code Extension Host
- **APIs**: VS Code Extension API (`vscode` namespace), Language Model Tool API (`vscode.lm`)
- **Build**: `tsc` (no bundler)

## Architecture

```
src/
  extension.ts    — Entry point. Registers all components in activate()
  core.ts         — coreExport / coreImport shared logic
  attachments.ts  — URI object detection, file copy with dedup, path rewriting
  uriHandler.ts   — URI Handler for external script invocation
  lmTools.ts      — LM Tool wrappers (ExportChatHistoryTool, ImportChatHistoryTool)
  commands.ts     — Command Palette commands
  utils.ts        — LOG, path resolution, file helpers
```

Three entry points share the same core logic:

- **LM Tools** — AI-invoked via `vscode.lm.registerTool`
- **URI Handler** — External scripts via `code --open-url "vscode://Vizards.copilot-chat-porter/..."`
- **Command Palette** — User-facing `Cmd+Shift+P` commands

`package.json` declares tools under `contributes.languageModelTools` and commands under `contributes.commands`.

## Key Conventions

- Use `vscode.workspace.fs` for all file operations (not Node.js `fs`)
- Use `vscode.Uri.joinPath` for path construction
- Log all operations to the `Copilot Chat Porter` output channel via `LOG` (exported from `utils.ts`)
- Tool results must return `LanguageModelToolResult` with `LanguageModelTextPart`
- All paths exposed to the user should be workspace-relative (use `vscode.workspace.asRelativePath`)
- No `@types/node` — use `TextEncoder`/`TextDecoder`, not `Buffer`

## Path Rules

- `outputPath` / `inputPath`: absolute or relative (base: workspace root)
- `attachmentsDir`: relative only (base: exported JSON's directory), absolute → error
- `callback` (URI Handler export only): absolute only

## When Adding New Tools

1. Define the tool in `package.json` under `contributes.languageModelTools` with proper `inputSchema` and `modelDescription`
2. Implement a class with `vscode.LanguageModelTool<T>` interface in `src/lmTools.ts`
3. Register it in `activate()` in `src/extension.ts` with `vscode.lm.registerTool()`
4. Always include `toolReferenceName` if setting `canBeReferencedInPrompt: true`
