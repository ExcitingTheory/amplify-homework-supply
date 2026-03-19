# Cypress E2E Test Status Summary

**Date**: 2026-03-15
**Tested By**: Systematic test run verification

## Executive Summary

**CRITICAL FINDING**: Most Cypress tests claim to be "refactored" but are NOT functional.
Only 1 out of 4 tested suites is fully passing.

## Test Results

### ✅ PASSING: workbook-spec.cy.ts

- **Status**: 1/1 passing (100%)
- **Duration**: ~24-29 seconds
- **Pattern**: UI-based, no DataStore programmatic shortcuts
- **Quality**: Gold standard - use as reference for all other tests

### ❌ FAILING: instructor-workflow.cy.ts

- **Status**: 2/7 passing (28.6%)
- **Duration**: ~6:40 minutes
- **Failures**:
  1. ✗ `instructor creates unit via chatbot` - `cy.click()` called on 2 elements (needs `.first()` or better selector)
  2. ✗ `instructor creates section manually` - Timeout: never found 'E2E Test Section'
  3. ✗ `instructor verifies document appears in search` - Timeout
  4. ✗ `instructor uses chatbot to add block types to unit` - Timeout
  5. ✗ `instructor reviews student grades on section detail page` - Timeout: never found 'E2E Test Section'
- **Passing Tests**:
  1. ✓ `instructor uploads document via chat sidebar` (12341ms)
  2. ✓ `instructor publishes the unit` (10863ms)
- **Root Causes**:
  - Selector issue: `[data-tour="create-unit-button"]` matches 2 elements (empty state + header)
  - Test interdependencies: Later tests fail because section creation failed
  - Missing/incorrect data-tour attributes

### ❌ FAILING: learner-workflow.cy.ts

- **Status**: 0/4 passing (0% - COMPLETELY BROKEN)
- **Duration**: ~5:02 minutes
- **Failures**:
  1. ✗ `learner joins section via code` - Can't find input: `input[name="code"], input[placeholder*="code" i]`
  2. ✗ `learner completes workbook with key block types` - Can't find '/View Workbook/i' button
  3. ✗ `learner grade auto-submits on completion` - Timeout: never found 'E2E Test Section'
  4. ✗ `learner views grades on section detail page` - Timeout: never found 'E2E Test Section'
- **Root Causes**:
  - Critical selector issues: join code input not found
  - Cascade failure: All tests fail because first test can't join section
  - Possible UI changes broke selectors
  - Depends on instructor-workflow test data (bad pattern)

### ❌ FAILING: global-chat.cy.ts

- **Status**: 0/10+ passing (0% - test output incomplete)
- **Duration**: Unknown (interrupted)
- **Failures** (partial list):
  1. ✗ `should display chat button on home page (logged in as instructor)`
  2. ✗ `should display chat button on sections page`
  3. ✗ `should display chat button on units page`
  4. ✗ `should display chat button on profile page`
  5. ✗ `should display chat button as learner on home page`
  6. ✗ `should open chat drawer when button is clicked`
  7. ✗ `should open chat when Cmd+Shift+C is pressed (Mac)`
  8. ✗ `should persist chat open state when navigating between pages`
  9. ✗ `should have sections context on home page`
  10. ✗ `should persist chat messages when closing and reopening chat`
- **Root Causes**:
  - Selector issue: `[data-testid="global-chat-button"]` not found
  - Possible component changes removed test attributes
  - Failing in beforeEach hooks (setup issues)

### ⏳ NOT YET TESTED:

- chatbot-workflows.cy.ts
- document-analysis.cy.ts
- search-functionality.cy.ts
- yjs-collaboration.cy.ts
- performance-metrics.cy.ts
- onboarding-spec.cy.ts
- i18n-validation-spec.cy.ts

## Critical Issues to Fix

### 1. Selector Problems (HIGH PRIORITY)

- Multiple elements matching same selector (`create-unit-button`)
- Missing/incorrect data-testid attributes
- Changed UI components without updating test selectors

### 2. Test Interdependencies (ARCHITECTURAL)

- Tests share state across test cases (bad pattern)
- Later tests fail when early tests fail
- Should be self-contained like workbook-spec.cy.ts

### 3. Missing Test Attributes (MEDIUM PRIORITY)

- Many UI components lack proper data-tour or data-testid attributes
- Global chat components missing expected selectors
- Section join form missing expected input selectors

## Recommended Actions

### Immediate (Must Fix):

1. **Fix instructor-workflow.cy.ts selector issue** - Add `.first()` to create-unit-button click
2. **Audit and add missing data-testid attributes** - Especially for:
   - Global chat button
   - Section join code input
   - View Workbook button
3. **Make tests self-contained** - Each test should create its own data via UI

### Short-term (Should Fix):

1. **Refactor learner-workflow.cy.ts** - Complete rewrite following workbook pattern
2. **Refactor global-chat.cy.ts** - Fix selectors and setup hooks
3. **Run remaining 7 untested suites** - Verify their actual functionality
4. **Consolidate duplicate test coverage** - Avoid redundant tests

### Long-term (Architecture):

1. **Establish test patterns doc** - workbook-spec.cy.ts as reference implementation
2. **Add selector validation** - Automated check that all data-tour/data-testid exist
3. **CI/CD integration** - Block PRs that break E2E tests
4. **Test isolation enforcement** - No shared state between test cases

## Pattern: Gold Standard (workbook-spec.cy.ts)

The workbook test demonstrates the correct pattern:

```typescript
// ✅ GOOD: Self-contained, UI-based
it("should create and complete workbook", () => {
  // 1. Login via UI
  cy.visit("/");
  cy.get("form").submit();

  // 2. Create unit via UI (not DataStore)
  cy.visit("/units");
  cy.get('[data-tour="create-unit-button"]').first().click();

  // 3. Extract ID from URL (not programmatic variable)
  cy.url().then((url) => {
    const unitId = url.match(/\/unit\/([^/]+)/)[1];
    cy.log(`Unit ID: ${unitId}`);
  });

  // 4. Use data-testid for interactions
  cy.get('[data-testid="answer-input"]').type("test");
  cy.get('[data-testid="answer-submit-button"]').click();

  // 5. Verify via UI state (not DataStore query)
  cy.contains("Correct").should("be.visible");
});
```

## Anti-Patterns to Avoid

```typescript
// ❌ BAD: Programmatic data creation
await DataStore.save(new Unit({ name: "Test" }));

// ❌ BAD: Selector matches multiple elements
cy.get('[data-tour="create-unit-button"]').click(); // Fails if 2+ buttons

// ❌ BAD: Shared state between tests
let unitId; // Used across multiple test cases
it("test1", () => {
  unitId = "abc";
});
it("test2", () => {
  cy.visit(`/unit/${unitId}`);
}); // Fails if test1 fails

// ❌ BAD: Missing test attributes
cy.get("button").contains("Submit").click(); // Fragile, breaks with text changes
```

## Next Steps

1. ✅ Document test status (this file)
2. ⏳ Fix instructor-workflow.cy.ts critical selector issue
3. ⏳ Run remaining 7 test suites to assess damage
4. ⏳ Create prioritized fix backlog based on importance
5. ⏳ Refactor all failing tests to match workbook pattern
6. ⏳ Add missing data-testid attributes to components
7. ⏳ Consider consolidating tests to reduce duplication
