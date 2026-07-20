## Context

**Copilot Chat Porter** is a VS Code extension (v0.1.1, TypeScript, CommonJS, targeting VS Code ≥ 1.99) that invokes VS Code's internal Copilot Chat export and import commands. Its channels are Language Model Tools, URI handling, and Command Palette commands.

This document covers the existing architecture as discovered during the retroactive orientation spec pass. It is descriptive, not prescriptive — the goal is to make implicit design decisions explicit so that future contributors have a stable reference.

## Goals / Non-Goals

**Goals:**

- Record the three-entry-point architecture and its shared-core delegation pattern
- Explain path resolution rules without presenting containment as a guarantee
- Capture the attachment deduplication algorithm and path-rewriting strategy
- Document the URI callback mechanism and why a 300 ms focus delay exists
- Note the Codespaces / remote URI compatibility fix introduced in v0.1.1

**Non-Goals:**

- Proposing any refactors or improvements (that belongs in a future change)
- Specifying test infrastructure (no automated tests exist today)
- Guaranteeing UI behavior of undocumented VS Code commands

## Decisions

### D1 — Shared workflows and channel-specific presentation are separated

**Current implementation**: `core.ts` owns `coreExport` and `coreImport`. LM tools, URI handling, and commands acquire their own inputs and expose outcomes per channel. LM tools and Command Palette export use `formatExportResult`; URI handling does not, instead using callback JSON or logs.

**Onboarding consequence**: Shared workflow changes belong in `core.ts` (and `attachments.ts` where relevant); channel input/presentation changes belong in the channel module.

---

### D2 — Attachment path rewriting via string replacement, not JSON re-serialization

**Current implementation**: `processAttachments` uses `JSON.parse` to discover qualifying file URI objects, then `rewritePaths` replaces supported representations in the original JSON string. Malformed JSON propagates as an export failure when attachments are requested.

**Constraint**: Raw replacement preserves layout but can change unrelated equal text; it is current behavior, not a general JSON-rewriting guarantee.

---

### D3 — `attachmentsDir` must be relative (not absolute)

**Current implementation**: A truthy lexical absolute `attachmentsDir` is rejected at the `coreExport` boundary. A non-empty non-absolute value is joined to the exported JSON file's directory.

**Constraint**: `..` is accepted with no containment enforcement. The authoritative rules are in `specs/path-resolution/spec.md`.

---

### D4 — URI export pre-focuses the chat panel with a 300 ms delay

**Decision**: Before calling `coreExport`, the URI handler executes `workbench.panel.chat.view.copilot.focus` and waits 300 ms.

**Rationale**: External processes (Copilot Hooks, shell scripts) invoke the URI handler without VS Code necessarily having the chat panel focused. The export command targets the active/focused chat. The delay is a pragmatic workaround for VS Code's async panel-focus behaviour — without it, the export command can fire before focus settles and may capture no-op or the wrong session.

**Known limitation**: 300 ms is empirical. A panel-ready event would be more reliable but is not currently exposed in the public API.

---

### D5 — `resolvePathToUri` preserves the workspace URI scheme for remote environments

**Decision**: When resolving an absolute path in a remote workspace, the function preserves the workspace URI's scheme (e.g., `vscode-remote://`) rather than creating a `file:///` URI.

**Rationale**: In GitHub Codespaces and VS Code Remote environments, `file:///` URIs are not valid for in-workspace operations. Using `getWorkspaceRootUri().with({ path })` ensures the correct scheme is inherited. This was the primary fix in v0.1.1.

---

### D6 — Export wraps `workbench.action.chat.export` in a 15 s timeout + file stat verification

**Current implementation**: `coreExport` races `workbench.action.chat.export` against 15 seconds, then separately races `workspace.fs.stat` against five seconds.

**Constraint**: A missing file can cause stat to reject immediately; the five-second period only bounds a hanging stat operation.

---

### D7 — File deduplication by byte-equality, not hash

**Current implementation**: `filesAreEqual` reads both candidate files in full and compares bytes to reuse an existing target; collision suffixes begin at `-1`.

**Constraint**: Full-file reads increase memory use. No file-size or scale behavior is specified here.

## Architecture / Module Map

| Module | Current responsibility |
|---|---|
| `extension.ts` | Registers LM tools, URI handler, and Command Palette commands. |
| `core.ts` | Shared export/import workflows, parent creation, timeouts, and export text formatting. |
| `attachments.ts` | Optional discovery, copying/deduplication, and raw JSON path replacement. |
| `utils.ts` | Output logging, lexical path handling, workspace access, timestamps, filesystem and timeout helpers. |
| `lmTools.ts` | LM input acquisition and `LanguageModelToolResult` text presentation. |
| `commands.ts` | Native dialog input and VS Code information/error notifications. |
| `uriHandler.ts` | Query parsing, dispatch, export focus delay, logging, and callback writes. |

## Risks / Trade-offs

| Current constraint / risk | Observed behavior and implication |
|---|---|
| Internal commands | `workbench.action.chat.export/import` are undocumented. The code does not prove import creates a new tab or any other UI outcome. |
| URI focus delay | URI export uses a fixed 300 ms delay; it is not a panel-readiness or UI-target guarantee. |
| Callback behavior | Callbacks are export-only. Relative callbacks log and abort; failed writes are logged and swallowed. |
| Attachment containment | Lexical absolute paths are rejected, but `..` receives no containment check. |
| External-path comparison | Backslashes are normalized before comparison, but it remains case-sensitive. |
| Filename extraction | Slash-first extraction can mishandle a Windows backslash-only source path. |
| Raw replacement | Equal path text outside an intended representation can be changed. |
| Test coverage | No automated tests are present; this documentation phase makes no compiler/test claim. |
