---
name: feature-development-cycle
description: The default background process for ALL development work. Automatically activates whenever planning, building, or implementing anything. Drives spec → testing plan → TODO → implementation → audit loops until verified complete.
---

# Feature Development Cycle Skill

The always-running background process for development. Whenever work is happening — planning, building, fixing, refactoring — this cycle is active. It drives structured iteration from spec through verified completion, producing planning docs, test plans, TODO tracking, and audit reports until everything passes and the audit confirms done.

## When to Use

**This is the default background process for ALL development work.** Activate automatically whenever the user:

- Asks to build, plan, implement, or work on anything
- Says "let's do X", "I need X", "build me X", "work on X"
- Starts discussing a feature, component, page, or system
- Mentions planning, architecture, or design decisions
- Asks to fix, refactor, or rebuild something substantial
- Resumes work on an in-progress feature

**If work is happening, this cycle is running.** You don't need to be told to use it — it's the process.

## Usage

The user will talk naturally. Recognize intent and enter the cycle:

```
"I need a notifications system"
"let's build out the grading dashboard"
"work on offline support"
"let's plan the file preview feature"
"pick up where we left off on dark mode"
"I want to add real-time collaboration"
"fix up the recording studio — it needs a rewrite"
"let's get the chat sidebar working properly"
```

All of these trigger the full cycle. No special invocation needed.

## Process Overview

```
┌─────────────────────────────────────────────────────────┐
│  1. FEATURE SPEC          → docs/{FEATURE}_PLAN.md      │
│  2. TESTING PLAN          → docs/{FEATURE}_TEST_PLAN.md │
│  3. TODO LIST             → managed via tool + plan doc  │
│  4. IMPLEMENT + TEST      → iterative development       │
│  5. AUDIT                 → docs/{FEATURE}_AUDIT.md     │
│  6. REPEAT (if needed)    → back to step 4              │
│  7. CLEANUP (optional)    → finalize plan, delete rest  │
└─────────────────────────────────────────────────────────┘
```

## Step 1: Feature Specification

Create a comprehensive feature spec as a planning markdown document.

**Output file:** `docs/{FEATURE_NAME}_PLAN.md`

**Required sections:**

```markdown
# {Feature Name} Plan

## Overview

Brief description of the feature and its purpose.

## Goals

- [ ] Goal 1
- [ ] Goal 2

## Non-Goals

- What this feature explicitly does NOT do

## Architecture

### Components Affected

- List of files/components to create or modify

### Data Model Changes

- Schema additions/modifications (if any)

### API Changes

- New queries/mutations/subscriptions (if any)

### State Management

- Context changes, new contexts, subscription patterns

## User Stories

1. As a {role}, I want to {action} so that {benefit}
2. ...

## UI/UX Design

- Component hierarchy
- User flow descriptions
- Responsive behavior

## Dependencies

- External libraries needed
- Internal dependencies

## Risks & Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| ...  | ...        |

## Success Criteria

- Measurable criteria that define "done"
```

## Step 2: Testing Plan

Create a comprehensive testing plan covering ALL test layers.

**Output file:** `docs/{FEATURE_NAME}_TEST_PLAN.md`

**Required sections:**

