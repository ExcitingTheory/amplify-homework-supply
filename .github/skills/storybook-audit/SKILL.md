---
name: storybook-audit
description: Focused Storybook audit that widens only from observed failures
---

# Storybook Audit

Audit requested or changed stories first. Use the full suite only for a requested full audit, release check, or shared Storybook infrastructure change.

1. Identify the selected stories, components, and mocks.
2. Run the narrowest applicable story test. For a full audit, run `npm run storybook:run:with-logs` once.
3. Inspect diagnostic logs only for failures or warnings that require a root cause.
4. Run mock-schema and prop validation only when results implicate data shape or provider setup.
5. Generate inventory or documentation only on request.

Report failures, affected stories, and root causes. Omit normal render successes and do not kill processes or clear caches as pre-flight work.