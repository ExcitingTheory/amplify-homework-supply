# Journey Test Failures — Root Cause Analysis & Fix Plan

**Date**: 2026-08-30
**Report**: `test/journeys-report/`
**Results**: 14 passed, 12 failed (11 failed + 1 timed out) across 10 journey spec files

---

## Summary of Failure Categories

| Category | Journeys | Count | Root Cause |
|----------|----------|-------|------------|
| Page load timeout during login | 4, 5 | 2 | `page.goto()` never reaches `domcontentloaded` within 30s |
| Content not rendered in workbook | 1, 9 | 2 | Unit content/quiz blocks missing in student workbook view |
| Navigation after click fails | 2, 3 | 2 | Button click doesn't produce expected URL change |
| Locator ambiguity (strict mode) | 7, 10 (settings) | 2 | Locators match multiple DOM elements |
| Missing form field in test | 10 (section) | 1 | Required `description` field not filled before submit |
| Notification UI mismatch | 6 | 1 | Test expects popover but app navigates to `/profile/notifications` |
| Analytics locator ordering | 8 | 1 | `svg` matches tiny icon before the visible `<table>` |
| Service worker not activating | 11 | 1 | SW never reaches `active`/`controlling` state |

---

## Detailed Failure Analysis

### Failure 1: Page Load Timeouts (Journeys 4, 5)

**Tests**:
- `journey-04-instructor-grading.spec.ts:29` — "instructor creates unit with quiz block"
- `journey-05-instructor-sections.spec.ts:27` — "creating a section generates a join code"

**Error**: `page.goto("https://localhost:3000/...")` — Timeout 30000ms exceeded. Page snapshot shows only "Skip to main content" — the page never fully loaded.

**Root Cause**: The `login()` helper in `helpers.ts` calls `page.goto(loginPath, { waitUntil: 'domcontentloaded' })` with a 30s timeout. The page renders the `<a>` skip link but the React app never hydrates and the `domcontentloaded` event never fires within the timeout. This occurs because:

1. These tests run mid-suite (journeys are serial, `workers: 1`) so the dev server has accumulated significant memory/state from prior test runs.
2. The Next.js dev server may be compiling chunks on demand for these routes, causing slow initial loads.
3. No retry mechanism exists — a single slow page load fails the test permanently.

**Fix Plan**:
1. **App-side**: Investigate SSR performance for `/sections` and `/units` routes under load. Profile the dev server during test runs to identify bottlenecks (long compilation, large bundle chunks, slow data client initialization).
2. **App-side**: Check if the `domcontentloaded` event is being blocked by synchronous scripts or large inline data during SSR. The skip-to-main link rendering but no further content suggests the HTML shell loads but JS hydration stalls.
3. **Infra**: Consider whether the Amplify sandbox backend (DynamoDB, AppSync) has cold-start latency that compounds with dev server compilation time.

---

### Failure 2: Empty Workbook Content (Journeys 1, 9)

**Tests**:
- `journey-01-learner-homework.spec.ts:250` — "student opens workbook and interacts with quiz"
- `journey-09-learner-vocabulary.spec.ts:103` — "student opens workbook and sees vocabulary content"

**Error**:
- Journey 1: `[data-tour="quiz-block"]` not found — workbook shows empty editor with "No headings found"
- Journey 9: `expect(received).toContain("vocab...")` — received empty string `""`

**Root Cause**: The test suite is serial — earlier tests (in the same journey) create units and insert quiz blocks/vocabulary as the instructor. The student then opens the workbook expecting to see that content. The content is missing because:

1. **Unit not published**: The student workbook view may only render content from PUBLISHED units. The instructor tests create units but may not change their status from DRAFT to PUBLISHED. The `UnitsClient.jsx` code shows units are created with no explicit status (defaults to draft).
2. **Auto-save race condition**: The instructor editor auto-saves via GraphQL. The test waits for a GraphQL response but may not wait long enough for the Lexical editor state to serialize and persist. The student views the workbook before the content write is confirmed.
3. **Content not propagated to workbook view**: The workbook component (`/workbook/[id]`) may load the `Unit.data` field which is still null/empty if the editor save hasn't completed.

