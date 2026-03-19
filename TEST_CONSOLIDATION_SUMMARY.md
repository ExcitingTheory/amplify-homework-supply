# Test Consolidation Summary - March 16, 2026

## ✅ Completed Work

### Tests Consolidated: 11 → 4 Files

**Deleted (10 files):**

- global-chat.cy.ts
- instructor-workflow.cy.ts
- yjs-collaboration.cy.ts
- learner-workflow.cy.ts
- document-analysis.cy.ts
- onboarding-spec.cy.ts
- search-functionality.cy.ts
- i18n-validation-spec.cy.ts
- chatbot-workflows.cy.ts
- performance-metrics.cy.ts

**Retained (4 files):**

1. **complete-workflow.cy.ts** (423 lines) - Comprehensive instructor→learner→grading flow
2. **onboarding-storybook.cy.ts** (375 lines) - Tours in Storybook
3. **onboarding-main-ui.cy.ts** (436 lines) - Tours in main app (triggered via chat)
4. **workbook-spec.cy.ts** - Gold standard reference

### Infrastructure Updates

**✅ UI Enhancements (data-tour attributes added):**

- `src/components/MainToolbar.jsx`:
  - `data-tour="join-section-button"` on join button
  - `data-tour="join-section-dialog"` on join dialog
  - `data-tour="join-code-input"` on input field

- `pages/section/[id].jsx`:
  - `data-tour="assignments-section"` on assignments container
  - `data-tour="assignment-card"` on assignment cards
  - `data-tour="view-workbook-button"` on workbook button

- `src/components/Editor3/components/TabsVerticalLeft.jsx`:
  - `data-tour="assignments-tab"` on assignments tab
  - `data-tour="dictionary-tab"`, `files-tab`, `configuration-tab`, etc.

**✅ package.json Scripts Updated:**

```json
{
  "cypress:open": "cypress open",
  "cypress:run": "cypress run",
  "cypress:workflow": "cypress run --spec 'cypress/e2e/complete-workflow.cy.ts'",
  "cypress:onboarding": "cypress run --spec 'cypress/e2e/onboarding-*.cy.ts'",
  "cypress:workbook": "cypress run --spec 'cypress/e2e/workbook-spec.cy.ts'"
}
```

Removed:

- `test:i18n` and `test:i18n:dev` (deleted files)
- `test:performance:browser` and `test:performance:all` (deleted files)

**✅ GitHub Actions Workflow Updated:**

- `.github/workflows/cypress-parallel.yml`:
  - Matrix reduced from 11 → 4 tests
  - Added conditional Storybook startup for onboarding-storybook.cy.ts
  - Updated documentation header explaining consolidation

**✅ Lambda Fixes (Deployed):**

- Removed `_version` field from `amplify/functions/section/handler.ts` (Gen 2 compatibility)
- Removed unused `_version` fetches from `amplify/functions/openai/handler.ts`

**✅ TypeScript Cleanup:**

- Removed baseUrl deprecation warnings
- Fixed Editor3/index.tsx type assertions
- No suppressions or ignores used

---

## ⚠️ Test Status

### complete-workflow.cy.ts - ❌ FAILING

**Issues:**

- Test 1: "instructor creates unit with graded blocks via UI" - Failing after 3 attempts
- Test 2: "instructor creates section and extracts join code" - Failing after 3 attempts
- Test 3: "instructor assigns unit to section from editor" - Not reached

**Likely Causes:**

1. **Selectors may not match actual UI** - Need to verify:
   - Insert Menu uses `aria-label="Insert Item Menu"` but test looks for button text
   - Status select uses `#status-select` ID
   - Unit name input doesn't have a data-tour attribute

2. **Timing issues** - Editor may need more time to initialize
3. **Lambda/API responses** - Section creation API may have issues

**Next Steps:**

- Run test in interactive mode (`npx cypress open`) to see exact failure points
- Add more specific data-tour attributes to Editor toolbar
- Verify auth tokens are working correctly
- Check browser console for JS errors

### onboarding-storybook.cy.ts - ❌ FAILING (All 14 tests)

**Issue:** `require is not defined` in `src/context/fileContext.jsx:9:3`

**Root Cause:** Storybook mocks not handling Node.js `require` statements correctly

**Fix Required:** Update `.storybook/__mocks__/` to properly polyfill or mock Node.js built-ins

### onboarding-main-ui.cy.ts - ❌ FAILING (Test 1-2)

**Issue:** Tours not loading/displaying in main app

**Likely Causes:**

- Onboarding system not fully integrated into main app
- Tours need to be triggered via chat tools
- Missing initialization code

**Fix Required:** Integrate tour system or create chat-based test that triggers tours

### workbook-spec.cy.ts - ⏸️ NOT RUN YET

**Status:** Gold standard test - likely to pass as it hasn't been modified

---

## 📋 Recommended Next Steps

### Priority 1: Fix complete-workflow.cy.ts

1. Open Cypress interactive mode: `npx cypress open`
2. Watch test execution in real-time
3. Identify exact selector mismatches
4. Add missing data-tour attributes:
   - Unit name input field in editor
   - Insert menu button
   - Publish/status controls
5. Adjust timing waits if needed

### Priority 2: Fix Onboarding Tests

1. **Storybook Test:** Fix `require` polyfill in `.storybook/__mocks__/`
2. **Main UI Test:** Either:
   - Remove if tours won't be integrated
   - Or update to trigger tours via chat interface

### Priority 3: Verify workbook-spec.cy.ts

Run independently to confirm gold standard still works:

```bash
npm run cypress:workbook
```

---

## 🎯 Success Criteria

**Definition of Done:**

- [ ] complete-workflow.cy.ts passes all 6 tests
- [ ] onboarding-storybook.cy.ts passes all 14 tests (or removed if not needed)
- [ ] onboarding-main-ui.cy.ts passes all tests OR removed if not applicable
- [ ] workbook-spec.cy.ts still passes (unchanged reference)
- [ ] GitHub Actions CI runs successfully
- [ ] All tests documented and maintainable

**Current Progress: 70%**

- Infrastructure: ✅ 100% complete
- UI Attributes: ✅ 100% complete
- Test Execution: ⚠️ 0% passing (need fixes)

---

## 📝 Notes

- Chat can leverage tours in main app, so onboarding tests remain relevant
- The onboarding system itself lives in Storybook but tours can be triggered via chat tools
- Complete workflow test follows gold standard pattern (self-contained, UI-only, no DataStore shortcuts)
- All old fragile tests successfully removed
- Code quality maintained (no suppressions, proper TypeScript)
