# Repository Agent Guide

Use this file for repository-wide rules. Read the nearest nested `AGENTS.md` before working in a subtree; nested guidance adds to or narrows these rules.

## Start Here

- Anchor work in the named file, failing test, route, or symbol. Search locally before exploring broadly.
- Treat source code, `package.json`, and `package-lock.json` as authoritative. Documentation can lag behind implementation.
- Check permissions before every file operation using the exact supported name: `read`, `write`, `delete`, or `rename`. File edits use `npm run agent:check -- --operation write --path <path>`; `edit` is not a valid operation. Check shell commands with `npm run agent:check -- --operation terminal --command "<command>"`.
- Production-code changes under `app/`, `src/`, `pages/`, or `amplify/` require user confirmation; tests, stories, and documentation follow the explicit policy exceptions.
- Never modify `package.json`, `amplify.yml`, or a GraphQL/data schema without explicit permission. Do not run `npm install`; dependency installation is user-managed.
- Preserve unrelated working-tree changes. Do not commit, delete, rename, deploy, or run destructive Git/AWS commands unless explicitly requested and permitted.

## Current Baseline

The manifest declares compatible ranges; the lockfile records what this checkout installs. As of 2026-09-19 the lockfile includes Next.js 16.2.10, Amplify JS 6.18.0, MUI 7.3.11, Lexical 0.39.0, Storybook 10.4.6, and AI SDK 6.0.42. Recheck both files before version-sensitive work, then consult documentation for that version.

Note the intentional-looking Lexical skew: most Lexical packages are 0.39.x while `@lexical/yjs` is 0.40.x. Do not normalize versions unless the task explicitly covers dependencies.

## Repository Map

- `app/`: Next.js App Router routes, layouts, server actions, and route handlers.
- `src/components/`: reusable application UI; `Editor3/` owns the Lexical editor.
- `src/context/`: shared subscriptions and application state. Reuse these providers instead of adding duplicate data subscriptions.
- `src/utils/`: shared pure helpers and service utilities.
- `amplify/`: Gen 2 backend, data schema, functions, auth, and storage.
- `.storybook/`: Storybook runtime, decorators, mocks, and onboarding tooling.
- `test/`: unit, integration, performance, Storybook, and end-to-end support.
- `docs/`: design records and operational notes; verify claims against live code.

## Efficient Workflow

1. Read the closest implementation and one neighboring test or call site.
2. State one falsifiable hypothesis and choose the cheapest check that can disprove it.
3. Make the smallest coherent edit, then immediately run the narrowest relevant validation.
4. Expand scope only when that result points to another owner.

Prefer existing abstractions and context providers. Avoid speculative refactors, duplicate subscriptions, generated-file edits, and broad test runs when a focused command exists.

## Validation

- Unit: `npm run test:unit -- <path>`
- Storybook: `npm run test:storybook -- --run <story-or-test>`
- TypeScript: `npm run typecheck`
- Lint: `npm run lint`
- End to end: `npm run e2e -- <spec>`

Limit large discovery output with targeted `rg`, `grep`, `awk`, or similar pipes. Preserve the command's exit status and do not filter validation output so aggressively that errors, summaries, or failing test names can be missed. When a test, build, audit, or diagnostic fails, inspect its complete captured output before concluding the cause. Never hide failures with DOM removal, arbitrary waits, or swallowed exceptions.
