## ADDED Requirements

### Requirement: Export produces a JSON file on disk
The system SHALL invoke VS Code's internal `workbench.action.chat.export` command, targeting the currently active/focused Copilot Chat session, and write the result to the caller-specified output path.

#### Scenario: Export with explicit output path
- **WHEN** a caller supplies `outputPath` (absolute or workspace-relative)
- **THEN** the chat session is exported to that path and the extension confirms the file exists via `workspace.fs.stat` before returning success

#### Scenario: Export with auto-generated filename
- **WHEN** no `outputPath` is supplied
- **THEN** the extension generates a timestamped filename of the form `chat-history-YYYY-MM-DD-HH-MM-SS.json` in the workspace root and exports to that path

#### Scenario: Export to a nested directory
- **WHEN** `outputPath` contains a subdirectory that does not yet exist
- **THEN** the extension creates the parent directory before calling the export command

#### Scenario: Export times out
- **WHEN** `workbench.action.chat.export` does not complete within 15 seconds
- **THEN** the extension rejects with a timeout error and no partial file is reported as success

#### Scenario: Exported file is not created
- **WHEN** `workbench.action.chat.export` resolves but `workspace.fs.stat` rejects because the file is missing
- **THEN** the extension propagates that stat rejection immediately

#### Scenario: Exported file stat hangs
- **WHEN** `workbench.action.chat.export` resolves but `workspace.fs.stat` does not settle within 5 seconds
- **THEN** the extension rejects with a stat-timeout error

### Requirement: Output path supports absolute and workspace-relative forms
The system SHALL resolve an `outputPath` according to the authoritative rules in `path-resolution`.

#### Scenario: Absolute path in local workspace
- **WHEN** `outputPath` is `/home/user/exports/chat.json`
- **THEN** the path is resolved using the first workspace URI's scheme

#### Scenario: Relative path
- **WHEN** `outputPath` is `exports/chat.json`
- **THEN** the file is resolved relative to the first workspace folder
