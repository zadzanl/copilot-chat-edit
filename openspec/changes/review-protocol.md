# Review Workflow Protocol

This document defines the shared formats, vocabulary, and guidance for the five-agent review workflow. All review agent prompts reference this document instead of duplicating these definitions inline.

**Flow:** Primary Agent → Review Orchestrator → [Behavioral, Changeability, Security specialists in parallel] → Verdict Gate → Review Orchestrator → Primary Agent.

---

## Review Brief Format

The Review Brief is the single frozen input document that Primary Agent prepares and submits to the Review Orchestrator. It must be self-contained — every agent in the review workflow receives the same unchanged copy. Once frozen, it must not change. If anything in the reviewed surface or criteria changes, start a new review with a new Review Identity.

Use all eleven of these headings. If a value is unavailable, say so explicitly and explain why — do not leave a section blank or skip it.

| Heading | What to put in it |
|---|---|
| **Review Identity (change, phase, base revision when available)** | A change identifier, the review phase, and the base revision. If any of these are unavailable, write the value as "unavailable" and give the reason. |
| **Delivery Mode** | Which delivery mode was independently selected before this Review Brief was frozen, and the evidence or prevalidation that supports that selection. |
| **Objective and User Impact** | What this change is trying to accomplish, what value it delivers to the user, who is affected, and what observable impact it has. |
| **Acceptance Criteria** | Each criterion with a stable ID and a clear description of the behavior or evidence required to satisfy it. |
| **Scope, Constraints, Assumptions, and Non-Goals** | What is included in this change, what is excluded, any constraints that apply, explicit assumptions made, and what this change deliberately does not address. |
| **Changed Surface** | Every changed path, module, interface, runtime or configuration item, data element, trust boundary, and direct caller. Explicitly state "none" for any category with no changes. |
| **Decisions and Alternatives** | What design decisions were made, the rationale for each, what alternatives were considered, and why they were rejected. |
| **Evidence** | Implementation evidence, test results, diagnostic output, and manual validation results, each with its source and outcome. Identify any required evidence that is currently missing. |
| **Failures and Recovery** | Known failures, error behavior, effects on users and data, recovery and rollback steps, and any unresolved recovery gaps. |
| **Rollout and Feedback** | The rollout state or plan, how the change will be observed after deployment, feedback channels, ownership, and the boundaries of any claims made. |
| **Route Inputs and Citations** | The specific evidence that informs each of the B (Behavioral), C (Changeability), and S (Security) routing dimensions, including which controlled tags apply, complete-coverage claims or gaps, any uncertainty, and where the evidence is located. |

---

## Specialist Result Format

Each selected specialist returns one plain Markdown document using exactly these headings. Use American English spelling throughout.

