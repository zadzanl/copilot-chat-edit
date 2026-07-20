## Purpose

Provide Command Palette workflows for exporting and importing chat history.

## Requirements

### Requirement: Command palette export uses a save-file dialog
The system SHALL provide a VS Code command `copilot-chat-porter.export` that opens a native save-file dialog defaulting to a timestamped filename in the workspace root, then prompts for an optional `attachmentsDir`, and calls `coreExport`.

#### Scenario: User completes the export dialog
- **WHEN** the user selects an output path and submits a non-empty or empty `attachmentsDir`
- **THEN** `coreExport` is called, using `undefined` for an accepted empty string, and the result is shown in an information message

#### Scenario: User cancels the save dialog
- **WHEN** the user dismisses the save-file dialog without selecting a path
- **THEN** no export occurs and the command silently returns

#### Scenario: User cancels the attachments input box
- **WHEN** the user presses Escape on the `attachmentsDir` input box (returns `undefined`)
- **THEN** no export occurs (the command treats `undefined` as cancelled, not as "no attachments")

#### Scenario: Export error is surfaced
- **WHEN** `coreExport` throws
- **THEN** the error is shown in a VS Code error message notification

### Requirement: Command palette import uses an open-file dialog
The system SHALL provide a VS Code command `copilot-chat-porter.import` that opens a native open-file dialog filtered to JSON files and calls `coreImport` with the selected file.

#### Scenario: User selects a file
- **WHEN** the user picks a `.json` file in the open-file dialog
- **THEN** `coreImport` is called and a success message shows the relative path of the restored session

#### Scenario: User cancels the open dialog
- **WHEN** the user dismisses the dialog without selecting a file
- **THEN** no import occurs and the command silently returns

#### Scenario: Import error is surfaced
- **WHEN** `coreImport` throws
- **THEN** the error is shown in a VS Code error message notification