**Fix Plan**:
1. **App-side**: Verify the workbook route (`/workbook/[id]`) can render content from DRAFT units (for the unit owner or assigned students). If it requires PUBLISHED status, the test setup must publish the unit.
2. **App-side**: Check the editor auto-save flow — ensure `Unit.data` (the Lexical JSON field) is being written with the full editor state including quiz nodes. The `saveEditorContent()` function in `unitContext.js` should serialize the Lexical state to JSON and call `client.models.Unit.update()`.
3. **App-side**: Investigate whether the workbook correctly loads `Unit.data` and passes it to the Lexical editor in read-only mode. If `Unit.data` is null, the workbook shows an empty editor.

---

### Failure 3: Navigation After Button Click (Journeys 2, 3)

**Test**: `journey-02-learner-gamification.spec.ts:238` — "Practice button navigates to drill page"

**Error**: `page.waitForURL(/\/drill\//)` — Timeout 15000ms. Practice button clicked but URL didn't change.

**Root Cause**: The dashboard's Practice button calls `openDrill(unitId, unitName)` which does `router.push('/drill/${unitId}?drillType=mixed&count=10')`. The button was clicked (shows `[active]` state in snapshot) but the navigation didn't occur. Possible causes:
1. The Practice button on the dashboard card may open a `PracticeDrillConfigPopup` dialog instead of navigating directly (the units page has a practice config flow with `setPracticeConfigOpen(true)`).
2. The `router.push()` call may fail silently if the route doesn't exist or has an error during compilation.
3. The button the test clicks may be a different "Practice" button that doesn't trigger the `openDrill` handler.

**Test**: `journey-03-instructor-create-unit.spec.ts:28` — "creating a unit produces a new editor page with UUID"

**Error**: `page.waitForURL(/\/unit\/[a-f0-9-]+/)` — Timeout 15000ms. Create button clicked but URL didn't change. Report notes the button appears **disabled**.

**Root Cause**: The `data-tour="create-unit-button"` button has `disabled={work}` where `work` starts as `false`. When clicked, `createUnit()` sets `work=true` and calls `client.models.Unit.create()`. If the API call fails (auth issue, schema mismatch, network error), the `catch` block runs but `setIsWorking(false)` may not be called, leaving the button disabled. The accumulation of many "Untitled Unit" entries from prior test runs may also indicate the unit creation succeeds but `router.push()` fails. Additionally, if `work` is `true` from a previous click, the button stays disabled.

**Fix Plan**:
1. **App-side (Journey 2)**: Check if the dashboard Practice button opens a config dialog (like `PracticeDrillConfigPopup`) instead of navigating directly. The `DashboardClient.jsx` calls `router.push('/drill/...')` directly via `openDrill()`, but individual assignment cards may use a different handler. Verify the click handler path from the specific button the test finds.
2. **App-side (Journey 3)**: Add error handling in `createUnit()` to ensure `setIsWorking(false)` is called in the `catch` block and in a `finally` clause. Check whether `router.push()` is actually being called after unit creation succeeds. Add console logging for debugging.
3. **App-side (Journey 3)**: Investigate whether the dev server's route compilation for `/unit/[id]` is causing the `router.push()` to hang. The Next.js dev server may be slow to compile this dynamic route on first access.

---

### Failure 4: Locator Ambiguity — Strict Mode Violations (Journeys 7, 10)

**Test**: `journey-07-instructor-recording.spec.ts:51` — "files tab upload accepts files"

**Error**: `getByText('e2e-test-file')` resolved to **2 elements**. The uploaded file name appears twice in the file tree UI.

**Root Cause**: The file management UI renders the filename in both a list item and a detail/preview panel, or the file appears in two categories (e.g., "All Files" and a specific type bucket). The `getByText` locator matches both occurrences.

**Fix Plan**:
1. **App-side**: Investigate why the file name renders twice. The files tab UI (visible in the attached screenshot) shows a tree with categories (Images, Audio). If the file appears under multiple nodes or in both the tree and a preview area, the duplicate is expected. Consider adding `data-testid="file-list-item"` to individual file entries to allow more specific targeting.

**Test**: `journey-10-settings-personalization.spec.ts:24` — "student can change a setting"

**Error**: `switches.first().or(inputs.first())` resolved to **2 elements**: the global search `<input type="text" placeholder="Search...">` in MainToolbar and the `<input role="switch">` ("Show my name on leaderboards") on the settings page.

**Root Cause**: The locator `input:not([type="hidden"])` matches the toolbar's search input. The `.or()` of two `.first()` calls doesn't narrow to a single element — Playwright's strict mode sees both potential matches.