| Heading | What to put in it |
|---|---|
| **Role** | Your exact role name. |
| **Status** | Exactly one terminal state. See [Specialist States](#specialist-states) below. |
| **Evidence Checked** | Which sections of the Review Brief you relied on, plus any evidence you found to be missing, stale, ambiguous, or conflicting. |
| **Findings** | Zero or more findings within your role's bounded scope. Use `None` when there are no findings. For each finding, use this structure (as a bullet list): |

Each finding uses these fields:

- **ID**: A stable finding ID (e.g., `B-01`, `C-02`, `S-01`).
- **Claim**: What the finding asserts.
- **Evidence**: Cite the specific Review Brief evidence, or explicitly state what evidence is missing.
- **Affected criterion and surface**: Which acceptance criterion and which part of the changed surface this finding applies to.
- **Consequence**: What happens if this finding is not addressed.
- **Closure and validation needed**: What must happen to resolve this finding and how to verify it.
- **Finding-specific limits**: Any scope limitations specific to this finding.

| Heading | What to put in it |
|---|---|
| **Limits and Assignment Mismatch** | The limits of your review and any over-assignment, under-assignment, uncertainty, or scope mismatch you identified. Use `None` when absent. |

---

## Shared Behavioral Guidance

Apply this guidance in all review work:

- If retrieval is unavailable, incomplete, or conflicting, say so explicitly. Do not guess. State the uncertainty clearly and continue with the best verified information available.
- Look for low-hanging improvements, overlooked constraints, and simpler alternatives. You may push back on the proposed approach when a better outcome is likely, but stay collaborative and open to discussion.
- Be concise, but do not sacrifice completeness. Be honest, never pretend to be more capable than you actually are.
- Do not be overconfident. Stay humble, and assume your time-sensitive knowledge (especially about tools, libraries, APIs, best practices, etc.) may be outdated.
- Prioritize solutions that are easy to observe, debug, and maintain. Aim for the best practical result.
- **Keep any implementations simple and extensible. Simple solutions are easier to understand, maintain, debug, and extend.**
- Watch for boundary cases, underlying abstracted mechanics, hidden assumptions, gotchas, and edge cases. Use sequential thinking when helpful.
- Insufficient testing creates long-term risk for future humans and AI agents working in this repository.
- Do not end with unverified positive claims such as "The issue should be fixed" or "This codebase is now production ready." You must only report what you have actually verified.

---

## Glossary

### Routing Dimensions

The Review Orchestrator evaluates three dimensions to decide which specialists to call. The Verdict Gate independently re-evaluates the same dimensions as a verification check against the Orchestrator's routing decisions.

| Dimension | What it covers |
|---|---|
| `B` — Behavioral | Functional correctness, feature requirements, broken features, edge cases, data changes, runtime errors, and user/data recovery behavior. |
| `C` — Changeability | Whether an uninvolved teammate can safely understand, change, validate, and recover the code. Covers ownership, knowledge placement, interfaces, maintenance, and discoverable recovery. |
| `S` — Security | Adversarial and trust-boundary behavior: identity and authorization, untrusted input, secrets and privacy, external security dependencies, failure modes that fail open, and security recovery. |

Each dimension is evaluated as `YES`, `NO`, or `UNKNOWN`:

- **`YES`**: A controlled tag below applies and is supported by cited evidence. Select the matching specialist.
- **`UNKNOWN`**: The required evidence is missing, ambiguous, stale, or conflicting. Select the specialist conservatively. Record why the evidence is insufficient.
- **`NO`**: Every required coverage item is explicitly cited and no controlled tag applies. You cannot mark a dimension `NO` just because evidence is missing — missing evidence means `UNKNOWN`.

### Controlled Tags

These are the only tags that count toward routing decisions. No other tag, label, or general risk score may influence routing.

**Behavioral (`B`):**

| Tag | Meaning |
|---|---|
| `observable-behavior` | The change alters something a user or system can observe. |
| `defect-regression` | A known or previously fixed defect may recur. |
| `runtime-or-config` | Runtime behavior or configuration is affected. |
| `data-integrity` | Data correctness or consistency is at risk. |
| `error-recovery` | Error paths or recovery behavior is affected. |
| `behavioral-validation` | Evidence of correct behavior is required but incomplete. |

**Changeability (`C`):**

| Tag | Meaning |
|---|---|
| `teammate-safety` | An uninvolved teammate might not be able to safely change this. |
| `module-responsibility` | Responsibility boundaries between modules are unclear or changing. |
| `interface-contract` | What callers must know to use a module correctly is changing. |
| `seam-adapter` | A place where behavior can be altered without editing the module is affected. |
| `dependency-shape` | How modules depend on each other is changing. |
| `architecture-refactor` | Structural relationships between modules are changing. |

**Security (`S`):**

| Tag | Meaning |
|---|---|
| `trust-boundary` | A boundary between trusted and untrusted code or data is affected. |
| `identity-or-authorization` | Authentication or permission logic is changing. |
| `untrusted-input` | Input from an untrusted source is handled. |
| `secrets-or-privacy` | Secrets, credentials, or private data is involved. |
| `external-security-dependency` | The change depends on an external system for security properties. |
| `security-recovery` | How the system recovers from a security incident is affected. |

### Specialist States

| State | Meaning |
|---|---|
| `NOT_SELECTED` | A valid `NO` routing decision was made; no call occurred. This state belongs only in the Orchestrator's execution table — a specialist never reports it about itself. |
| `COMPLETE` | The specialist completed a bounded findings-only review. |
| `PARTIAL` | The specialist produced usable findings but could not complete the full review. |
| `FAILED` | No usable findings because execution or required context failed. |
| `AMBIGUOUS` | Conflicting or indeterminate evidence was preserved but could not be resolved. |

### Overall Review States

| State | Meaning |
|---|---|
| `COMPLETE` | A valid Gate Review exists and every selected specialist is `COMPLETE`. |
| `DEGRADED` | A valid Gate Review exists but selected work or evidence is partial, failed, ambiguous, or incomplete. Partial findings are preserved. |
| `BLOCKED` | The Gate Review is missing, malformed, invalid, or unavailable. No verdict exists. |

### Canonical Finding Categories (Gate only)

The Verdict Gate is the only agent that assigns categories and severity. Specialists describe findings without categorizing them.

| Category | Severity | Meaning |
|---|---|---|
| `BLOCKING_DEFECT` | `CRITICAL` or `MAJOR` | A confirmed defect that must be resolved before approval. |
| `PROOF_GAP` | `CRITICAL` or `MAJOR` | Required evidence is missing and the gap must be closed before approval. |
| `LEARN_NOTE` | None | An observation worth preserving for future work; does not block approval. |

### Verdicts (Gate only)

| Verdict | Meaning |
|---|---|
| `APPROVED` | The objective and criteria are evidenced, no unresolved `CRITICAL` or `MAJOR` finding remains, and every selected specialist is `COMPLETE`. |
| `NEEDS_REVISION` | A fixable blocking defect or proof gap remains. |
| `FAILED` | The objective was missed, the condition is unsafe or irreparable, or adequate review cannot be established without intervention. |
