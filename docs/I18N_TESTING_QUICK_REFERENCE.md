# i18n Testing Quick Reference

## What Was Created

### 1. **Cypress E2E Test** 
   - **File**: `cypress/e2e/i18n-validation-spec.cy.ts`
   - **Purpose**: Automatically visits all pages and monitors console for missing translation keys
   - **Features**:
     - Tests all static routes (/, /sections, /units, etc.)
     - Tests all dynamic routes ([id] parameters)
     - Tests all languages (en, es, fr, de, ja, zh)
     - Generates detailed JSON reports

### 2. **Custom Cypress Commands**
   - **File**: `cypress/support/commands.ts`
   - **New Commands**:
     - `cy.visitAndMonitorI18n(url)` - Visit page and capture i18n errors
     - `cy.checkI18nKeys()` - Check for missing keys in current page
     - `cy.verifyNoMissingKeys()` - Assert no missing keys

### 3. **Route Generation Script**
   - **File**: `scripts/generate-route-list.js`
   - **Purpose**: Automatically discovers all routes from pages/ directory
   - **Output**: `cypress/fixtures/routes.json`

### 4. **Updated Configuration**
   - **File**: `cypress.config.ts`
   - **Changes**:
     - Added `log` task for console output
     - Added environment variables for dev/storybook URLs
     - Configured retry logic

### 5. **NPM Scripts**
   - `npm run generate:routes` - Generate route list
   - `npm run test:i18n` - Run i18n validation tests
   - `npm run test:i18n:dev` - Run tests with custom dev server URL
   - `npm run cypress:run` - Run all Cypress tests headless

### 6. **Documentation**
   - **File**: `docs/I18N_TESTING_GUIDE.md`
   - **Contents**: Complete usage guide, troubleshooting, CI/CD integration

## Quick Start

### Step 1: Start Dev Server
```bash
npm run dev
```

### Step 2: Run Tests

**Option A: Interactive Mode (Recommended)**
```bash
npm run cypress:open
```
Then select **"i18n-validation-spec.cy.ts"** from the test list.

**Option B: Headless Mode (CI/CD)**
```bash
npm run test:i18n
```

### Step 3: View Results

- **Console**: Shows summary with missing keys count
- **Report**: `cypress/reports/i18n-validation-report.json`

## Console Output Example

```
================================================================================
📊 i18n Validation Summary
================================================================================

🔍 Total Missing Translation Keys: 3

Missing Keys:
  ⚠️  i18next::translator: missingKey en editor.shared tableOfContents.emptyState
  ⚠️  i18next::translator: missingKey es pages home.title
  ⚠️  i18next::translator: missingKey fr common welcome

❌ Total Console Errors: 0
💥 Total Render Errors: 0
================================================================================
```

## What Gets Detected

✅ **Missing translation keys** in console  
✅ **Console errors** (JavaScript, React, Network)  
✅ **Render errors** (Next.js error overlays)  
✅ **Failed page loads** (404s, 500s)  
✅ **i18n namespace loading issues**  

## Common Commands

```bash
# Generate/update route list
npm run generate:routes

# Run i18n tests interactively
npm run cypress:open

# Run i18n tests headless
npm run test:i18n

# Run with custom dev server URL
npm run test:i18n:dev

# View generated report
cat cypress/reports/i18n-validation-report.json | jq '.'
```

## Custom Test Examples

### Test Specific Page
```typescript
cy.visitAndMonitorI18n('/sections').then(({ missingKeys }) => {
  expect(missingKeys).to.have.length(0);
});
```

### Test with Authentication
```typescript
cy.visit('http://localhost:3000/profile', {
  onBeforeLoad(win) {
    // Set auth token
    win.localStorage.setItem('authToken', 'test-token');
  }
});
cy.verifyNoMissingKeys();
```

### Test Specific Language
```typescript
cy.setCookie('NEXT_LOCALE', 'es');
cy.visit('http://localhost:3000/');
cy.checkI18nKeys().should('have.length', 0);
```

## Files Modified/Created

```
✨ New Files:
   cypress/e2e/i18n-validation-spec.cy.ts
   scripts/generate-route-list.js
   cypress/fixtures/routes.json
   cypress/reports/i18n-validation-report.json
   docs/I18N_TESTING_GUIDE.md
   docs/I18N_TESTING_QUICK_REFERENCE.md (this file)

🔧 Modified Files:
   cypress/support/commands.ts (added 3 new commands)
   cypress.config.ts (added log task + env vars)
   package.json (added 4 new scripts)
```

## Next Steps

1. ✅ Run `npm run test:i18n` to see current state
2. 📝 Fix any missing translation keys found
3. 🔄 Add to CI/CD pipeline (see I18N_TESTING_GUIDE.md)
4. 🎯 Configure pre-commit hook to prevent new missing keys

## Troubleshooting

**Problem**: No routes found  
**Solution**: Run `npm run generate:routes` first

**Problem**: Tests timeout  
**Solution**: Ensure dev server is running on port 3000

**Problem**: No missing keys detected  
**Solution**: Check that `debug: true` in `next-i18next.config.js`

## Documentation

📚 **Full Guide**: [docs/I18N_TESTING_GUIDE.md](I18N_TESTING_GUIDE.md)  
🔧 **Cypress Docs**: [cypress/e2e/](../cypress/e2e/)  
⚙️ **i18n Config**: [next-i18next.config.js](../next-i18next.config.js)  

---

**Created**: February 2026  
**Last Updated**: February 16, 2026  
