---
description: >
  Audit a plan document against actual code implementation. Compares status markers
  and implementation evidence to produce a TODO list of outstanding items, then
  re-checks completion and runs the full quality gate (lint, tests, storybook CLI,
  storybook build, next build, crawl). Use when reviewing a migration plan, architecture
  doc, or feature spec to find what is still outstanding and verify nothing is broken.
argument-hint: "Attach the plan doc via 'Add File', or pass its path (e.g. docs/CLOUDFRONT_MIGRATION_PLAN.md)"
agent: agent
---

# Plan vs Implementation Audit

You are auditing a plan document against the actual codebase to determine what has been implemented, what is still outstanding, and — once everything is complete — to run the full quality gate.

## Input

The plan document can be provided in two ways — use whichever is present:

1. **Attached file** — the user dragged or used "Add File" to attach it to this chat. Read it from the attached context.
2. **Path argument** — the user typed a path after the slash command (e.g. `/plan-implementation-audit docs/CLOUDFRONT_MIGRATION_PLAN.md`). Use `read_file` to load it.

If both are present, prefer the attached file.

---

## Phase 1 — Parse the Plan

Read the plan document in full. Extract every distinct deliverable, task, or requirement. For each item record:

- **ID** — a short label (e.g. `Phase-0-A`, `Phase-6-B`)
- **Status marker** — the plan's own status emoji or label (`✅ Done`, `🔶 Partial`, `❌ Not started`, or unmarked)
- **What must exist** — file paths, function/class names, schema fields, environment variables, S3 paths, test cases, or any other concrete artifact the plan says should be created or changed

---

## Phase 2 — Verify Each Item Against Code

For every item extracted in Phase 1, search the codebase for implementation evidence:

- Use `grep_search` and `file_search` to locate the relevant files
- Use `read_file` to confirm the implementation is present and complete (not just scaffolded)
- Cross-check the plan's own status marker against what you actually find — the plan's markers may be stale

Classify each item as one of:

| Classification | Meaning |
|---|---|
| `DONE` | Evidence found in code; implementation matches the plan's intent |
| `PARTIAL` | Some evidence found but implementation is incomplete or missing key parts |
| `MISSING` | No evidence found; plan says done but code disagrees, or plan says not started and it isn't |
| `NEEDS_REVIEW` | Ambiguous — could not determine from static analysis alone |

---

## Phase 3 — Produce the TODO List

Output a markdown table:

```
| ID | Plan Status | Code Status | Description | Outstanding Work |
|---|---|---|---|---|
```

Then list only the items that are **not** `DONE` as a numbered TODO list, ordered by priority:

1. `MISSING` items that block other items first
2. `PARTIAL` items next
3. `NEEDS_REVIEW` items last

For each TODO item include:
- The specific files to create or modify
- The functions, types, or schema entries that need to be added
- Any test cases explicitly called out in the plan that are absent

---

## Phase 4 — Completion Check

After producing the TODO list, re-examine it:

**If the TODO list is empty** (all items are `DONE`):
→ Proceed immediately to Phase 5 (Quality Gate).

**If the TODO list is not empty**:
→ Present the list to the user and stop. Do not run the quality gate until all outstanding items have been addressed.

When the user re-invokes this prompt after completing items, repeat Phases 1–3 to re-verify, then proceed to Phase 5 if nothing remains.

---

## Phase 5 — Quality Gate

Run each step in order. **Stop and report if any step fails** — do not proceed to the next step.

### Step 1 — Lint
```bash
npm run lint:fix
```
Auto-fixes all fixable ESLint issues across `src`, `pages`, `app`, and `amplify`. Any unfixable errors must be resolved manually before proceeding.

### Step 2 — Typecheck
```bash
npm run typecheck:parallel
```
Runs three parallel `tsc --noEmit` checks across `src`, `gamification`, and `pages` tsconfigs. Zero errors required.

### Step 3 — Unit Tests
```bash
npm run test:unit
```
All tests must pass.

### Step 4 — Storybook Vitest Tests
```bash
npm run storybook:run
```
Runs all story tests via `@storybook/addon-vitest` (no dev server required). All tests must pass.

### Step 5 — Storybook Build
```bash
npm run build-storybook
```
Must complete with exit code 0. Confirms no compile or import errors across all stories.

### Step 6 — Next.js Build
```bash
npm run build
```
Must complete with exit code 0 (`next build` only — no typecheck baked in).

### Step 7 — Crawl
```bash
npm run crawl:with-logs
```
Review `test/results/crawl.log` for console errors, subscription storms, or rerender issues. Any new errors (not present before this work) must be investigated and resolved.

---

## Phase 6 — Final Report

After all quality gate steps pass, output a summary:

```
## Audit Complete ✅

### Plan: <document name>
### Date: <today's date>

#### Items verified DONE: N
#### Items that were PARTIAL → completed this session: N
#### Items that were MISSING → completed this session: N

#### Quality Gate
| Step | Result |
|---|---|
| Lint | ✅ Pass / ⚠️ N warnings |
| Typecheck | ✅ Pass |
| Unit Tests | ✅ Pass |
| Storybook CLI | ✅ Pass |
| Storybook Build | ✅ Pass |
| Next.js Build | ✅ Pass |
| Crawl | ✅ Clean / ⚠️ N issues noted |

#### Notes
<Any warnings, caveats, or follow-up items>
```

---

## Constraints

- **Do not implement missing items automatically** unless the user explicitly asks. This prompt audits and reports; implementation is a separate step.
- **Do not modify the plan document** unless asked. It is the source of truth for intent, not a live status tracker.
- **Check agent permissions** before reading files in `amplify/`, `src/`, or `pages/` — use the permission system defined in `.github/agent-permissions.json` if it exists.
- When the plan references AWS infrastructure (CDK stacks, SSM parameters, CloudFront behaviors), note these as `NEEDS_REVIEW` unless there is a corresponding CDK construct file in `amplify/custom/` or `amplify/functions/` that matches.
