## Why

This change creates an accuracy-first onboarding baseline from verified source behavior. It records current semantics, channel boundaries, and known constraints so future work starts from evidence rather than assumptions. It does not change runtime behavior or promote these change-local documents into living specs.

## What Changes

- Document implemented workflows and module ownership, including cross-cutting path resolution
- Correct unsupported UI, timing, callback, and containment claims in the orientation stub
- Populate concise, verified OpenSpec project context
- Make no source, manifest, dependency, runtime, living-spec, promotion, or archive changes

## Capabilities

### New Capabilities

- `chat-export`: Exporting the current Copilot Chat session to a portable JSON file (the primary user-facing workflow)
- `chat-import`: Delegating a previously exported JSON file to VS Code's internal import command
- `attachment-portability`: Optionally copying externally-referenced files out of the chat JSON into a self-contained local directory with deduplication and path rewriting
- `uri-handler`: Triggering export and import from external scripts via `vscode://` URIs, with export-only optional callbacks
- `command-palette`: Invoking export and import through VS Code's command palette with native file dialogs, as an alternative to AI-mediated invocation
- `extension-lifecycle`: How the extension is activated, what it registers, and the shared `core` layer that all three entry points delegate to
- `path-resolution`: Lexical path classification and workspace/remote URI resolution shared by the workflows and URI callbacks

### Modified Capabilities

<!-- None — this is the first spec pass; no existing specs exist to modify. -->

## Impact

- Updates `openspec/config.yaml` and this active change's proposal, design, tasks, worklog, and seven capability specs
- Documentation-only: zero impact on compiled output, `package.json`, runtime behavior, dependencies, tests, living specs, promotion, or archival state
