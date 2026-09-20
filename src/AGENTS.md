# Source Guide

Changes to production files under `src/` require user confirmation before editing. Tests, stories, and documentation follow the exceptions in `.github/agent-permissions.json`.

## State And Data

- Reuse providers in `src/context/`; do not add a second subscription for data a context already owns.
- Prefer one `observeQuery()` subscription per model and filter client-side. Always unsubscribe in cleanup.
- Filter subscription items with `item != null && item.id != null` before reading fields.
- Do not manually add an `owner` filter when model authorization already uses `allow.owner()`.
- Sort `observeQuery()` results client-side; do not pass unsupported `sortField` or `sortDirection` options.
- Handle AppSync `in` filters defensively: the service permits at most five values.
- Treat `DuplicatedOperationError` during rapid mount/unmount as a transient subscription warning, not an application crash.
- Before sending `_version`, verify that the specific model declares `_version: a.integer()` in `amplify/data/resource.ts`. For version guards, accept only values strictly greater than the tracked version.

## UI And Types

- New components should be TypeScript with explicit prop interfaces; preserve JavaScript files unless conversion is part of the task.
- Before implementing a substantial component, define its prop contract and enumerate only the states and Storybook variants the component can actually enter. Resolve uncertain data shapes from the nearest call site, schema, or mock rather than guessing.
- Keep view components prop-driven. Put context, subscriptions, routing, and orchestration in a thin container or an existing provider.
- Extract custom hooks for reusable or independently testable stateful behavior, not for simple local expressions or solely to reduce line count.
- Follow the existing MUI design language. In MUI 7, use `Grid size={{ xs: 12, sm: 6 }}` rather than the removed `item`/breakpoint props.
- For `next-intl`, do not use `t(key, "fallback")`; the second argument is a values object. Use an established `t.has(key)` fallback pattern.
- Do not manipulate the DOM to work around React, Lexical, or test failures.
- Keep accessibility semantics intact and use existing icon libraries rather than hand-drawn SVG controls.

Run the closest test first, then the relevant strict TypeScript project or `npm run typecheck` when the change crosses project boundaries.
