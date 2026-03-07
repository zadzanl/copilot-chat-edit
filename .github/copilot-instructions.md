You are working on **Copilot Chat Porter**, a VS Code extension that lets GitHub Copilot Chat export and import its own conversation history.

## Tech Stack

- **Language**: TypeScript
- **Runtime**: VS Code Extension Host
- **APIs**: VS Code Extension API (`vscode` namespace), Language Model Tool API (`vscode.lm`)
- **Build**: `tsc` (no bundler)

## Architecture

- `src/extension.ts` — Single entry point. Registers two Language Model Tools:
  - `exportChatHistory` — Exports the current chat session to a JSON file via `workbench.action.chat.export`
  - `importChatHistory` — Restores a session from a JSON file via `workbench.action.chat.import`
- `package.json` — Declares tools under `contributes.languageModelTools`

## Key Conventions

- Use `vscode.workspace.fs` for all file operations (not Node.js `fs`)
- Use `vscode.Uri.joinPath` for path construction
- Log all operations to the `Copilot Chat Porter` output channel via `LOG`
- Tool results must return `LanguageModelToolResult` with `LanguageModelTextPart`
- All paths exposed to the user should be workspace-relative (use `vscode.workspace.asRelativePath`)

## When Adding New Tools

1. Define the tool in `package.json` under `contributes.languageModelTools` with proper `inputSchema` and `modelDescription`
2. Implement a class with `vscode.LanguageModelTool<T>` interface in `extension.ts`
3. Register it in `activate()` with `vscode.lm.registerTool()`
4. Always include `toolReferenceName` if setting `canBeReferencedInPrompt: true`