```markdown
# {Feature Name} Test Plan

## Test Strategy Overview

Brief description of testing approach and priorities.

## 1. Unit Tests

**Location:** `test/unit/` or colocated `*.test.ts` files
**Framework:** Vitest

| Test ID | Description   | File        | Status         |
| ------- | ------------- | ----------- | -------------- |
| UT-001  | {description} | {file path} | ⬜ Not Started |
| UT-002  | {description} | {file path} | ⬜ Not Started |

### Test Cases

- Pure function tests (utils, helpers, transformers)
- Hook tests (custom React hooks in isolation)
- State logic tests (reducers, context logic)

## 2. Integration Tests

**Location:** `test/integration/` or colocated
**Framework:** Vitest + React Testing Library

| Test ID | Description   | File        | Status         |
| ------- | ------------- | ----------- | -------------- |
| IT-001  | {description} | {file path} | ⬜ Not Started |

### Test Cases

- Component + Context integration
- Data flow between components
- API client interactions (mocked)
- Subscription handling

## 3. Component Storybook Stories

**Location:** `src/components/*.stories.tsx`
**Framework:** Storybook 8

| Story ID | Component   | Variants                       | File   | Status         |
| -------- | ----------- | ------------------------------ | ------ | -------------- |
| CS-001   | {Component} | Default, Loading, Error, Empty | {file} | ⬜ Not Started |

### Stories Required

- Default state
- Loading state
- Error state
- Empty state
- Edge cases (long text, many items, etc.)
- Responsive variants (mobile, tablet, desktop)

## 4. Interaction Storybook Tests

**Location:** `src/components/*.stories.tsx` (play functions)
**Framework:** Storybook Interactions + Testing Library

| Test ID | Component   | Interaction        | File   | Status         |
| ------- | ----------- | ------------------ | ------ | -------------- |
| IX-001  | {Component} | {user interaction} | {file} | ⬜ Not Started |

### Interactions to Test

- Click handlers and button actions
- Form submissions and validation
- Drag and drop operations
- Keyboard navigation
- Modal open/close sequences
- State transitions from user actions

## 5. API Integration Tests

**Location:** `test/api/` or `amplify/functions/*/test/`
**Framework:** Vitest

| Test ID | Description   | Endpoint/Query   | File   | Status         |
| ------- | ------------- | ---------------- | ------ | -------------- |
| AI-001  | {description} | {query/mutation} | {file} | ⬜ Not Started |

### Test Cases

- GraphQL query/mutation responses
- Lambda function unit tests
- Auth rule verification
- Error response handling
- Rate limiting / edge cases

## 6. E2E Tests (Browser Automation)

**Location:** `cypress/e2e/`
**Framework:** Cypress

| Test ID | Description   | User Flow | File   | Status         |
| ------- | ------------- | --------- | ------ | -------------- |
| E2E-001 | {description} | {flow}    | {file} | ⬜ Not Started |

### User Flows to Cover

- Happy path (complete feature usage)
- Error recovery
- Auth-gated flows (different user roles)
- Cross-browser considerations
- Performance (no excessive loading)

## 7. Browser Runtime Validation

**Framework:** Playwright MCP / Chrome DevTools MCP
**When:** After feature pages are functional and rendering

This is a manual-ish crawl of the new/changed pages in a real browser to catch runtime issues that automated tests miss.

| Check ID | Page/Route | Console Errors   | HAR Issues        | Status         |
| -------- | ---------- | ---------------- | ----------------- | -------------- |
| BV-001   | {route}    | {count or clean} | {issues or clean} | ⬜ Not Started |

### Procedure

1. **Open each new/changed page** in the browser (use Playwright MCP or open manually)
2. **Capture console output** — look for:
   - Errors (red) — fix immediately
   - Warnings about deprecated APIs or missing keys — fix or suppress with reason
   - Repeated warnings indicating render loops
3. **Capture HAR file** — inspect network activity for:
   - Excessive re-renders (same request firing repeatedly)
   - Redundant API calls (duplicate GraphQL queries)
   - Large payload sizes that should be paginated
   - Failed requests (4xx/5xx) that aren't handled gracefully
   - Subscription churn (rapid connect/disconnect cycles)
4. **Check render count** — if a component re-renders more than expected:
   - Identify the cause (missing memoization, unstable context values, subscription thrashing)
   - Fix the root cause, don't just suppress with `React.memo`
5. **Document findings** in the test plan table above

### Red Flags in HAR

- Same endpoint called 5+ times in quick succession → subscription or effect loop
- WebSocket reconnections → auth token expiry or unstable connection handling
- Payload > 1MB for a single query → needs pagination or field selection
- 429 responses → rate limiting, back off or batch

### What "Clean" Looks Like

- Zero console errors
- No repeated warnings (1-2 known library warnings acceptable if documented)
- Each API call fires once per user action or mount
- No subscription re-establishment loops
- Page loads in < 3s on throttled connection

## Test Data Requirements

- Mock data files needed
- Fixtures for Cypress
- Storybook mock data in `.storybook/__mocks__/ui-data/`

## Coverage Goals

| Layer       | Target                 | Notes                      |
| ----------- | ---------------------- | -------------------------- |
| Unit        | 90%+                   | Critical logic paths       |
| Integration | 80%+                   | Key component interactions |
| Storybook   | 100% of new components | All visual states          |
| Interaction | Key user flows         | Critical paths             |
| API         | 90%+                   | All endpoints              |
| E2E         | Happy + error paths    | User-facing flows          |
| Browser     | All new/changed routes | Console clean, HAR clean   |
```

