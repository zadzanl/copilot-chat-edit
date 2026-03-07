# Copilot Chat Porter

[![Install in VS Code](https://img.shields.io/badge/VS%20Code-Install%20Extension-blue?logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=Vizards.copilot-chat-porter)
[![Version](https://img.shields.io/visual-studio-marketplace/v/Vizards.copilot-chat-porter)](https://marketplace.visualstudio.com/items?itemName=Vizards.copilot-chat-porter)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/Vizards.copilot-chat-porter)](https://marketplace.visualstudio.com/items?itemName=Vizards.copilot-chat-porter)

A VS Code extension that enables GitHub Copilot Chat to export and import its own conversation history via [Language Model Tools](https://code.visualstudio.com/api/extension-guides/ai/tools).

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
```

You can also reference the tools explicitly with `#exportChatHistory` or `#importChatHistory` in the chat input.

### Via Command Palette

The built-in VS Code commands also work independently:

- `Cmd+Shift+P` → **"Export Chat..."** — save to any location
- `Cmd+Shift+P` → **"Import Chat..."** — restore from a file

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

The extension registers two [Language Model Tools](https://code.visualstudio.com/api/extension-guides/ai/tools) that Copilot's agent can invoke automatically:

1. **`exportChatHistory`** — Calls VS Code's internal `workbench.action.chat.export` command with a workspace-relative path, bypassing the file dialog.
2. **`importChatHistory`** — Calls `workbench.action.chat.import` to restore a session from a JSON file into a new chat tab.

The AI model reads each tool's `inputSchema` to understand the parameters, and extracts values from the user's natural language input (e.g., *"save to exports/today.json"* → `{ outputPath: "exports/today.json" }`).

## License

MIT
