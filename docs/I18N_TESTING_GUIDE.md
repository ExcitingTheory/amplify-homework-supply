# i18n Testing Guide

Automated testing for missing translation keys across all pages in the development server.

## Overview

This testing system:
- ✅ Visits every page in your Next.js application
- 🔍 Monitors browser console for missing i18n translation keys
- 📊 Reports missing keys, console errors, and render errors
- 🌐 Tests all configured languages (en, es, fr, de, ja, zh)
- 🤖 Automatically discovers routes from the `pages/` directory

## Quick Start

### 1. Start the Development Server

```bash
npm run dev
```

The dev server should be running on `http://localhost:3000`.

### 2. Generate Route List

Automatically discover all routes in your application:

```bash
node scripts/generate-route-list.js
```

This creates `cypress/fixtures/routes.json` with all static and dynamic routes.

### 3. Run i18n Validation Tests

**Interactive Mode** (recommended for development):

```bash
npm run cypress:open
```

Then select "i18n-validation-spec.cy.ts" from the test list.

**Headless Mode** (for CI/CD):

```bash
npm run cypress:run -- --spec "cypress/e2e/i18n-validation-spec.cy.ts"
```

Or add a dedicated script:

```bash
npm run test:i18n
```

## Test Coverage

### Pages Tested

The test automatically checks:

- **Static routes**: `/`, `/sections`, `/units`, `/profile`
- **Dynamic routes**: `/section/[id]`, `/unit/[id]`, `/workbook/[id]`
- **All languages**: Tests each page in all configured locales

### What Gets Detected

1. **Missing Translation Keys**
   - i18next warnings like `"i18next::translator: missingKey en common keyName"`
   - Any console message containing "missingKey" or "translation"

2. **Console Errors**
   - JavaScript errors
   - React errors
   - Network errors

3. **Render Errors**
   - Next.js error overlays
   - React error boundaries
   - Unhandled runtime errors

## Reports

After running tests, check:

### Console Output

The test generates a summary in the terminal:

```
================================================================================
📊 i18n Validation Summary
================================================================================

🔍 Total Missing Translation Keys: 5

Missing Keys:
  ⚠️  i18next::translator: missingKey en common welcome
  ⚠️  i18next::translator: missingKey es pages home.title

❌ Total Console Errors: 0

💥 Total Render Errors: 0
================================================================================
```

### JSON Report

Detailed report saved to: `cypress/reports/i18n-validation-report.json`

```json
{
  "timestamp": "2026-02-16T10:30:00.000Z",
  "summary": {
    "totalMissingKeys": 5,
    "totalConsoleErrors": 0,
    "totalRenderErrors": 0
  },
  "missingKeys": [
    "i18next::translator: missingKey en common welcome",
    "i18next::translator: missingKey es pages home.title"
  ],
  "consoleErrors": [],
  "renderErrors": []
}
```

## Custom Commands

The test suite adds helpful Cypress commands:

### `cy.visitAndMonitorI18n(url, options)`

Visit a page and automatically capture i18n issues:

```typescript
cy.visitAndMonitorI18n('/').then(({ missingKeys, consoleErrors }) => {
  expect(missingKeys).to.have.length(0);
});
```

### `cy.checkI18nKeys()`

Check for missing keys in the current page:

```typescript
cy.visit('/');
cy.checkI18nKeys().should('have.length', 0);
```

### `cy.verifyNoMissingKeys()`

Assert that current page has no missing keys:

```typescript
cy.visit('/profile');
cy.verifyNoMissingKeys();
```

## Customizing Tests

### Add New Routes

Edit `cypress/e2e/i18n-validation-spec.cy.ts`:

```typescript
const routes = {
  public: [
    '/',
    '/sections',
    '/your-new-route', // Add here
  ],
  authenticated: [
    '/profile',
  ],
};
```

Or regenerate: `node scripts/generate-route-list.js`

### Test Additional Languages

The test automatically uses languages from `next-i18next.config.js`:

```javascript
const languages = ['en', 'es', 'fr', 'de', 'ja', 'zh'];
```

### Change Detection Patterns

Modify console monitoring in `cypress/support/commands.ts`:

```typescript
if (
  message.includes('missingKey') ||
  message.includes('your-custom-pattern')
) {
  missingKeys.push(message);
}
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: i18n Validation

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Start dev server
        run: npm run dev &
        
      - name: Wait for server
        run: npx wait-on http://localhost:3000
      
      - name: Run i18n tests
        run: npm run test:i18n
      
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: i18n-report
          path: cypress/reports/i18n-validation-report.json
```

## Troubleshooting

### "No missing keys detected but I know there are missing keys"

1. Check that the dev server is running on `http://localhost:3000`
2. Verify `next-i18next.config.js` has `debug: true` in development
3. Check browser DevTools console manually to see the exact format of warnings

### "Tests timeout"

1. Increase timeout in `cypress.config.ts`:
   ```typescript
   defaultCommandTimeout: 20000,
   pageLoadTimeout: 60000,
   ```

2. Ensure dev server is fully started before running tests

### "Dynamic routes fail"

Make sure mock IDs are valid or use actual test data:

```typescript
const mockIds = {
  section: 'real-section-id-from-test-data',
  unit: 'real-unit-id-from-test-data',
};
```

## Best Practices

1. **Run regularly**: Add to your pre-commit hooks or CI pipeline
2. **Fix immediately**: Missing keys compound quickly
3. **Test all languages**: Don't just test English
4. **Monitor reports**: Check JSON reports for trends
5. **Update routes**: Regenerate route list when adding new pages

## Related Documentation

- [next-i18next Configuration](../next-i18next.config.js)
- [Translation Skills](.github/skills/)
- [Cypress E2E Tests](../cypress/e2e/)
- [Translation Scripts](../scripts/)

## NPM Scripts

```bash
# Generate route list
npm run generate:routes

# Run i18n validation tests
npm run test:i18n

# Run all Cypress tests
npm run cypress:run

# Open Cypress test runner
npm run cypress:open
```