**Fix Plan**:
1. **App-side**: Add a `data-tour="settings-form"` or similar container attribute to the settings page's main content area so locators can be scoped.
2. **App-side**: Alternatively, add `data-testid` attributes to the settings switches/toggles for targeted selection.

---

### Failure 5: Missing Required Form Field (Journey 10 — Section Creation)

**Test**: `journey-10-settings-personalization.spec.ts:137` — "instructor creates a section to configure"

**Error**: `getByText('E2E Settings Section ...')` not found after 30s. The dialog is still open with the name filled in.

**Root Cause**: The section creation form in `SectionsClient.jsx` has a **required** `description` field (`<TextField required ...>`). The test fills only the `name` field:
```typescript
await page.locator('[data-tour="section-form"] input[name="name"]').fill(sectionName);
```
It never fills the `description` textarea. When the submit button is clicked, HTML5 form validation prevents submission and shows "Please fill out this field" (visible in the attached screenshot). The section is never created, so the test times out waiting for it to appear.

**Fix Plan**:
1. **App-side**: Determine whether the `description` field should truly be required for section creation. If sections can reasonably have no description, remove the `required` attribute from the description `<TextField>`.
2. **App-side**: If `description` is required, it should remain required — this is correct form validation behavior. The gap is in the test setup, but since the test exercises the real form flow, the fix should be in the app if the requirement is wrong. Other journey tests (1, 4, 5) DO fill the description field, so this appears to be a test-level omission that should be fixed in the test code (adding `.fill('Test description')` for the description field).

> **Note**: This is the one case where the test has a gap — it doesn't fill a required field. The other journey tests that create sections (journeys 1, 4, 5) correctly fill both name AND description. The fix is to add the missing description fill to this test, mirroring the pattern used in the other journeys.

---

### Failure 6: Notification UI Mismatch (Journey 6)

**Test**: `journey-06-learner-peer-review.spec.ts:245` — "notification bell opens notification panel"

**Error**: `expect(hasResponse).toBe(true)` — Expected `true`, Received `false`. The notification button clicked but no popover/dialog appeared and the URL didn't contain "notification".

**Root Cause**: The notification bell in `MainToolbar.jsx` (line 1068) calls `router.push('/profile/notifications')` on click. The test checks:
```typescript
const hasResponse =
  (await notifPopover.isVisible(...)) || page.url().includes("notification");
```
The `router.push()` navigates to `/profile/notifications`, which should make `page.url().includes("notification")` return `true`. However, the navigation may not complete within the 5s timeout for the popover visibility check, and the URL check happens immediately after, before the router has changed the URL.

**Fix Plan**:
1. **App-side**: The notification button correctly navigates to a page. No app change needed unless a popover UX is desired.
2. **App-side**: If the notification flow was recently changed from a popover to page navigation, verify the `/profile/notifications` route loads correctly and produces a meaningful notifications list. The `router.push()` call is the correct behavior but the route may have load issues similar to the page timeout failures (Category 1).

---

### Failure 7: Analytics Locator Ordering (Journey 8)

**Test**: `journey-08-admin-management.spec.ts:26` — "admin analytics page shows real metric data"

**Error**: `locator('canvas, svg, table').first()` resolved to a hidden 12×12 SVG icon, not the visible data table.

**Root Cause**: The analytics page (`/admin/analytics`) contains small SVG icons (e.g., in stat cards) that match the `svg` selector before the visible `<table>` for "Daily Breakdown". The `.first()` picks the first DOM-order match, which is a tiny hidden decorative SVG.

**Fix Plan**:
1. **App-side**: Add `data-testid="analytics-chart"` or `data-testid="analytics-table"` to the main data visualization elements on the analytics page. This allows tests to target the correct element without ambiguous selectors.
2. **App-side**: The analytics page (visible in attached screenshot) shows stat cards with numbers ("Avg Daily Active Users: 0", "Total Page Views: 7", etc.) and likely has a "Daily Breakdown" table lower on the page. Adding semantic `data-testid` attributes to these elements is the correct fix.

---

### Failure 8: Service Worker Not Activating (Journey 11)

**Test**: `journey-11-offline-sync.spec.ts:64` — "service worker is active and controls the page"

**Error**: `Test timeout of 120000ms exceeded` on `page.evaluate` — `navigator.serviceWorker.ready` never resolved.

