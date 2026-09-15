---
description: >
  Token-efficient audit of a plan against implementation. Finds only outstanding
  or ambiguous work, then runs the full quality gate only when all deliverables
  are verified.
argument-hint: "Attach the plan doc via 'Add File', or pass its path (e.g. docs/CLOUDFRONT_MIGRATION_PLAN.md)"
agent: agent
---

# Plan vs Implementation Audit v2

Audit a plan document against the codebase. Determine which deliverables are implemented, report only exceptions, and run the quality gate only when every deliverable is verified. Optimize for decisive evidence and low tool/token use; this is an audit, not an implementation task.

## Input

Use the attached plan when present; otherwise read the path argument. Read the plan once, in full. Do not modify it unless explicitly instructed.

## Permission and Scope

- Check agent permissions before reading `amplify/`, `src/`, or `pages/`.
- Do not implement missing work unless explicitly asked.
- Treat infrastructure requirements as `NEEDS_REVIEW` unless a matching construct exists in `amplify/custom/` or `amplify/functions/`.

## Efficient Audit Method

1. Build a compact internal ledger of distinct, verifiable deliverables. Merge duplicate or dependent bullets into one deliverable. Record: `ID`, plan status, expected artifact, and one or two searchable anchors (path, symbol, model field, command, or test name).
2. Verify in batches, grouped by directory or shared anchor:
   - Search all anchors for a group in one call using alternation.
   - Read only the exact matching files or narrow sections needed to distinguish implementation from scaffolding.
   - Do not read unrelated files, enumerate directories, or search separately for every plan bullet.
   - When a concrete artifact and its relevant behavior are present, classify it `DONE` without further corroboration.
3. Classify each ledger item as `DONE`, `PARTIAL`, `MISSING`, or `NEEDS_REVIEW`.
4. Preserve brief evidence internally. In the response, show evidence only for items that are not `DONE`.

`DONE` requires a matching artifact and behavior. `PARTIAL` has an artifact but lacks a required behavior, integration, or test. `MISSING` lacks the required artifact. `NEEDS_REVIEW` cannot be decided statically.

## Report and Stop Rule

If any item is not `DONE`, stop after this report; do not run validation commands.

Report a summary count, followed by one compact table containing only exceptions:

| ID  | Plan Status | Code Status | Evidence | Outstanding Work |
| --- | ----------- | ----------- | -------- | ---------------- |

Then provide a numbered TODO list ordered as: blocking `MISSING`, other `MISSING`, `PARTIAL`, then `NEEDS_REVIEW`. For each entry, name only the concrete files, symbols, schema entries, or explicitly required tests still needed.

If all items are `DONE`, state the count and proceed directly to the quality gate. Do not reproduce the full ledger or a table of completed work.

## Quality Gate

Run these commands in order. Stop at the first failure and report its command plus the actionable failures; do not continue. Do not use auto-fix commands in an audit.

1. `npm run lint`
2. `npm run typecheck:parallel`
3. `npm run test:unit`
4. `npm run storybook:run`
5. `npm run build-storybook`
6. `npm run build`
7. `npm run crawl:with-logs`

For the crawl, read `test/results/crawl.log` only after the command succeeds and report only new console errors, subscription storms, or rerender issues attributable to the audited work.

## Final Report

Use this concise format after every quality-gate step passes:

```markdown
## Audit Complete

Plan: <document name>
Verified: <N> deliverables

| Quality Gate    | Result                        |
| --------------- | ----------------------------- |
| Lint            | Pass                          |
| Typecheck       | Pass                          |
| Unit tests      | Pass                          |
| Storybook tests | Pass                          |
| Storybook build | Pass                          |
| Next.js build   | Pass                          |
| Crawl           | Clean, or concise issue count |

Notes: <only warnings, caveats, or follow-up items; otherwise "None.">
```