**Status Legend:**

- ⬜ Not Started
- 🔨 In Progress
- ✅ Passing
- ❌ Failing
- ⏭️ Skipped (with reason)

## Step 3: TODO List

Generate a structured TODO list from the plan and test plan. Use the `manage_todo_list` tool for active tracking and include a summary in the plan doc.

**Ordering priority:**

1. Data model / schema changes (foundation)
2. Utility functions and hooks (building blocks)
3. Context/state management (data layer)
4. UI components (presentation)
5. Integration wiring (connecting pieces)
6. Tests at each layer (verification)
7. Polish and edge cases (hardening)

**Each TODO should be small enough to complete in one focused session.**

## Step 4: Implement + Test (Iterative)

Work through the TODO list, implementing features and writing tests as you go.

**Rules:**

- Mark TODO as in-progress before starting
- Write tests alongside or immediately after implementation
- Mark TODO as completed only when tests pass
- Run relevant test suite after each completed item:

  ```bash
  # Unit/Integration tests
  npx vitest run --reporter=verbose {test-file}

  # Storybook build check
  npm run storybook -- --ci --smoke-test

  # E2E tests
  npx cypress run --spec {spec-file}
  ```

- If a test fails, fix before moving to next TODO
- Update test plan status markers as tests are written and pass

## Step 5: Audit

When you believe a feature (or significant portion) is complete, create an audit document.

**Output file:** `docs/{FEATURE_NAME}_AUDIT.md`

**Required format:**

```markdown
# {Feature Name} Audit

**Date:** {YYYY-MM-DD}
**Audit Number:** {N} (increments each cycle)
**Status:** 🔴 Incomplete | 🟡 Partially Complete | 🟢 Verified Complete

## Plan vs. Reality

### Goals Assessment

| Goal   | Plan               | Actual                 | Status   |
| ------ | ------------------ | ---------------------- | -------- |
| Goal 1 | {what was planned} | {what was implemented} | ✅/❌/🟡 |

### Component Checklist

| Component/File | Planned       | Exists | Tests Pass | Notes   |
| -------------- | ------------- | ------ | ---------- | ------- |
| {path}         | {description} | ✅/❌  | ✅/❌/N/A  | {notes} |

### Test Coverage Summary

| Layer       | Planned | Written | Passing | Coverage |
| ----------- | ------- | ------- | ------- | -------- |
| Unit        | {N}     | {N}     | {N}     | {%}      |
| Integration | {N}     | {N}     | {N}     | {%}      |
| Storybook   | {N}     | {N}     | {N}     | N/A      |
| Interaction | {N}     | {N}     | {N}     | N/A      |
| API         | {N}     | {N}     | {N}     | {%}      |
| E2E         | {N}     | {N}     | {N}     | N/A      |

### Deviations from Plan

1. {What changed and why}
2. ...

### Remaining Work

- [ ] {Incomplete item 1}
- [ ] {Incomplete item 2}

### Blockers

- {Any blockers preventing completion}

## Verification Steps Performed

1. Ran `npx vitest run` — {result}
2. Ran `npm run storybook -- --ci` — {result}
3. Ran `npx cypress run` — {result}
4. Manual review of {X} — {result}

## Decision

- [ ] **COMPLETE** — All goals met, all tests passing, no remaining work
- [ ] **CONTINUE** — Return to Step 4 with updated TODO list below

### Updated TODO (if continuing)

1. ...
2. ...
```

