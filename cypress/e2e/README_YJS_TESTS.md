# Yjs Collaboration E2E Tests

Comprehensive Cypress tests for real-time collaborative editing with Yjs CRDT integration.

## 📋 Test Coverage

### ✅ Basic Multi-Tab Sync (3 tests)
- **Sync latency**: Edits sync between tabs in <100ms (or <5s with page reload)
- **Collaborator presence**: Shows active collaborators in awareness list
- **Persistence**: Content persists after page reload (IndexedDB + DataStore)

### ✅ Concurrent Editing (2 tests)
- **CRDT conflict resolution**: Merges concurrent edits correctly
- **Rapid typing**: Handles rapid character insertions without loss

### ✅ Offline Support (1 test)
- **Offline editing**: Allows editing while offline using IndexedDB persistence

### ✅ Version Conflict Handling (1 test)
- **OCC conflicts**: Reloads from DataStore on version conflict

### ✅ Awareness Indicators (2 tests)
- **Collaborator count**: Updates when users join/leave
- **User metadata**: Displays user color and name in awareness

### ✅ Performance (2 tests)
- **Large documents**: Handles large documents (2700+ chars) without lag
- **Debounced saves**: Saves only after 5s delay (not on every keystroke)

### ✅ Edge Cases (3 tests)
- **Empty editor**: Handles empty content gracefully
- **Special characters**: Preserves Japanese, emojis, quotes
- **WebSocket recovery**: Recovers from WebSocket disconnection

**Total**: 14 comprehensive test scenarios

---

## 🚀 Running the Tests

### Prerequisites

1. **Development server must be running**:
   ```bash
   npm run dev
   # Server should be at http://localhost:3000
   ```

2. **Environment variables** (optional):
   ```bash
   # In cypress.env.json or Cypress Dashboard
   {
     "devServerUrl": "http://localhost:3000",
     "TEST_UNIT_ID": "test-collab-unit-123",
     "TEACHER_USERNAME": "testuser@example.com",
     "TEACHER_PASSWORD": "testpass123"
   }
   ```

3. **Test unit** (optional):
   - Create a test unit in the database
   - Or tests will create a dynamic unit with ID `test-unit-collab-{timestamp}`

### Run Tests

#### Interactive Mode (Recommended for development)
```bash
npm run cypress:open
```
Then select "yjs-collaboration.cy.ts" from the test list.

#### Headless Mode (CI/CD)
```bash
npm run cypress:run -- --spec "cypress/e2e/yjs-collaboration.cy.ts"
```

#### With Video Recording
```bash
npm run cypress:run -- --spec "cypress/e2e/yjs-collaboration.cy.ts" --video
```

---

## 🔧 Custom Commands

The tests use custom Cypress commands defined in `cypress/support/commands.ts`:

### `cy.checkYjsConnection()`
Checks if Yjs provider is connected and synced.
```typescript
cy.checkYjsConnection().should('be.true');
```

### `cy.getYjsProvider()`
Gets the Yjs provider instance from window.
```typescript
cy.getYjsProvider().then(provider => {
  expect(provider.isConnected).to.be.true;
});
```

### `cy.waitForYjsSync(timeout?)`
Waits for Yjs to finish syncing (default 5s timeout).
```typescript
cy.waitForYjsSync(10000); // Wait up to 10s
```

### `cy.typeInEditor(text, options?)`
Types text in the Lexical editor.
```typescript
cy.typeInEditor('Hello world', { delay: 5 });
```

### `cy.getEditorContent()`
Gets the current editor content as text.
```typescript
cy.getEditorContent().should('contain', 'test');
```

### `cy.clearYjsIndexedDB(unitId)`
Clears Yjs IndexedDB for a specific unit.
```typescript
cy.clearYjsIndexedDB('unit-123');
```

---

## 🧪 Test Strategy

### Multi-Tab Simulation
Cypress doesn't natively support multiple tabs. Tests simulate multi-tab by:
1. Opening unit in Tab A
2. Reloading page to simulate Tab B
3. Verifying content syncs via Yjs IndexedDB + WebSocket

