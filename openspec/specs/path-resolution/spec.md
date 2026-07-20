## Purpose

Define lexical path classification and workspace-aware URI resolution rules.

## Requirements

### Requirement: Path classification is lexical
The system SHALL classify a path as absolute only when it starts with `/` or matches `[A-Za-z]:[\\/]`. This is current lexical classification, not a general filesystem containment or validation rule.

#### Scenario: Unix-style absolute path
- **WHEN** a path starts with `/`
- **THEN** the classifier returns absolute

#### Scenario: Windows drive absolute path
- **WHEN** a path begins with a letter, colon, and slash or backslash
- **THEN** the classifier returns absolute

#### Scenario: Other path text
- **WHEN** a path matches neither lexical absolute form
- **THEN** the classifier returns non-absolute

### Requirement: Output and input paths resolve from the first workspace folder
The system SHALL join a non-absolute `outputPath` or `inputPath` to the first workspace folder URI. It SHALL apply a lexical absolute path to that first workspace URI while preserving its URI scheme.

#### Scenario: No workspace folder
- **WHEN** path resolution requires a workspace root and none is open
- **THEN** the helper throws a no-workspace error

#### Scenario: Relative output or input path
- **WHEN** a non-absolute output or input path is resolved with a workspace open
- **THEN** the URI is joined to the first workspace folder

#### Scenario: Absolute path in remote workspace
- **WHEN** a lexical absolute path is resolved and the first workspace URI uses a remote scheme
- **THEN** the resulting URI retains that workspace scheme while using the supplied path

### Requirement: Attachments directories are relative to the exported JSON URI
The system SHALL reject a truthy lexical absolute `attachmentsDir` before export. For a non-empty non-absolute value, it SHALL join the directory to the exported JSON URI's parent.

#### Scenario: Absolute attachments directory
- **WHEN** a truthy attachments directory is lexically absolute
- **THEN** `coreExport` throws before the internal export command is invoked

#### Scenario: Parent-relative attachments directory
- **WHEN** `attachmentsDir` contains `..` but is not lexically absolute
- **THEN** the implementation accepts it without containment enforcement

### Requirement: URI export callbacks require lexical absolute paths
The URI export handler SHALL accept a callback only when its non-empty path is lexically absolute. URI import SHALL NOT process callbacks.

#### Scenario: Absolute export callback
- **WHEN** URI export receives a lexical absolute callback
- **THEN** it can attempt callback writes after the export outcome

#### Scenario: Relative export callback
- **WHEN** URI export receives a non-empty non-absolute callback
- **THEN** it logs an error and aborts before focus or the core workflow