## Step 6: Repeat

If the audit decision is **CONTINUE**:

1. Update the TODO list with remaining work from the audit
2. Return to Step 4
3. After completing remaining items, run Step 5 again
4. Increment the audit number
5. Continue until audit status is 🟢 Verified Complete

**Termination criteria (ALL must be true):**

- All planned goals are implemented
- All tests pass (unit, integration, storybook, interaction, API, E2E)
- Audit status is 🟢 Verified Complete
- No remaining work items

## Step 7: Cleanup (Optional)

Once the audit is 🟢 Verified Complete and the user wants to clean up, consolidate everything back into the single plan document and delete the intermediate files.

**Process:**

1. **Verify the plan is factually correct** — compare `docs/{FEATURE}_PLAN.md` against what was actually built:
   - Do the goals match what was implemented?
   - Does the architecture section reflect the real code?
   - Are there deviations that need to be captured?
   - Were new features added that aren't in the plan?
   - Were planned features dropped or changed?

2. **Update the plan to reflect reality** — rewrite any sections that drifted during implementation. The plan becomes the authoritative record of what was built and why. Add a `## Completed` section at the top if desired.

3. **Delete intermediate docs** — remove the test plan and audit files:

   ```bash
   rm docs/{FEATURE_NAME}_TEST_PLAN.md
   rm docs/{FEATURE_NAME}_AUDIT.md
   ```

4. **Confirm with user** before deleting — these are destructive actions.

**What stays:** `docs/{FEATURE_NAME}_PLAN.md` — updated, factually correct, covers all the work that was done.

**What goes:** Test plan and audit docs (their purpose is served once the feature is verified complete).

**When to skip cleanup:** If the user wants to keep the full paper trail for reference, skip this step entirely. The intermediate docs don't hurt anything.

---

## File Naming Convention

All documents use SCREAMING_SNAKE_CASE with the feature name:

```
docs/{FEATURE_NAME}_PLAN.md
docs/{FEATURE_NAME}_TEST_PLAN.md
docs/{FEATURE_NAME}_AUDIT.md
```

Examples:

```
docs/DARK_MODE_PLAN.md
docs/DARK_MODE_TEST_PLAN.md
docs/DARK_MODE_AUDIT.md

docs/REAL_TIME_COLLABORATION_PLAN.md
docs/REAL_TIME_COLLABORATION_TEST_PLAN.md
docs/REAL_TIME_COLLABORATION_AUDIT.md
```

## Context Integration

This skill integrates with the project's existing patterns:

- **Storybook mocks** → `.storybook/__mocks__/ui-data/` for mock data
- **Cypress fixtures** → `cypress/fixtures/` for E2E test data
- **Vitest config** → `vitest.config.ts` and `vitest.workspace.ts`
- **Agent permissions** → Check `.github/agent-permissions.json` before modifying production code
- **Contexts** → Use existing React contexts rather than creating new subscriptions
- **TypeScript** → New files should be `.tsx`/`.ts` where possible

## Quick Reference Commands

```bash
# Run all unit tests
npx vitest run

# Run specific test file
npx vitest run path/to/test.test.ts

# Run tests in watch mode
npx vitest watch

# Storybook dev
npm run storybook

# Storybook build (CI check)
npx storybook build --ci

# Cypress interactive
npm run cypress:open

# Cypress headless
npx cypress run --spec cypress/e2e/{spec}.cy.ts

# Coverage report
npx vitest run --coverage
```

## Example Session Flow

```
User: "let's build offline caching"

Agent:
1. Creates docs/OFFLINE_CACHING_PLAN.md with full spec
2. Creates docs/OFFLINE_CACHING_TEST_PLAN.md with all test layers
3. Builds TODO list from both documents
4. Begins implementation, writing tests alongside code
5. After completing items, runs test suites
6. Creates docs/OFFLINE_CACHING_AUDIT.md comparing plan to reality
7. If incomplete → updates TODOs, continues implementation
8. Repeats until audit shows 🟢 Verified Complete
9. (Optional) Updates plan to match reality, deletes test plan + audit
```