**Root Cause**: The service worker registration may be:
1. **Not registered in dev mode**: The Next.js dev server may not serve the service worker, or the SW registration is conditional on production builds.
2. **SW registration blocked by HTTPS**: The test uses `https://localhost:3000`. Service workers require HTTPS (localhost is exempt) but the Playwright browser context may not have the right configuration.
3. **SW compilation error**: The service worker script may fail to compile or install, causing `navigator.serviceWorker.ready` to hang indefinitely since no SW transitions to `active`.

**Fix Plan**:
1. **App-side**: Check `public/sw.bundle.js` or the SW registration code to verify the service worker is registered in development mode. Many Next.js PWA setups (e.g., `next-pwa`) only register the SW in production.
2. **App-side**: Check the service worker registration code (likely in `app/layout.tsx` or a dedicated SW registration component). Verify it's not guarded by `process.env.NODE_ENV === 'production'`.
3. **App-side**: If the SW is only for production, the journey test needs to run against a production build. Consider adding a `next build && next start` step for offline journey tests, or enabling SW in dev mode for testing.

---

## Priority Order for Fixes

| Priority | Failure | Impact | Effort |
|----------|---------|--------|--------|
| **P0** | Page load timeouts (J4, J5) | Blocks 2 journeys entirely; indicates SSR/dev server perf issue | Medium |
| **P0** | Empty workbook content (J1, J9) | Core feature broken — students can't see assigned content | Medium |
| **P1** | Create unit navigation (J3) | Core instructor workflow broken | Low-Medium |
| **P1** | Practice button navigation (J2) | Gamification feature broken | Low |
| **P1** | Section form missing description (J10) | Test gap + possible UX question about required field | Low |
| **P2** | Notification UI mismatch (J6) | Navigation timing; feature works but test verification is racy | Low |
| **P2** | Analytics locator (J8) | Test targeting issue; app needs `data-testid` | Low |
| **P2** | File list duplicate (J7) | Test targeting issue; app needs `data-testid` | Low |
| **P2** | Settings switch locator (J10) | Test targeting issue; app needs scoped container | Low |
| **P3** | Service worker (J11) | PWA/offline feature — may only work in production builds | Medium |

---

## Cross-Cutting App-Side Improvements

### 1. Add `data-testid` / `data-tour` Attributes
Several failures stem from ambiguous locators. The following components need testability attributes:

| Component | Attribute Needed | File |
|-----------|-----------------|------|
| Analytics stat cards | `data-testid="analytics-metric"` | Admin analytics page |
| Analytics data table | `data-testid="analytics-table"` | Admin analytics page |
| File list items | `data-testid="file-list-item"` | Files tab in editor |
| Settings form container | `data-tour="settings-form"` | Settings page |
| Settings toggles | `data-testid="setting-switch"` | Settings page |

### 2. Error Handling in `createUnit()`
The `createUnit()` function in `UnitsClient.jsx` should:
- Always call `setIsWorking(false)` in a `finally` block
- Log navigation errors from `router.push()`
- Handle the case where unit creation succeeds but navigation fails

### 3. SSR Performance Investigation
The page load timeouts suggest the dev server struggles under sustained E2E test load. Investigate:
- Route compilation time for dynamic routes (`/unit/[id]`, `/sections`)
- Data client initialization time in SSR
- Whether large datasets from prior test runs slow down `observeQuery()` subscriptions

### 4. Workbook Content Loading
Verify the workbook route correctly loads and renders `Unit.data`:
- Confirm the workbook works for both PUBLISHED and DRAFT units (for assigned students)
- Add loading/empty states with clear messaging when `Unit.data` is null
- Ensure the Lexical editor in read-only mode handles empty/null content gracefully

---

## Files to Modify

### App Source (require confirmation)
- `app/[locale]/units/UnitsClient.jsx` — `createUnit()` error handling
- `app/[locale]/sections/SectionsClient.jsx` — evaluate `description` required attribute
- `app/[locale]/admin/analytics/` — add `data-testid` attributes
- `src/components/MainToolbar.jsx` — notification click behavior (verify routing works)
- Settings page component — add scoped `data-tour` container
- File management component — add `data-testid` to file list items
- Service worker registration — check dev-mode availability

### Test Files (no confirmation needed)
- `journey-10-settings-personalization.spec.ts` — add missing description field fill

---

## Phase 2: Selector Clarity & Testability Improvements

### Current State — Full Audit

All three E2E test suites audited: **journeys** (11 specs), **standard e2e** (8 specs), **collaboration** (6 specs + helpers). Combined ~250 unique selectors.