For true multi-tab testing, see [Playwright Multi-Tab Guide](https://playwright.dev/docs/pages#multiple-pages).

### Yjs Provider Access
Tests access the Yjs provider via:
```typescript
window.__YJS_PROVIDER__ // Exposed by useYjsUnit hook
window.yjsProvider      // Alternative naming
```

**Implementation**: Expose provider in development mode:
```typescript
// In useYjsUnit.ts or Editor component
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.__YJS_PROVIDER__ = provider;
  window.__YJS_AWARENESS__ = provider?.getAwareness();
  window.__YJS_FORCE_SAVE__ = forceSave;
}
```

### Sync Verification
Tests verify sync by:
1. **Content matching**: Editor content matches across tabs
2. **Time measurement**: Sync completes within SLA (<100ms for real WebSocket)
3. **Awareness updates**: Collaborator list updates in real-time

---

## 🐛 Troubleshooting

### Tests Timeout
**Issue**: Tests timeout waiting for editor or sync.

**Solutions**:
- Ensure dev server is running (`npm run dev`)
- Increase timeout: `cy.get(..., { timeout: 20000 })`
- Check browser console for errors
- Verify WebSocket server is accessible

### Provider Not Found
**Issue**: `window.__YJS_PROVIDER__` is undefined.

**Solutions**:
- Add provider to window in development:
  ```typescript
  if (process.env.NODE_ENV === 'development') {
    window.__YJS_PROVIDER__ = provider;
  }
  ```
- Check React DevTools for provider instance
- Use fallback: `win.yjsProvider || win.__reactInternalInstance__`

### Sync Not Working
**Issue**: Content doesn't sync between tabs.

**Solutions**:
- Check WebSocket connection in Network tab
- Verify Lambda `yjsSync` is deployed and running
- Check Yjs provider logs in console
- Clear IndexedDB: `cy.clearYjsIndexedDB(unitId)`

### IndexedDB Access Errors
**Issue**: Can't delete or access IndexedDB.

**Solutions**:
- Use `cy.clearLocalStorage()` before tests
- Manually clear via DevTools → Application → IndexedDB
- Check browser security settings (third-party cookies)

---

## 📊 Performance Benchmarks

Expected performance metrics (from test assertions):

| Metric | Target | Test |
|--------|--------|------|
| **Sync latency** (real WebSocket) | <100ms | Multi-tab sync |
| **Sync latency** (with page reload) | <5s | Multi-tab sync |
| **Large document insert** | <1s | Performance test |
| **Save debounce delay** | 5s | Debounced saves |
| **WebSocket reconnect** | <3s | Recovery test |

---

## 🔗 Related Documentation

- [Yjs Documentation](https://docs.yjs.dev/)
- [Lexical Collaboration Plugin](https://lexical.dev/docs/react/plugins#lexicalcollaborationplugin)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [YJS_IMPLEMENTATION_SPEC.md](../../docs/YJS_IMPLEMENTATION_SPEC.md)
- [YJS_TESTING_GUIDE.md](../../docs/YJS_TESTING_GUIDE.md)
- [YJS_STATUS.md](../../docs/YJS_STATUS.md)

---

## 🚦 CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests - Yjs Collaboration

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        run: npm ci
        
      - name: Start dev server
        run: npm run dev &
        
      - name: Wait for server
        run: npx wait-on http://localhost:3000
        
      - name: Run Cypress tests
        run: npm run cypress:run -- --spec "cypress/e2e/yjs-collaboration.cy.ts"
        env:
          CYPRESS_TEACHER_USERNAME: ${{ secrets.TEST_USERNAME }}
          CYPRESS_TEACHER_PASSWORD: ${{ secrets.TEST_PASSWORD }}
          
      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: cypress-screenshots
          path: cypress/screenshots
```

---

## 📝 Test Maintenance

When updating Yjs integration:

1. **Update tests** if API changes (provider, awareness, hooks)
2. **Update selectors** if editor structure changes
3. **Add new tests** for new features (cursor rendering, metadata sync, etc.)
4. **Update benchmarks** if performance targets change
5. **Document changes** in this README

---

## ✅ Checklist for Running Tests

- [ ] Development server running (`npm run dev`)
- [ ] WebSocket Lambda deployed (if testing real sync)
- [ ] Test credentials configured (if auth required)
- [ ] IndexedDB cleared before tests
- [ ] Browser console open (for debugging)
- [ ] Tests passing in CI/CD pipeline

---

**Last Updated**: 2026-02-17  
**Test Suite Version**: 1.0.0  
**Yjs Version**: 13.6.x  
**Lexical Version**: 0.39.0
