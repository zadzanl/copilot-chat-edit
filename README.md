# Copilot Chat Porter

[![Install in VS Code](https://img.shields.io/badge/VS%20Code-Install%20Extension-blue?logo=visualstudiocode&style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=Vizards.copilot-chat-porter)
[![Version](https://vsmarketplacebadges.dev/version-short/Vizards.copilot-chat-porter.svg?style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=Vizards.copilot-chat-porter)
[![Installs](https://vsmarketplacebadges.dev/installs-short/Vizards.copilot-chat-porter.svg?style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=Vizards.copilot-chat-porter)

A VS Code extension that enables GitHub Copilot Chat to export and import its own conversation history via:

- [Language Model Tools](https://code.visualstudio.com/api/extension-guides/ai/tools)
- URI Handler
- Command Palette

## Features

### Export Chat History

The AI agent can export the current chat session as a JSON file to the workspace — just ask in natural language:

- *"把对话导出到 history/session1.json"*
- *"Export this conversation to exports/today.json"*
- *"保存当前对话"* (auto-generates a timestamped filename)

### Import Chat History

Restore a previously exported session and continue the conversation:

- *"从 history/session1.json 恢复之前的对话"*
- *"Load the chat from exports/today.json"*

The restored session opens in a new chat tab with full history.

### Attachment Saving

Optionally copy externally-referenced files (outside the workspace) alongside the exported JSON, making the export self-contained and portable:

- *"导出对话并把附件保存到 attachments 目录"*
- *"Export with attachments to the assets folder"*

Files are deduplicated by content — identical files are skipped, and name conflicts get a numeric suffix (`report-1.pdf`). All file paths in the JSON are automatically rewritten to point to the local copies.

### External Script Access (URI Handler)

Trigger export/import from shell scripts, Copilot Hooks, or any external process:

```bash
# Export
code --open-url "vscode://Vizards.copilot-chat-porter/export?outputPath=exports/chat.json&attachmentsDir=attachments"

# Import
code --open-url "vscode://Vizards.copilot-chat-porter/import?inputPath=exports/chat.json"
```

For synchronous result feedback, pass a `callback` parameter pointing to a Named Pipe:

```bash
PIPE=$(mktemp -u /tmp/porter-XXXXX.pipe)
mkfifo "$PIPE"
code --open-url "vscode://Vizards.copilot-chat-porter/export?outputPath=exports/chat.json&callback=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$PIPE'))")"
RESULT=$(timeout 30 cat "$PIPE")
rm -f "$PIPE"
```

### Command Palette

Export and import directly via `Cmd+Shift+P`:

- **Copilot Chat Porter: Export Chat History** — save dialog + optional attachments directory
- **Copilot Chat Porter: Import Chat History** — open dialog to select a JSON file

### What's in the exported JSON?

| Included | Not Included |
|----------|--------------|
| All user messages (raw text) | Detailed tool call I/O |
| AI responses (including thinking) | Per-turn token usage |
| File references and variables | Raw LLM prompts |
| Agent and model info | Debug-level logs |
| Timestamps | |
| Edited file events | |

## Requirements

- VS Code `>= 1.99.0`
- GitHub Copilot Chat extension

## Usage

### Via AI (recommended)

Simply tell Copilot in Agent Mode to export or import:

```
User: Save our conversation to history/chat.json
Agent: (calls exportChatHistory tool) → Done ✅

User: Restore the session from history/chat.json
Agent: (calls importChatHistory tool) → Opened in new tab ✅

User: Export and save all attachments to the assets folder
Agent: (calls exportChatHistory with attachmentsDir) → Done ✅
```

You can also reference the tools explicitly with `#exportChatHistory` or `#importChatHistory` in the chat input.

### Via Command Palette

- `Cmd+Shift+P` → **"Copilot Chat Porter: Export Chat History"**
- `Cmd+Shift+P` → **"Copilot Chat Porter: Import Chat History"**

### Via External Scripts

Use the URI Handler to integrate with Copilot Hooks or automation scripts. See [External Script Access](#external-script-access-uri-handler) above.

## Path Rules

| Parameter | Absolute | Relative | Base |
|-----------|----------|----------|------|
| `outputPath` | ✅ | ✅ | Workspace root |
| `inputPath` | ✅ | ✅ | Workspace root |
| `attachmentsDir` | ❌ (error) | ✅ | Exported JSON's directory |
| `callback` | ✅ | ❌ | — |

## Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode
npm run watch
```

Press **F5** in VS Code to launch the Extension Development Host for debugging.

## How It Works

The extension provides three entry points that share the same core export/import logic:

1. **Language Model Tools** — Two tools (`exportChatHistory`, `importChatHistory`) registered via `vscode.lm.registerTool`, invoked by Copilot's agent automatically based on natural language input.
2. **URI Handler** — Listens for `vscode://Vizards.copilot-chat-porter/<action>?<params>`, enabling external scripts to trigger operations via `code --open-url`.
3. **Command Palette** — Standard VS Code commands with file dialogs for manual use.

Under the hood, export calls VS Code's internal `workbench.action.chat.export` command, and import calls `workbench.action.chat.import`. When `attachmentsDir` is provided, the extension scans the exported JSON for file URI objects (`$mid` + `scheme: "file"`), copies external files into the specified directory with deduplication, and rewrites all path references in the JSON via string replacement.

## License

MIT