| Suite | STABLE | MODERATE | FRAGILE | Total |
|-------|--------|----------|---------|-------|
| Journeys | ~35 | ~40 | ~30 | ~105 |
| Standard E2E | 44 | 27 | 14 | 85 |
| Collaboration | 30 | 20 | 19 | 69 |
| **Combined** | **~109** | **~87** | **~63** | **~259** |

Fragility breakdown:

| Rating | Count | % | Description |
|--------|-------|---|-------------|
| STABLE | ~109 | 42% | `data-tour`, `data-testid`, `#id` — survives refactors |
| MODERATE | ~87 | 34% | `getByRole`, `aria-label`, scoped attrs — stable if semantics stay |
| FRAGILE | ~63 | 24% | `[class*="..."]`, tag-only, placeholder text, `.MuiSwitch-root`, hardcoded English text |

**Goal**: Eliminate all FRAGILE selectors by adding `data-tour` or `data-testid` to the target elements, then update tests to use them.

### Convention

- **`data-tour`** — page landmarks and major interactive areas (already used for onboarding spotlight tour). Use for containers, pages, and primary actions.
- **`data-testid`** — individual elements within a feature area that tests need to target. Use for specific controls, list items, and data display elements.
- **Naming**: kebab-case, scoped by feature. Example: `data-testid="analytics-stat-card"`, `data-tour="leaderboard-page"`.

### Attributes to Add — By Component

#### MainToolbar (`src/components/MainToolbar.jsx`)

| Element | Line | Attribute to Add |
|---------|------|------------------|
| Notification bell `<IconButton>` | ~1066 | `data-tour="notification-bell"` |

#### Settings Page (`app/[locale]/settings/page.jsx`)

| Element | Line | Attribute to Add |
|---------|------|------------------|
| Page root container | ~47 | `data-tour="settings-page"` |
| Leaderboard opt-in switch | ~535 | `data-testid="setting-leaderboard-opt-in"` |
| Reduced motion switch | ~570 | `data-testid="setting-reduced-motion"` |
| High contrast switch | ~588 | `data-testid="setting-high-contrast"` |
| Show badges switch | ~621 | `data-testid="setting-show-badges"` |
| Show anti-badges switch | ~641 | `data-testid="setting-show-anti-badges"` |

#### Admin Analytics (`app/[locale]/admin/analytics/AnalyticsClient.tsx`)

| Element | Line | Attribute to Add |
|---------|------|------------------|
| Page root `<Box>` | ~250 | `data-tour="analytics-page"` |
| Each `StatCard` `<Card>` | ~79 | `data-testid="analytics-stat-card"` |
| Daily breakdown `<table>` | ~400 | `data-testid="analytics-daily-table"` |

#### File Manager (`src/components/Editor3/components/FileManager2.jsx`)

| Element | Line | Attribute to Add |
|---------|------|------------------|
| File row container | ~5034 | `data-testid="file-list-item"` |
| Upload input area | near file tab | `data-testid="file-upload-input"` |

#### Dashboard (`app/[locale]/DashboardClient.jsx`)

| Element | Line | Attribute to Add |
|---------|------|------------------|
| Practice button | ~840 | `data-testid="practice-button"` |
| Next step / "Start" CTA | near hero | `data-testid="dashboard-next-step"` |

#### Quiz Editor (`src/components/Editor3/components/QuizEditor.jsx`)

| Element | Line | Attribute to Add |
|---------|------|------------------|
| "Add Answer" input | ~448 | `data-testid="quiz-add-answer"` |
| Answer option checkbox | per option | `data-testid="quiz-answer-option"` |
| Edit/Done toggle button | per block | `data-testid="quiz-edit-toggle"` |

#### Leaderboard (`src/components/Leaderboard/LeaderboardTable.tsx`)

| Element | Line | Attribute to Add |
|---------|------|------------------|
| Page container | ~170 | `data-tour="leaderboard-page"` |
| `<TableContainer>` | ~80 | `data-testid="leaderboard-table"` |

#### XP History (`app/[locale]/xp-history/page.jsx`)

| Element | Line | Attribute to Add |
|---------|------|------------------|
| Page root `<Box>` | ~38 | `data-tour="xp-history-page"` |
| History `<List>` | ~54 | `data-testid="xp-history-list"` |

#### Squads (`app/[locale]/squads/page.jsx`)

