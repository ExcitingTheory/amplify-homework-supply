# Cypress Wait Best Practices

## 🎯 Zero Waits Policy

**Project Directive**: "Zero waits are acceptable, there is always a ui change to detect."

**Rule**: ALL arbitrary `cy.wait(milliseconds)` calls must be replaced with explicit UI state verification.

**Why**:
- Faster tests (30-40% improvement)
- More reliable on slow machines/CI
- Self-documenting test intent
- No flaky timing issues

**Exceptions** (minimal, must be justified):
- Debounced input delays (≤500ms) - ONLY when verifying debounce behavior
- All exceptions must be documented with inline comments

---

## ❌ Bad Pattern - Arbitrary Time Waits

```typescript
cy.visit('/units');
cy.wait(2000); // BAD: Arbitrary wait
cy.get('[data-tour="create-unit-button"]').click();
```

**Problems:**
- Flaky tests: Fails on slower machines/CI
- Slow tests: Waits full duration even if element is ready sooner
- Maintenance: Magic numbers everywhere

## ✅ Good Pattern - Explicit Waits

```typescript
cy.visit('/units');
cy.get('[data-tour="create-unit-button"]', { timeout: 10000 }).should('be.visible');
cy.get('[data-tour="create-unit-button"]').click();
```

**Benefits:**
- **Faster**: Continues immediately when ready
- **More reliable**: Waits up to timeout if needed
- **Self-documenting**: Clear what we're waiting for

## Common Patterns

### After Login
```typescript
// ❌ BAD
const loginAsInstructor = () => {
  cy.visit('/');
  cy.wait(2000);
  cy.get('form').should('be.visible');
  cy.get('input[name="username"]').type(username);
  cy.wait(3000); // After submit
};

// ✅ GOOD
const loginAsInstructor = () => {
  cy.visit('/');
  cy.get('form', { timeout: 10000 }).should('be.visible');
  cy.get('input[name="username"]').type(username);
  cy.get('input[name="password"]').type(password);
  cy.get('form').first().submit();
  // Wait for redirect/authenticated state
  cy.url({ timeout: 10000 }).should('not.include', '/login');
  cy.get('[data-tour="main-content"]', { timeout: 10000 }).should('be.visible');
};
```

### After Navigation
```typescript
// ❌ BAD
cy.visit(`/unit/${unitId}`);
cy.wait(3000);
cy.openEditorTab('left', 2);

// ✅ GOOD
cy.visit(`/unit/${unitId}`);
cy.get('[data-tour="editor"]', { timeout: 10000 }).should('be.visible');
cy.openEditorTab('left', 2);
cy.get('[data-tour="dictionary"]', { timeout: 10000 }).should('be.visible');
```

### After Opening Sidebar/Modal
```typescript
// ❌ BAD
cy.openEditorTab('right', 5);
cy.wait(1000);
cy.get('[data-tour="chat-input"]').type('Hello');

// ✅ GOOD
cy.openEditorTab('right', 5);
cy.get('[data-tour="chat-input"]', { timeout: 10000 })
  .should('be.visible')
  .type('Hello');
```

### After AI Response (Special Case)
```typescript
// For AI operations, we DO need to wait for processing, but check state
// ❌ BAD
sendChatMessage('Create a unit');
cy.wait(15000); // Arbitrary wait for AI

// ✅ GOOD
sendChatMessage('Create a unit');
// Wait for the assistant response to appear
cy.get('[data-testid="chat-messages"]', { timeout: 30000 })
  .find('[data-role="assistant"]')
  .last()
  .should('be.visible')
  .and('not.be.empty');
```

### After Debounced Input
```typescript
// For debounced search, a SHORT wait is acceptable AFTER typing
// But still verify the result

// ❌ BAD
cy.get('input[placeholder="Search files..."]').type('test');
cy.wait(1000); // Debounce
// No verification

// ✅ ACCEPTABLE
cy.get('input[placeholder="Search files..."]').type('test');
cy.wait(500); // Allow debounce (keep this minimal)
// Then verify state changed
cy.get('[data-testid="search-results"]').should('exist');
```

## Custom Commands to Replace Waits

Add to `cypress/support/commands.ts`:

```typescript
// Wait for page to be fully loaded
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');
  cy.get('[data-loading="true"]').should('not.exist');
});

// Wait for editor to be ready
Cypress.Commands.add('waitForEditor', () => {
  cy.get('[data-tour="editor"]', { timeout: 10000 }).should('be.visible');
  cy.get('[data-lexical-editor="true"]', { timeout: 10000 }).should('exist');
});

// Wait for authentication
Cypress.Commands.add('waitForAuth', () => {
  cy.url({ timeout: 10000 }).should('not.include', '/login');
  cy.get('[data-testid="user-button"]', { timeout: 10000 }).should('be.visible');
});

// Wait for chat to be ready
Cypress.Commands.add('waitForChat', () => {
  cy.get('[data-tour="chat-input"]', { timeout: 10000 }).should('be.visible').and('not.be.disabled');
});
```

## Migration Checklist

### High Priority (Fix First)
- [ ] Login flows (all test files)
- [ ] Navigation waits (`cy.visit()` + `cy.wait()`)
- [ ] Tab/sidebar opening
- [ ] Form submissions

### Medium Priority
- [ ] AI response waits (can use longer timeouts)
- [ ] File uploads
- [ ] DataStore sync operations

### Low Priority (May Keep Short Waits)
- [ ] Debounced search (500ms acceptable)
- [ ] Animation completion (300ms acceptable)
- [ ] Modal open transitions (300ms acceptable)

## Acceptable Short Waits (< 500ms) - DEPRECATED

**⚠️ UPDATED POLICY**: Per project directive, even short waits should be removed when possible.

**Previously Acceptable** (now discouraged):
- ~~Debounce timers: `cy.wait(300)` after typing in search~~
- ~~Animation/transition completion: `cy.wait(300)` for CSS transitions~~
- ~~Race condition prevention: `cy.wait(100)` between rapid state changes~~

**Current Rule**: "Zero waits are acceptable, there is always a ui change to detect."

**Only Keep Waits For**:
- Verifying debounce behavior itself (e.g., testing that search doesn't fire until 500ms after typing)
- Must include comment explaining why wait is essential

**Example - Acceptable Debounce Wait**:
```typescript
// Testing debounce behavior - wait is part of what we're testing
cy.get('input[placeholder="Search..."]').type('test');
cy.wait(500); // Verify debounce delay before search fires
cy.get('[data-results]', { timeout: 10000 }).should('exist');
```

## Tools to Find Bad Waits

```bash
# Find all arbitrary waits > 1000ms
grep -r "cy\.wait([2-9][0-9][0-9][0-9]" cypress/e2e/

# Find all waits > 500ms
grep -r "cy\.wait([5-9][0-9][0-9]" cypress/e2e/

# Count total bad waits
grep -r "cy\.wait(\d\+)" cypress/e2e/ | wc -l
```

## Example Refactor

Before:
```typescript
it('should create a unit', () => {
  loginAsInstructor();
  cy.visit('/units');
  cy.wait(2000);
  cy.get('[data-tour="create-unit-button"]').click();
  cy.wait(3000);
  cy.url().should('include', '/unit/');
  cy.wait(2000);
  openChatSidebar();
  cy.wait(1000);
  sendChatMessage('Hello');
  cy.wait(15000);
});
```

After:
```typescript
it('should create a unit', () => {
  loginAsInstructor();
  
  cy.visit('/units');
  cy.get('[data-tour="create-unit-button"]', { timeout: 10000 })
    .should('be.visible')
    .click();
  
  cy.url({ timeout: 10000 }).should('include', '/unit/');
  cy.waitForEditor();
  
  openChatSidebar();
  cy.waitForChat();
  
  sendChatMessage('Hello');
  cy.get('[data-testid="chat-messages"]', { timeout: 30000 })
    .find('[data-role="assistant"]')
    .last()
    .should('be.visible');
});
```

## Performance Impact

**Before**: Test takes minimum 23 seconds (2s + 3s + 2s + 1s + 15s) even if everything is instant  
**After**: Test takes ~3-5 seconds when everything loads quickly, up to 60s if needed

**Test suite improvement**: 100+ tests × ~10s saved per test = **16+ minutes saved**
