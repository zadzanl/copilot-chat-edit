## ADDED Requirements

### Requirement: URI handler responds to export and import actions
The system SHALL register a `vscode.UriHandler` that dispatches `export` or `import` based on the URI path and logs an unknown action.

#### Scenario: Export triggered via URI
- **WHEN** VS Code receives `vscode://Vizards.copilot-chat-porter/export?outputPath=<path>&attachmentsDir=<dir>`
- **THEN** the handler focuses the chat panel, waits 300 ms, and calls `coreExport` with the resolved parameters

#### Scenario: Import triggered via URI
- **WHEN** VS Code receives `vscode://Vizards.copilot-chat-porter/import?inputPath=<path>`
- **THEN** the handler calls `coreImport` with the resolved path

#### Scenario: Unknown action
- **WHEN** the URI path segment is neither `export` nor `import`
- **THEN** the handler logs a warning and takes no action

### Requirement: URI export pre-focuses the Copilot Chat panel
Before executing the export, the system SHALL execute `workbench.panel.chat.view.copilot.focus` and wait 300 ms to allow focus to settle.

#### Scenario: Focus delay on external trigger
- **WHEN** a URI export is triggered from an external script
- **THEN** the chat panel is focused and the extension waits 300 ms before calling the export command

### Requirement: URI export callbacks are optional and best effort
The system SHALL accept a `callback` query parameter for export only. If its path is lexically absolute, it SHALL attempt to write result JSON after export success or failure; callback write failures are logged and swallowed.

#### Scenario: Callback written on success
- **WHEN** `callback` is an absolute path to a Named Pipe or file and export succeeds
- **THEN** `{ success: true, outputPath: "...", attachments: [...] }` is written to the callback path

#### Scenario: Callback written on failure
- **WHEN** export fails and `callback` is provided
- **THEN** `{ success: false, error: "<message>" }` is written to the callback path

#### Scenario: Non-absolute callback logs and aborts
- **WHEN** `callback` is a relative path
- **THEN** the handler logs an error and returns before focus or `coreExport`

#### Scenario: URI error without callback
- **WHEN** URI export or import fails without an available export callback
- **THEN** the handler logs the error without showing a notification or formatted export result

### Requirement: URI query parameters are URL-decoded
The system SHALL parse the URI query string by splitting on `&`, splitting each pair at its first `=`, and URL-decoding key and value without translating `+` to a space.

#### Scenario: Encoded path in query
- **WHEN** `outputPath` contains URL-encoded characters (e.g., `%2F` for `/`)
- **THEN** the decoded path is used for file resolution

#### Scenario: Plus sign in query
- **WHEN** a URI query value contains `+`
- **THEN** the parsed value retains `+` rather than translating it to a space