| Element | Line | Attribute to Add |
|---------|------|------------------|
| Page container | root | `data-tour="squads-page"` |
| Create/Join button | primary action | `data-testid="squads-action-button"` |

#### Offline Page (`app/[locale]/offline/page.tsx`)

| Element | Line | Attribute to Add |
|---------|------|------------------|
| `<Container>` | ~16 | `data-tour="offline-page"` |
| Retry/Refresh button | action button | `data-testid="offline-retry-button"` |

#### Section Detail / Gradebook (`app/[locale]/section/[id]/page.jsx`)

| Element | Line | Attribute to Add |
|---------|------|------------------|
| Instructor `<TableContainer>` | ~2336 | `data-testid="gradebook-table"` |
| Student grade `<Table>` | ~2041 | `data-testid="student-grade-table"` |
| Section AI settings container | settings tab | `data-testid="section-ai-settings"` |
| Section gamification settings | gamification tab | `data-testid="section-gamification-settings"` |

#### Word Form (`src/components/Editor3/components/` or dictionary component)

| Element | Line | Attribute to Add |
|---------|------|------------------|
| Word save/submit button | in word-form | `data-testid="word-save-button"` |

### Fragile Selectors to Replace in Tests

After adding the attributes above, update these test selectors:

| Current Fragile Selector | Replace With | Test File(s) |
|--------------------------|-------------|--------------|
| `[class*="metric"]`, `[class*="stat"]` | `[data-testid="analytics-stat-card"]` | J08 |
| `canvas, svg, table` (first) | `[data-testid="analytics-daily-table"]` | J08 |
| `input[placeholder*="Add Answer"]` | `[data-testid="quiz-add-answer"]` | J01, J02, J04, J06 |
| `.MuiSwitch-root` | `[data-testid^="setting-"]` or `[role="switch"]` scoped | J05, J10 |
| `[class*="xp"]`, `[class*="history"]` | `[data-testid="xp-history-list"]` | J02 |
| `[class*="squad"]` | `[data-tour="squads-page"]` | J02 |
| `[class*="card"]`, `[class*="Card"]` | scoped `[data-tour="dashboard-hero"]` child | J02, J06 |
| `[class*="popover"]`, `[class*="drawer"]` | `[data-tour="notification-bell"]` + URL check | J06 |
| `[class*="question"]` | `[data-tour="questions-tab"]` child with `data-testid` | J07 |
| `[class*="dropzone"]`, `[class*="upload"]` | `[data-testid="file-upload-input"]` | J03 |
| `switches.first().or(inputs.first())` | `[data-testid="setting-leaderboard-opt-in"]` | J10 |
| `getByText('e2e-test-file')` | `[data-testid="file-list-item"]` filtered by text | J07 |
| `table.first()` (unscoped) | `[data-testid="leaderboard-table"]` or `[data-testid="gradebook-table"]` | J02, J04, J05 |
| `li[data-value="PUBLISHED"]` | `getByRole("option", { name: /published/i })` | J09 |
| `button:has-text("Add")` (broad) | `[data-testid="word-save-button"]` | J07, J08 |
| `getByRole("button", { name: /save\|add\|create\|submit/i })` | `[data-testid="word-save-button"]` | J07, J09 |

### Implementation Order

1. **Batch 1 — Unblock failing tests** (fixes failures directly):
   - Settings page: `data-tour="settings-page"` + `data-testid` on switches
   - Analytics page: `data-testid="analytics-stat-card"`, `data-testid="analytics-daily-table"`
   - File manager: `data-testid="file-list-item"`
   - MainToolbar: `data-tour="notification-bell"`

2. **Batch 2 — Stabilize passing tests** (prevent future flakes):
   - Quiz editor: `data-testid="quiz-add-answer"`, `data-testid="quiz-answer-option"`
   - Dashboard: `data-testid="practice-button"`
   - Leaderboard: `data-tour="leaderboard-page"`, `data-testid="leaderboard-table"`
   - Gradebook: `data-testid="gradebook-table"`

3. **Batch 3 — Complete coverage** (all remaining fragile selectors):
   - XP history, Squads, Offline page attributes
   - Word form buttons
   - Section detail settings containers
   - Update all `[class*="..."]` selectors in tests

4. **Batch 4 — Test updates** (after all attributes are in place):
   - Update all journey spec files to use the new stable selectors
   - Remove all `[class*="..."]` and placeholder-based selectors
   - Replace `.first()` calls with scoped `data-testid` selectors where possible

