## ADDED Requirements

### Requirement: Import restores a chat session from a JSON file
The system SHALL accept a path to a previously exported chat JSON file, stat its URI, and invoke VS Code's undocumented internal `workbench.action.chat.import` command with that URI.

#### Scenario: Import with a valid file path
- **WHEN** a caller supplies `inputPath` pointing to an existing `.json` file
- **THEN** the extension verifies the file exists via `workspace.fs.stat`, invokes the import command, and reports success

#### Scenario: Import with a missing file
- **WHEN** `inputPath` points to a file that does not exist
- **THEN** `workspace.fs.stat` throws and the extension propagates the error to the caller

#### Scenario: Internal import command resolves
- **WHEN** the input stat and internal import command both resolve
- **THEN** core import completes without asserting a resulting VS Code chat UI state

#### Scenario: Internal import command remains unsettled
- **WHEN** the input stat succeeds and the internal import command remains unsettled
- **THEN** core import directly awaits the command without an extension-side timeout

#### Scenario: LM adapter presents an import success message
- **WHEN** `coreImport` resolves during a Language Model Tool invocation
- **THEN** the adapter returns `Chat session restored from: ${relativePath}. The conversation has been opened in a new chat tab.` as presentation behavior, without treating that text as proof or a guarantee of VS Code UI state

### Requirement: `inputPath` supports absolute and workspace-relative forms
The system SHALL resolve `inputPath` using the authoritative rules in `path-resolution`.

#### Scenario: Relative input path
- **WHEN** `inputPath` is `history/session1.json`
- **THEN** it is resolved relative to the first workspace folder before the import command is invoked

#### Scenario: `inputPath` is required
- **WHEN** `inputPath` is absent or empty (Language Model Tool invocation)
- **THEN** the tool returns: "Error: inputPath is required. Provide the path to a chat history JSON file."
