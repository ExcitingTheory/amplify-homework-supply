# Playwright Test Audit — Veracity Report

> Generated: 2026-08-05  
> Status: **Many tests claim to pass but do not fully exercise the UI workflows they describe.**

---

## Table of Contents

- [Onboarding Storybook E2E — Critical Issues](#onboarding-storybook-e2e--critical-issues)
  - [Tutorial Mode walkTaskTour()](#tutorial-mode-walktasktour)
  - [Quiz Mode walkQuizTaskTour()](#quiz-mode-walkquiztasktour)
  - [completionSequence vs Instructions Mismatch](#completionsequence-vs-instructions-mismatch)
- [Journey Tests — Per-Test Issue List](#journey-tests--per-test-issue-list)
- [Non-Journey Spec Files](#non-journey-spec-files)
- [Systemic Problems](#systemic-problems)
- [Recommendations](#recommendations)

---

## Onboarding Storybook E2E — Critical Issues

Files:
- `test/storybook/e2e/onboarding-modes.spec.ts`
- `test/storybook/e2e/helpers.ts`

### Tutorial Mode: `walkTaskTour()`

Step-by-step breakdown of what the test does vs. what a real user would do:

| Step | What the test does | What a real user would do | Verdict |
|------|-------------------|--------------------------|---------|
| 1 | Clicks the task card | Same | ✅ OK |
| 2 | Waits for SpotlightOverlay "Step 1 of N" | Same | ✅ OK |
| 3 | **Clicks "Skip" to dismiss the spotlight entirely** | Follows each highlighted step through the UI, clicking Next through all N steps | ❌ **FATAL: Bypasses the entire tutorial flow** |
| 4 | `page.goto(storyId)` hard-navigates to the story | Would be guided there by the spotlight's "Next" navigation | ❌ **Shortcut: programmatic navigation** |
| 4b | Waits **5 seconds** for `requestIdleCallback` | Wouldn't need to — spotlight drives timing | ⚠️ **Fragile completion listener** |
| 4c | `dispatchEvent(new MouseEvent("click"))` via `frame.evaluate()` | Would physically click real UI elements | ❌ **FATAL: Synthetic events bypass real interaction** |
| 5 | `openOnboardingPanel()` navigates back | Spotlight would return them automatically | ❌ **Shortcut** |
| 6 | Asserts CSS `text-decoration: line-through` + checkbox | Would see real success state after real task | ⚠️ **Checks rendering, not completion** |

### Quiz Mode: `walkQuizTaskTour()`

| Step | What the test does | What a real user would do | Verdict |
|------|-------------------|--------------------------|---------|
| 1 | Clicks task card | Same | ✅ OK |
| 2 | Waits for "Step 1 of N" | Same | ✅ OK |
| 3 | Clicks "Done" or "Skip" to dismiss | Would read hint, then go complete the task | ❌ **Dismisses without doing anything** |
| 4 | Waits for panel to reappear | — | — |
| 5 | **Calls `injectCompletionViaIframe()`** — writes `{ injectedByE2ETest: true }` to localStorage | Would navigate to the correct page and perform the task | ❌ **FATAL: Completely fakes completion** |
| 6 | Asserts checkbox + line-through | — | ❌ **Meaningless — test wrote the completed state itself** |

The helper code at line ~393 of `helpers.ts` has this comment:

```typescript
// In quiz mode, the actual quizStoryId pages (📄 Pages) don't have data-tour
// elements — completion is tracked via real page interactions (action-performed
// events). For E2E testing, we inject completion directly via localStorage.
await injectCompletionViaIframe(page, task.id, persona);
```

The injected data literally self-documents the cheat:

```typescript
metadata: { injectedByE2ETest: true }
```

### completionSequence vs Instructions Mismatch

Each task defines 6-8 instruction steps but `completionSequence` only has 1-2 clicks:

| Task | Instructions (user steps) | completionSequence (test clicks) | Missing |
|------|--------------------------|----------------------------------|---------|
| Set Up Your First Class | Browse → View → Click Create → **Fill form** → **Save** → **Copy join code** → **Verify** | `["create-section-button"]` | Form fill, save, verification |
| Create Your First Unit | Review → View → Click Create → **Use editor** → **Save** → **Confirm** | `["create-unit-button"]` | Editor interaction, content, save |
| Add a Quiz Block | Open editor → Click Insert → Select Quiz → **Configure quiz** → **Save** → **Confirm** | `["editor-toolbar", "quiz-block"]` | Quiz configuration, save |
| Add Vocabulary Words | Review → Open → Click Add → **Fill details** → **Record audio** → **Link to unit** → **Confirm** | `["add-word-button", "word-card"]` | Form fill, audio, linking |
| Assign Work to Students | Review → View dialog → Create → **Select unit** → **Set due date** → **Configure** → **Confirm** | `["unit-selector", "create-assignment-button"]` | Unit selection, date setting |
| View Student Grades | View → Click Grades tab → **Browse** → **Open grade** → **Leave feedback** → **Confirm** | `["assignments-section"]` | Grade review, feedback |
| Complete an Assignment (learner) | Overview → Explore → **Read** → **Answer quiz** → **Record audio** → **Review** → **Submit** | `["quiz-block", "quiz-answers"]` | Reading, answering, submission |
| Practice Vocabulary (learner) | Overview → Browse → **Click card** → **Play audio** → **Continue** | `["word-card"]` | Audio playback, practice |

---

## Journey Tests — Per-Test Issue List

### Journey 1: Learner — Complete Homework via Dashboard

`test/e2e/journeys/journey-01-learner-homework.spec.ts`

| # | Issue | Severity |
|---|-------|----------|
| 1 | Quiz answer interaction is blind — clicks all unchecked checkboxes without knowing which are correct | ⚠️ Medium |
| 2 | Doesn't verify quiz is properly configured (no correct answer exists to select) | ⚠️ Medium |
| 3 | Early `return` if `completionModal` already visible — test passes without doing work | ❌ High |
| 4 | Uses `waitForTimeout(2000-5000)` as race condition workarounds | ⚠️ Medium |
| 5 | MUI Switch click uses `force: true` to bypass overlapping layout — masks real UX bug | ⚠️ Medium |

### Journey 2: Learner — Gamification Dashboard

`test/e2e/journeys/journey-02-learner-gamification.spec.ts`

| # | Issue | Severity |
|---|-------|----------|
| 1 | Setup creates quiz block but **never adds answers** — student "completes" empty quiz | ❌ High |
| 2 | XP earning is assumed from clicking checkboxes — no verification XP was awarded | ❌ High |
| 3 | Dashboard widget assertions only check visibility, not data values | ⚠️ Medium |
| 4 | Early `return` if completion modal already shown | ⚠️ Medium |

### Journey 3: Instructor — Create Unit & Build Content

`test/e2e/journeys/journey-03-instructor-create-unit.spec.ts`

| # | Issue | Severity |
|---|-------|----------|
| 1 | Generally solid — actually tests real CRUD | ✅ |
| 2 | Dictionary/Files/Assignments tab checks are structural ("is visible") not functional | ⚠️ Low |

### Journey 4: Instructor — Grade Student Work

`test/e2e/journeys/journey-04-instructor-grading.spec.ts`

| # | Issue | Severity |
|---|-------|----------|
| 1 | Student "answers" quiz by clicking all unchecked checkboxes — doesn't know if answers exist | ⚠️ Medium |
| 2 | Early `return` if completion modal already visible — hides failures | ❌ High |
| 3 | Gradebook assertion only checks "student data" exists — doesn't verify accuracy or values | ⚠️ Medium |
| 4 | Uses `waitForTimeout(3000-5000)` as timing crutches | ⚠️ Low |

### Journey 5: Instructor — Create & Manage Sections

`test/e2e/journeys/journey-05-instructor-sections.spec.ts`

| # | Issue | Severity |
|---|-------|----------|
| 1 | Settings page assertions are purely structural: counts `input, select, [role="switch"]` > 0 | ⚠️ Medium |
| 2 | No actual settings change is made or verified | ⚠️ Medium |
| 3 | Doesn't test editing or deleting a section | ⚠️ Low |

### Journey 6: Learner — Peer Review & AI Memory

`test/e2e/journeys/journey-06-learner-peer-review.spec.ts`

| # | Issue | Severity |
|---|-------|----------|
| 1 | Multiple `.catch(() => false)` + `return` — tests pass silently when features don't exist | ❌ High |
| 2 | Peer review test only opens and closes dialog — doesn't create a room or review | ❌ High |
| 3 | AI Memory test returns early if panel isn't visible | ❌ High |
| 4 | `expect(hasReview \|\| hasGuidance).toBe(true)` — passes if either button exists even if neither works | ⚠️ Medium |

### Journey 7: Instructor — File & Question Management

`test/e2e/journeys/journey-07-instructor-recording.spec.ts`

| # | Issue | Severity |
|---|-------|----------|
| 1 | File upload checks `bodyText.includes("e2e-test-file")` — could match error messages | ⚠️ Medium |
| 2 | Questions tab: `expect(hasAddBtn \|\| hasQuestionList).toBe(true)` — loose OR condition | ⚠️ Medium |
| 3 | No actual question creation verified (form fill + save + persistence) | ❌ High |

### Journey 8: Admin — Platform Management

`test/e2e/journeys/journey-08-admin-management.spec.ts`

| # | Issue | Severity |
|---|-------|----------|
| 1 | Analytics assertion `bodyText.match(/\d+/)` matches ANY number (timestamps, element IDs) | ❌ High |
| 2 | `hasDataViz`: `canvas OR svg OR table OR text includes '%'` — extremely loose | ⚠️ Medium |
| 3 | Vocabulary management only opens form — doesn't submit or verify | ❌ High |
| 4 | Recycle bin matches "recycle OR deleted OR trash OR restore OR empty OR no items" | ⚠️ Medium |
| 5 | Authorization test passes on 404 — broken routing looks like successful authorization | ❌ High |

### Journey 9: Learner — Vocabulary & AI Practice

`test/e2e/journeys/journey-09-learner-vocabulary.spec.ts`

| # | Issue | Severity |
|---|-------|----------|
| 1 | AI chat test silently skips if chat button isn't found (nested `if` with no failure) | ❌ High |
| 2 | Vocabulary visibility assertion relies on typed text, not structured dictionary data | ⚠️ Low |

### Journey 10: All Roles — Settings & Personalization

`test/e2e/journeys/journey-10-settings-personalization.spec.ts`

| # | Issue | Severity |
|---|-------|----------|
| 1 | Switch toggle test toggles back — masks potential save failures | ⚠️ Low |
| 2 | Menu items assertion uses `includes("profile")` — could match unrelated text | ⚠️ Low |

### Journey 11: Offline Readiness & Sync Recovery

`test/e2e/journeys/journey-11-offline-sync.spec.ts`

| # | Issue | Severity |
|---|-------|----------|
| 1 | Goes to `/offline` directly — doesn't test the app naturally showing offline page on network drop | ⚠️ Medium |
| 2 | Cache test checks SW cache API — doesn't prove cached page actually renders offline | ⚠️ Medium |
| 3 | No verification that pending work syncs on reconnect | ⚠️ Medium |

---

## Non-Journey Spec Files

### `test/e2e/editor.spec.ts`

| # | Issue | Severity |
|---|-------|----------|
| 1 | Generally solid — real CRUD operations | ✅ |
| 2 | Quiz block test inserts but doesn't configure answers | ⚠️ Low |

### `test/e2e/chat.spec.ts`

| # | Issue | Severity |
|---|-------|----------|
| 1 | `test.skip()` if AI doesn't respond in 45s — passes on CI without API keys | ❌ High |

### `test/e2e/workbook.spec.ts`

| # | Issue | Severity |
|---|-------|----------|
| 1 | `test.skip(undefined, "No sections available")` — passes when no test data exists | ❌ High |

### `test/e2e/sections.spec.ts`

| # | Issue | Severity |
|---|-------|----------|
| 1 | Good — fills forms, verifies results | ✅ |

### `test/e2e/dictionary.spec.ts`

| # | Issue | Severity |
|---|-------|----------|
| 1 | Good — fills all fields, verifies persistence | ✅ |

### `test/e2e/settings.spec.ts`

| # | Issue | Severity |
|---|-------|----------|
| 1 | Good — verifies language preference persistence | ✅ |

### `test/e2e/navigation.spec.ts`

| # | Issue | Severity |
|---|-------|----------|
| 1 | Assertions like `text.length > 50` ("not a blank page") are meaningless | ⚠️ Medium |

---

## Systemic Problems

### 1. Onboarding tutorials skip the tutorial

Clicking "Skip" on step 1 then synthetically dispatching events is not testing the onboarding flow. The spotlight multi-step walkthrough — the core feature — is never exercised.

### 2. Quiz mode tests fake completion via localStorage injection

`injectCompletionViaIframe()` writes the "completed" state directly. The test self-documents this with `metadata: { injectedByE2ETest: true }`. No user action occurs.

### 3. `completionSequence` arrays are trivially short

Tasks describe 6-8 user actions but only require 1-2 `data-tour` clicks for "completion". The system cannot detect whether the user actually completed the workflow.

### 4. Early returns hide failures

Pattern: `if (already visible) return` — if a previous test's state leaks, the current test passes without executing its assertions.

### 5. Loose OR-based assertions

`expect(A || B || C).toBe(true)` passes when only tangentially related conditions match. A broken feature can pass because an unrelated element is present.

### 6. Structural-only checks

"Page has controls" (counts inputs > 0) doesn't verify those controls actually perform their function.

### 7. `waitForTimeout()` everywhere

Race condition band-aids instead of proper event-driven waits. Tests pass on fast machines and fail on slow CI.

### 8. `dispatchEvent` instead of real clicks

Synthetic events don't trigger the same browser behavior as real user interaction (hover states, focus management, scroll-into-view, pointer event listeners, accessibility handlers).

### 9. Silent test.skip() patterns

Tests that call `test.skip()` inside conditional blocks produce green CI runs even when the feature is entirely broken or unavailable.

---

## Recommendations

### Onboarding Tests — Must Fix

1. **Tutorial mode must walk through every spotlight step** — click "Next" N times, verify each step highlights the correct element, verify the element is interactable
2. **Quiz mode must perform the actual task** — navigate to the real page/story, fill forms, click buttons, verify state changes in the UI (not in localStorage)
3. **Remove `injectCompletionViaIframe`** — replace with real interaction sequences
4. **Replace `dispatchEvent` with `locator.click()`** — use Playwright's real click which checks visibility, scrolls into view, and fires all event phases
5. **Expand `completionSequence`** to match actual instruction steps — or remove it and use real interaction flows

### Journey Tests — Must Fix

1. **Remove early `return` patterns** — if prerequisite state doesn't exist, the test should fail explicitly
2. **Replace `test.skip()` in conditionals** — use `test.fixme()` or proper prerequisite handling
3. **Make assertions specific** — replace `bodyText.match(/\d+/)` with `expect(metricValue).toBeGreaterThan(0)`
4. **Verify quiz blocks have answers before students interact** — setup tests must validate their own output
5. **Authorization tests must distinguish 404 from 403** — check response status or specific unauthorized messaging

### General

1. **Replace `waitForTimeout()` with event-driven waits** — `waitForSelector`, `waitForResponse`, `expect().toBeVisible()`
2. **Remove `force: true` clicks** — if the element can't be clicked without force, that's a real bug to fix
3. **Add data verification assertions** — after creating content, verify the correct data appears (not just "page has text")
