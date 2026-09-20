# Storybook Guide

- Runtime mocks under `__mocks__/` reflect actual data shapes. Verify them before changing a component to match an assumed shape.
- Keep story data minimal and structural: include only fields needed by the component and interaction. Reuse fixture builders or canonical mocks for large OpenAI, Amplify, and API payloads instead of pasting verbose raw responses into stories or prompts.
- Define applicable story variants alongside the prop interface before implementing a large component. This makes loading, empty, error, success, responsive, and interaction contracts explicit without inventing impossible states.
- Import test helpers from `storybook/test`, not `@storybook/test`, and use `fn()` rather than deprecated action mocks.
- The global preview clears mock data before each story. Seed required records in a story `loader`, after `clearMockData()`, using stable IDs.
- Let the global decorator provide `UnitProvider` through `parameters.unitId`; do not manually nest another provider.
- Use `minimalProviders: true` only for presentational stories whose complete child tree consumes none of the application contexts or related hooks.
- Do not enable `minimalProviders` when a play function can collide with the deferred rendering overlay, especially queries for `[role="progressbar"]` or the component display name.
- Story titles are API: title changes alter IDs and can break onboarding tasks. Check `code/onboarding-tasks.ts` before renaming.
- Keep Translation Mode titles unprefixed; other established top-level categories use their existing emoji prefixes.
- Storybook is pinned to port 6006 because onboarding progress is origin-scoped. Manager/addon code often requires a server restart after edits.
- Do not regenerate `optimize-deps.ts` unless dependency imports changed and representative heavy stories have been visited. Never include `vitest`, `vitest/*`, or `@vitest/*` as optimize entries.

Prefer a single-story browser test, then run `npm run storybook:validate-mocks` or the broader Storybook suite only when needed. Filter repetitive successful output when useful, but preserve exit status, failure details, and the final summary. Inspect complete captured output for any failure before diagnosing it.