---

### Standard E2E Tests — Fragile Selectors

| Selector | File | Risk | Recommended Fix |
|----------|------|------|-----------------|
| `[class*="amplify-alert"], [data-amplify-error]` | auth.spec.ts | MUI/Amplify class rename | Use `getByRole("alert")` |
| `getByText("Untitled Unit").first()` | editor.spec.ts | i18n / default name change | Add `data-tour="unit-title"` to title element |
| `.MuiInput-input:visible` | editor.spec.ts | MUI version upgrade | Add `data-testid="unit-name-input"` to the title `TextField` |
| `main, [role='main'], body` | navigation.spec.ts | `body` always matches | Add `data-tour` page markers per route |
| `getByText(/guild\|members\|XP\|create\|join/i)` | navigation.spec.ts | Overly broad regex | Add `data-tour="guilds-page"`, assert that |
| `getByText(/progress\|streak\|badge\|activity\|level/i)` | navigation.spec.ts | Overly broad regex | Add `data-tour="profile-page"`, assert that |
| `svg` (tag only) | navigation.spec.ts | Matches any SVG on page | Add `data-tour="skill-tree"` to the skill tree SVG |
| `getByText(/no skills\|get started\|empty/i)` | navigation.spec.ts | Broad empty-state text | Add `data-tour="skills-empty-state"` |
| `getByText(/skill\|mastery\|progress/i)` | navigation.spec.ts | Broad, matches other content | Add `data-tour="skills-content"` |
| `.MuiDrawer-anchorLeft` | navigation.spec.ts | MUI class rename | Add `data-tour="nav-drawer"` to `Drawer` |
| `body` textContent check | workbook.spec.ts | Always matches | Use `[data-tour="workbook"]` content check |
| `getByPlaceholder("Ask me anything...")` | chat.spec.ts | i18n / placeholder change | Already has `data-testid="chat-input"` — use that |

### Standard E2E — Attributes to Add in App Code

| Component | File | Attribute |
|-----------|------|-----------|
| Unit title heading | `app/[locale]/unit/[id]/` editor area | `data-tour="unit-title"` |
| Unit name inline edit input | Editor `ToolBarPlugin` or title `TextField` | `data-testid="unit-name-input"` |
| Navigation drawer | `src/components/MainToolbar.jsx` `Drawer` | `data-tour="nav-drawer"` |
| Guilds page root | `app/[locale]/guilds/` or squads page | `data-tour="guilds-page"` |
| Profile page root | `app/[locale]/profile/` | `data-tour="profile-page"` |
| Skill tree SVG | `src/components/Gamification/SkillTree` or similar | `data-tour="skill-tree"` |
| Skills empty state | Same component | `data-tour="skills-empty-state"` |
| Skills content container | Same component | `data-tour="skills-content"` |

---

### Collaboration E2E Tests — Fragile Selectors

| Selector | File | Risk | Recommended Fix |
|----------|------|------|-----------------|
| `getByText("Untitled Unit")` | helpers.ts | i18n / default name change | Use `data-tour="unit-title"` (same fix as standard e2e) |
| `getByText("Join Peer Review")` | helpers.ts | Hardcoded English nav label | Add `data-tour="join-peer-review-nav"` to the nav item |
| `text="Kai"` | collaborative-chat.spec.ts | Hardcoded bot name | Add `data-testid="ai-participant"` to the AI user chip |
| `getByText("👍 1")` | collaborative-chat.spec.ts | Exact emoji+count format | Add `data-testid="reaction-count"` to reaction badges |
| `getByText(/is typing/)` | collaborative-chat.spec.ts | i18n typing indicator | Add `data-testid="typing-indicator"` |
| `getByText(/collaborative\|study group/i)` | group-practice-drill.spec.ts | i18n toggle label | Add `data-testid="collaborative-toggle"` to the switch |
| `text=/[A-Z0-9]{6}/` | group-practice-drill.spec.ts | Greedy regex — false positives | Use `[data-testid="room-code"]` (already exists, use consistently) |
| `input[placeholder="#new-topic"]` | collaborative-chat.spec.ts | i18n placeholder text | Add `data-testid="new-topic-input"` |
| `textarea[placeholder*="Type a message"]` | collaborative-chat, peer-review | i18n placeholder text | Add `data-testid="chat-message-input"` |
| `[class*="MuiChip"]` filtered by "AI" | collaborative-chat.spec.ts | MUI class rename | Add `data-testid="ai-chip"` to the AI indicator chip |
| `[class*="MuiDialog-paperFullScreen"]` | group-practice-drill.spec.ts | MUI internal class | Use `getByRole("dialog")` + `data-tour="practice-drill"` |
| `[class*="roomCode"]` | group-practice-drill.spec.ts | Custom class rename | Use `[data-testid="room-code"]` (already exists) |
| `div[role="dialog"][class*="fullScreen"]` | group-practice-drill.spec.ts | MUI class hybrid | Use `getByRole("dialog")` scoped by `aria-labelledby` |
| `input:visible` `.first()` | helpers.ts | First visible input on page | Scope to container: `dialog.locator('input')` |
| `table` `.first()` | grading-workflow, section-join | First table — position dependent | Add `data-testid="gradebook-table"` and `data-testid="roster-table"` |
| `input[type="checkbox"]` `.last()` | group-practice-drill.spec.ts | Last checkbox — position dependent | Add `data-testid="collaborative-checkbox"` |
| `locator("label").last()` | group-practice-drill.spec.ts | Last label — position dependent | Scope to parent with `data-testid` |
| `locator("input")` bare in dialog | helpers.ts | Assumes single input | Scope: `dialog.locator('input[name="code"]')` |
| `button[title="Save now (automatic...)"]` | helpers.ts | Exact tooltip string | Add `data-testid="save-button"` to the save button |

