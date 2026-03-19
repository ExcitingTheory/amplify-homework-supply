# Consolidated Cypress E2E Test Plan

**Goal**: Replace 11 fragile, interdependent tests with 2-3 robust, self-contained test suites

## Current State (Before Consolidation)

❌ **11 separate test files** with overlapping coverage:

- workbook-spec.cy.ts ✅ (1/1 passing - KEEP AS REFERENCE)
- instructor-workflow.cy.ts (3/7 passing)
- learner-workflow.cy.ts (0/4 passing)
- global-chat.cy.ts (0/10+ passing)
- chatbot-workflows.cy.ts (untested)
- document-analysis.cy.ts (untested)
- search-functionality.cy.ts (untested)
- yjs-collaboration.cy.ts (untested)
- performance-metrics.cy.ts (untested)
- onboarding-spec.cy.ts (untested)
- i18n-validation-spec.cy.ts (untested)

**Problems**:

- Tests share state (bad: `let unitId;` used across tests)
- Cascade failures (test 1 fails → tests 2-7 all fail)
- Duplicate coverage (instructor + learner + chatbot test same flows)
- Missing/broken selectors
- Programmatic shortcuts instead of UI-based testing

## New Structure (After Consolidation)

### ✅ Test Suite 1: Complete Teaching Workflow

**File**: `cypress/e2e/complete-workflow.cy.ts`  
**Duration**: ~3-5 minutes  
**Coverage**: End-to-end instructor + learner journey

**Flow**:

1. **Instructor Creates Content**
   - Login as instructor
   - Navigate to /units
   - Click create unit button (using `.first()` for multiple matches)
   - Add unit name "E2E Test Unit"
   - Add graded blocks via Insert menu:
     - Quiz block
     - Meaning Association block
     - Answer block (vocabulary)
     - Custom Answer block
   - Publish unit
   - Extract unit ID from URL

2. **Instructor Creates Section**
   - Navigate to /sections
   - Click create section button
   - Fill form: name "E2E Test Section", description
   - Submit and verify section appears
   - Extract join code from UI

3. **Instructor Assigns Unit**
   - Click on section card
   - Navigate to assignments tab
   - Click assign unit button
   - Select unit from list
   - Set due date (7 days from now)
   - Submit assignment

4. **Learner Joins Section**
   - Logout
   - Login as learner
   - Navigate to /sections
   - Click join section button
   - Enter join code
   - Submit and verify section appears

5. **Learner Completes Workbook**
   - Click on section
   - Click "View Workbook" button for assignment
   - Complete each graded block:
     - Answer quiz questions using `[data-testid="quiz-option-*"]`
     - Match vocabulary using `[data-testid="drag-box"]`
     - Type vocabulary answer using `[data-testid="answer-input"]`
     - Submit custom answer using `[data-testid="custom-answer-input"]`
   - Verify completion message

6. **Instructor Reviews Grade**
   - Logout
   - Login as instructor
   - Navigate to section detail
   - Click grades tab
   - Verify learner's grade appears
   - Verify accuracy score > 0

**Pattern**: Self-contained, UI-only, no shared state

---

### ✅ Test Suite 2: Chat & AI Features

**File**: `cypress/e2e/chat-ai-workflow.cy.ts`  
**Duration**: ~2-4 minutes  
**Coverage**: Global chat, AI content generation, document analysis

**Flow**:

1. **Global Chat Availability**
   - Login as instructor
   - Verify `[data-testid="global-chat-button"]` exists on:
     - Home page (/)
     - Units page (/units)
     - Sections page (/sections)
   - Click chat button
   - Verify `[data-testid="global-chat-drawer"]` opens
   - Type message in `[data-testid="chat-input"]`
   - Verify response appears in `[data-testid="chat-messages"]`

2. **Context-Aware Chat in Editor**
   - Create new unit via UI
   - Open editor chat tab `[data-testid="editor-chat-tab"]`
   - Verify chat has unit context
   - Request AI to add content
   - Verify chat responds with suggestions

3. **Document Upload (UI verification only)**
   - Navigate to file manager tab
   - Verify upload UI exists
   - Verify file list renders
   - (Skip actual upload to avoid long analysis times)

**Pattern**: Self-contained, UI-only, AI features verified but not deeply tested

---

### ✅ Test Suite 3: Specialized Features (Optional)

**File**: `cypress/e2e/specialized-features.cy.ts`  
**Duration**: ~2-3 minutes  
**Coverage**: Performance, i18n, collaboration

**Tests**:

1. **Performance Metrics** (lightweight check)
   - Load home page
   - Measure `window.performance.timing`
   - Verify page load < 3 seconds
   - Verify no console errors

2. **i18n Support** (smoke test)
   - Visit pages and verify translations load
   - Check for missing translation keys in console
   - Verify language switching works

3. **Yjs Collaboration** (basic check)
   - Skip for now (requires complex multi-tab setup)
   - Or verify provider initializes without errors

**Pattern**: Lightweight smoke tests, not comprehensive

---

## Deprecated Test Files

These files will be **archived** (moved to `cypress/e2e/_deprecated/`):

- instructor-workflow.cy.ts → Replaced by complete-workflow.cy.ts
- learner-workflow.cy.ts → Replaced by complete-workflow.cy.ts
- chatbot-workflows.cy.ts → Replaced by chat-ai-workflow.cy.ts
- global-chat.cy.ts → Replaced by chat-ai-workflow.cy.ts
- document-analysis.cy.ts → Replaced by chat-ai-workflow.cy.ts (UI check only)
- search-functionality.cy.ts → Covered in complete-workflow.cy.ts (section search)
- performance-metrics.cy.ts → Replaced by specialized-features.cy.ts (lightweight)
- onboarding-spec.cy.ts → Storybook-only, keep separate
- i18n-validation-spec.cy.ts → Replaced by specialized-features.cy.ts (smoke test)
- yjs-collaboration.cy.ts → Deferred (complex setup)

**Keep as-is**:

- workbook-spec.cy.ts → Gold standard reference implementation
- onboarding-spec.cy.ts → Storybook-specific, different scope

---

## Implementation Priority

1. **Phase 1** (Now): Build `complete-workflow.cy.ts`
   - Most critical user journey
   - Replaces 6 broken tests
   - ~300-400 lines total

2. **Phase 2** (Next): Build `chat-ai-workflow.cy.ts`
   - Important feature coverage
   - Replaces 3 tests
   - ~150-200 lines total

3. **Phase 3** (Optional): Build `specialized-features.cy.ts`
   - Nice-to-have validation
   - Replaces 3 tests
   - ~100-150 lines total

---

## Success Criteria

✅ All new tests are self-contained (no shared state)  
✅ All new tests use UI-only approach (no DataStore.save)  
✅ All new tests have proper data-testid/data-tour attributes  
✅ Test duration reduced (11 tests ~45min → 2-3 tests ~10min)  
✅ Test reliability improved (1/11 passing → 2-3/3 passing)  
✅ Maintenance burden reduced (fewer files, clearer patterns)

---

## Migration Steps

1. ✅ Create this plan document
2. ⏳ Build complete-workflow.cy.ts
3. ⏳ Run and verify complete-workflow.cy.ts
4. ⏳ Build chat-ai-workflow.cy.ts
5. ⏳ Run and verify chat-ai-workflow.cy.ts
6. ⏳ Archive deprecated test files
7. ⏳ Update package.json scripts
8. ⏳ Update CI/CD pipeline
9. ⏳ Document new test patterns in README
