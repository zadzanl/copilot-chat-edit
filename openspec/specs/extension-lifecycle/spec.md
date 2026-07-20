## Purpose

Define extension activation, registered entry points, and shared-workflow boundaries.

## Requirements

### Requirement: Extension activates on startup and on URI
The system SHALL activate with the `onStartupFinished` and `onUri` activation events, and SHALL register all extension resources during `activate()`.

#### Scenario: Activation registers all entry points
- **WHEN** the extension host calls `activate()`
- **THEN** two Language Model Tools (`exportChatHistory`, `importChatHistory`), one URI handler (`PorterUriHandler`), and two commands (`copilot-chat-porter.export`, `copilot-chat-porter.import`) are registered and added to `context.subscriptions`

#### Scenario: Deactivation is a no-op
- **WHEN** the extension host calls `deactivate()`
- **THEN** no cleanup is required (all resources are disposed via `context.subscriptions`)

### Requirement: Language Model Tools are callable by the Copilot agent
The system SHALL expose `exportChatHistory` and `importChatHistory` as `vscode.LanguageModelTool` implementations, invokable by Copilot in Agent Mode based on natural language input.

#### Scenario: `exportChatHistory` tool invoked without `outputPath`
- **WHEN** Copilot calls the tool with no `outputPath`
- **THEN** a timestamped filename is auto-generated in the workspace root

#### Scenario: `exportChatHistory` tool error is returned as text
- **WHEN** `coreExport` throws during a tool invocation
- **THEN** the tool returns a `LanguageModelToolResult` with a text part describing the error (not a thrown exception)

#### Scenario: `importChatHistory` tool invoked without `inputPath`
- **WHEN** Copilot calls the tool with no `inputPath`
- **THEN** the tool returns a `LanguageModelToolResult` with the message "Error: inputPath is required. Provide the path to a chat history JSON file."

### Requirement: Extension runs as a workspace-kind extension
The system SHALL declare `"extensionKind": ["workspace"]` so it co-locates with the Copilot Chat extension host in remote and Codespaces environments.

#### Scenario: Extension kind is workspace
- **WHEN** VS Code resolves the extension kind
- **THEN** the extension runs in the workspace host, not the UI host

### Requirement: Shared workflow is distinct from channel presentation
The system SHALL keep shared export/import workflows in `coreExport` and `coreImport`, while LM tools, URI handling, and commands retain channel-specific parameter acquisition and result/error presentation. URI handling SHALL NOT use `formatExportResult`.

#### Scenario: LM Tool delegates to core
- **WHEN** `ExportChatHistoryTool.invoke` is called
- **THEN** it resolves paths and calls `coreExport`; all file I/O, timeout, and attachment logic resides in `core.ts` or `attachments.ts`

#### Scenario: URI Handler delegates to core
- **WHEN** `PorterUriHandler.handleExport` is not aborted for a relative callback
- **THEN** after the focus delay it calls `coreExport` and presents outcomes through callbacks or logs, not `formatExportResult`

#### Scenario: Command delegates to core
- **WHEN** `commandExport` is called
- **THEN** it calls `coreExport` after resolving the dialog result; no business logic is duplicated in `commands.ts`