---
description: Test prompts for verifying the feature-development-cycle skill activates and runs correctly
tags: [testing, workflow, feature-development-cycle, qa]
---

# Feature Development Cycle — Test Prompts

Use these prompts to verify the feature-development-cycle skill activates correctly and follows the full process. Each prompt simulates a different entry point or phase of the workflow.

## Test 1: Cold Start — New Feature from Scratch

Paste this and verify the agent produces a `_PLAN.md`, `_TEST_PLAN.md`, and starts a TODO list:

```
I need a student progress dashboard that shows XP earned, assignments completed, and a streak counter. Let's build it.
```

**Expected behavior:**

- Creates `docs/STUDENT_PROGRESS_DASHBOARD_PLAN.md`
- Creates `docs/STUDENT_PROGRESS_DASHBOARD_TEST_PLAN.md` with all 7 test layers
- Generates TODO list from plan
- Asks for confirmation before modifying production code

---

## Test 2: Vague Intent — Should Still Activate

```
the leaderboard page needs work
```

**Expected behavior:**

- Agent asks clarifying questions about scope
- Then produces a plan document
- Enters the cycle

---

## Test 3: Mid-Cycle Resume

```
pick up where we left off on the aria label localization
```

**Expected behavior:**

- Agent looks for existing `docs/ARIA_LABEL_LOCALIZATION_PLAN.md`
- Checks for existing `_TEST_PLAN.md` and `_AUDIT.md`
- Resumes from the current phase (doesn't recreate docs that exist)
- Updates TODO list with remaining work

---

## Test 4: Rewrite / Major Refactor

```
the recording studio component is a mess, let's rewrite it from scratch as RecordingStudio3
```

**Expected behavior:**

- Creates plan with component versioning strategy
- Includes feature parity checklist vs RecordingStudio2
- Test plan includes Storybook stories for both old and new versions
- Migration strategy in plan

---

## Test 5: Implementation Phase — Tests Alongside

```
ok let's start coding the XP calculation utils
```

**Expected behavior:**

- Marks relevant TODO as in-progress
- Implements the code
- Writes unit tests immediately alongside
- Runs tests before marking TODO complete
- Moves to next TODO

---

## Test 6: Audit Trigger

```
I think the notifications feature is done, let's check
```

**Expected behavior:**

- Creates `docs/NOTIFICATIONS_AUDIT.md`
- Compares plan goals vs actual implementation
- Runs test suites and reports results
- Decides COMPLETE or CONTINUE
- If CONTINUE, updates TODO with remaining work

---

## Test 7: Browser Runtime Validation

```
let's crawl the new pages and make sure nothing is broken in the console
```

**Expected behavior:**

- Opens each new/changed route in browser
- Captures console output
- Checks for errors, excessive warnings, render loops
- Reviews HAR for duplicate requests, subscription churn
- Documents findings in test plan table

---

## Test 8: Cleanup Phase

```
the gamification feature is verified done, clean it up
```

**Expected behavior:**

- Verifies `_AUDIT.md` shows 🟢 Verified Complete
- Compares plan against actual code — updates any drift
- Asks for confirmation before deleting `_TEST_PLAN.md` and `_AUDIT.md`
- Leaves only the corrected `_PLAN.md`

---

## Test 9: Multiple Features in Flight

```
I need to pause the dark mode work and start on offline support instead
```

**Expected behavior:**

- Acknowledges dark mode is paused (doesn't lose context)
- Starts fresh cycle for offline support
- Creates new plan and test plan docs
- Can resume dark mode later when asked

---

## Test 10: Bug Fix — Should NOT Trigger Full Cycle

```
there's a null pointer in the grade subscription, fix it
```

**Expected behavior:**

- Does NOT create plan/test plan docs (too small for full cycle)
- Fixes the bug directly
- Runs relevant tests to verify
- Simple, fast response

---

## Validation Checklist

After running test prompts, verify:

- [ ] Plan docs follow `docs/{FEATURE}_PLAN.md` naming
- [ ] Test plans cover all 7 layers (unit, integration, component storybook, interaction storybook, API, E2E, browser runtime)
- [ ] TODO list is generated and tracked via `manage_todo_list`
- [ ] Tests are written alongside implementation, not after
- [ ] Audit compares plan vs reality with pass/fail table
- [ ] Cleanup phase updates plan and deletes intermediate docs
- [ ] Agent asks for confirmation before destructive actions
- [ ] Agent doesn't over-activate on trivial bug fixes
