## Purpose

Make exported chat JSON portable by copying and rewriting qualifying external file references.

## Requirements

### Requirement: External file references are copied into a local directory
When `attachmentsDir` is supplied, the system SHALL parse the exported JSON, scan only file URI objects identified by `$mid` presence and `scheme === "file"`, collect unique external `fsPath` or `path` values with a `Set`, and copy existing sources into `attachmentsDir`.

#### Scenario: Export with attachments
- **WHEN** `attachmentsDir` is a non-empty relative path string and the exported JSON contains file URI objects referencing paths outside the workspace
- **THEN** those files are copied into `<exported-JSON-dir>/<attachmentsDir>/` and the JSON is rewritten in place with updated paths

#### Scenario: No external references
- **WHEN** the exported JSON contains no file URI objects referencing paths outside the workspace
- **THEN** no files are copied and the JSON is not modified; the function returns an empty mappings array

#### Scenario: Source file missing
- **WHEN** an external file reference path does not exist on disk
- **THEN** that file is skipped with a warning log entry and the export still succeeds with the remaining files

#### Scenario: All source files are missing
- **WHEN** every discovered external file reference points to a missing source
- **THEN** every source is skipped, the mappings array remains empty, the JSON is not rewritten, and export still succeeds

#### Scenario: Repeated source path
- **WHEN** the same external source path appears in more than one qualifying file URI object
- **THEN** the source is collected once for copying and the resulting raw-string replacement updates every matching occurrence

#### Scenario: Exported JSON is malformed
- **WHEN** attachment processing receives malformed exported JSON
- **THEN** `JSON.parse` fails and the failure propagates through export

### Requirement: `attachmentsDir` MUST be a relative path
The system SHALL apply the `attachmentsDir` rules in `path-resolution`: a truthy lexical absolute value is rejected before export, while a non-empty non-absolute value is joined to the exported JSON directory.

#### Scenario: Absolute `attachmentsDir` is rejected
- **WHEN** `attachmentsDir` is `/tmp/attachments` or `C:\attachments`
- **THEN** the extension throws: "attachmentsDir must be a relative path (resolved from the exported JSON file's directory). Absolute paths are not allowed."

#### Scenario: Relative `attachmentsDir` is accepted
- **WHEN** `attachmentsDir` is `attachments` or `exports/assets`
- **THEN** the directory is resolved relative to the exported JSON file's directory

#### Scenario: Parent-relative attachments directory
- **WHEN** `attachmentsDir` contains `..` but is not lexically absolute
- **THEN** the current implementation accepts it without containment enforcement

### Requirement: Attachment deduplication by content
The system SHALL deduplicate copied files using byte-equality comparison:
- If a file with the same name and identical content already exists in `attachmentsDir`, the copy is skipped and the existing path is reused in the mapping
- If a file with the same name but different content exists, a numeric suffix starting at `-1` is searched until a free slot or a content-equal slot is found

#### Scenario: Same file copied twice
- **WHEN** two external references point to files with the same basename and identical content
- **THEN** only one copy is written; both references are rewritten to the same local path

#### Scenario: Name collision with different content
- **WHEN** two external references have the same basename but different content
- **THEN** the second file is saved as `<name>-1<ext>` (or the next free suffix) and both references are rewritten to their respective local paths

#### Scenario: Existing target has identical content
- **WHEN** a target filename already exists in `attachmentsDir` with byte-identical content
- **THEN** the existing target is reused without overwriting or copying the source again

### Requirement: Path references are rewritten in the exported JSON
The system SHALL replace every occurrence of an external file's original absolute path in the JSON string with the local copied path, using three replacement patterns: forward-slash normalized, backslash-escaped, and `file://` URI form.

#### Scenario: Path rewritten in all forms
- **WHEN** a file at `/Users/alice/notes.pdf` is copied to `<attachments>/notes.pdf`
- **THEN** all occurrences of `/Users/alice/notes.pdf`, `\/Users\/alice\/notes.pdf`, and `file:///Users/alice/notes.pdf` in the raw JSON string are replaced with their local equivalents