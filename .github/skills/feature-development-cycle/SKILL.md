---
name: feature-development-cycle
description: Proportionate feature workflow using focused evidence and validation
---

# Feature Development Cycle

Use a full plan only for multi-surface or multi-session work. Handle localized fixes with the normal edit-test loop.

1. Identify the owning code path, one falsifiable hypothesis, and the narrowest check.
2. For substantial work, maintain one concise plan: scope, acceptance criteria, affected files, risks, and test strategy. Avoid separate documents and exhaustive TODO tables unless they add decision value.
3. Implement one small slice, add relevant tests, and immediately run the narrowest test, lint, or typecheck.
4. Expand validation only for affected surfaces; reserve full build, Storybook, E2E, and crawl for applicable changes or explicit requests.
5. Audit completion against acceptance criteria and report exceptions, residual risks, and validation results.

Never create process artifacts for trivial fixes or block progress on unrelated failures.