### Collaboration — Attributes to Add in App Code

| Component | File | Attribute |
|-----------|------|-----------|
| Collaborative chat message input | `src/components/CollaborativeChat/` | `data-testid="chat-message-input"` |
| New topic input | Same component | `data-testid="new-topic-input"` |
| AI participant chip | Chat user list/badge | `data-testid="ai-participant"` |
| AI indicator chip | Message bubble or header | `data-testid="ai-chip"` |
| Reaction badge | Message reaction component | `data-testid="reaction-count"` |
| Typing indicator | Chat typing indicator component | `data-testid="typing-indicator"` |
| Collaborative mode toggle | Practice drill config | `data-testid="collaborative-toggle"` |
| Join Peer Review nav item | `MainToolbar.jsx` or nav drawer | `data-tour="join-peer-review-nav"` |
| Save button in editor toolbar | `src/components/Editor3/ToolBarPlugin` | `data-testid="save-button"` |
| Section roster table | `app/[locale]/section/[id]/` | `data-testid="roster-table"` |
| Practice drill full-screen dialog | `PracticeDrill` component | Use existing `data-tour="practice-drill"` on dialog root |

---

### i18n Fragility — Cross-Cutting Concern

Many MODERATE selectors use `getByRole("button", { name: /english text/i })`. These work today but will break when translations are active. Prioritize fixing these in components that are translated first.

**Pattern to adopt**: Prefer `data-testid` or `data-tour` for action buttons in tests. Fall back to `getByRole` only when the accessible name is stable (e.g., icon-only buttons with fixed `aria-label`).

| i18n-sensitive selector pattern | Count | Fix approach |
|---------------------------------|-------|-------------|
| `getByRole("button", { name: /create/i })` | 4 | Scope inside `data-tour` container (already done in some places) |
| `getByRole("button", { name: /start/i })` | 6 | Add `data-testid="start-button"` to timer gate |
| `getByRole("button", { name: /practice/i })` | 3 | Add `data-testid="practice-button"` |
| `getByText("Untitled Unit")` | 3 | Add `data-tour="unit-title"` |
| `li` filter `{ hasText: /quiz\|multiple choice/i }` | 5 | Add `data-testid="insert-quiz-menu-item"` |
| Placeholder-based selectors | 4 | Use `data-testid` instead |
| Exact English text assertions | ~8 | Use `data-testid` + structural assertions |

### Complete Attribute Addition Summary

| Batch | App Files to Modify | Attributes Added | Test Files to Update |
|-------|--------------------|-----------------|--------------------|
| **1** | 5 app files | 12 attributes | 4 journey specs |
| **2** | 6 app files | 10 attributes | 6 journey + 2 standard specs |
| **3** | 8 app files | 15 attributes | 4 standard + 3 collab specs |
| **4** | 5 app files | 11 attributes | 3 collab specs + helpers |
| **Total** | **~20 app files** | **~48 attributes** | **~16 test files** |
