# Testing Guide: Keyboard Shortcuts

**Created**: January 31, 2026  
**Related**: [Feature Spec](KEYBOARD_SHORTCUTS_FEATURE_SPEC.md) | [Implementation Plan](KEYBOARD_SHORTCUTS_IMPLEMENTATION_PLAN.md)

## Test Strategy

### Coverage Goals
- **Unit Tests**: >80% coverage for utility functions and helpers
- **Integration Tests**: All shortcuts tested in editor context
- **E2E Tests**: Critical shortcuts tested across browsers
- **Manual Tests**: Full checklist verification on Mac and Windows

### Test Frameworks
- **Unit**: Jest (existing project standard)
- **Integration**: Jest with Lexical test utilities
- **E2E**: Cypress (existing setup)
- **Manual**: Browser DevTools + test documents

## Test Scenarios

### 1. Utility Functions (keyboardUtils.js)

#### 1.1 Platform Detection Tests

```javascript
describe('keyboardUtils', () => {
  describe('IS_APPLE', () => {
    it('should detect Mac platform', () => {
      // Mock navigator.platform
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true
      });
      expect(IS_APPLE).toBe(true);
    });

    it('should detect Windows platform', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true
});
      expect(IS_APPLE).toBe(false);
    });

    it('should detect Linux platform', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Linux x86_64',
        configurable: true
      });
      expect(IS_APPLE).toBe(false);
    });
  });

  describe('isModifierKey', () => {
    it('should detect Cmd on Mac', () => {
      const event = new KeyboardEvent('keydown', { metaKey: true });
      // Assume IS_APPLE is true
      expect(isModifierKey(event)).toBe(true);
    });

    it('should detect Ctrl on Windows', () => {
      const event = new KeyboardEvent('keydown', { ctrlKey: true });
      // Assume IS_APPLE is false
      expect(isModifierKey(event)).toBe(true);
    });
  });

  describe('isShortcut', () => {
    it('should match Ctrl+B', () => {
      const event = new KeyboardEvent('keydown', {
        code: 'KeyB',
        ctrlKey: true,
        metaKey: false
      });
      expect(isShortcut(event, 'KeyB', { mod: true })).toBe(true);
    });

    it('should match Cmd+Shift+S', () => {
      const event = new KeyboardEvent('keydown', {
        code: 'KeyS',
        metaKey: true,
        shiftKey: true
      });
      expect(isShortcut(event, 'KeyS', { mod: true, shift: true })).toBe(true);
    });

    it('should not match when shift missing', () => {
      const event = new KeyboardEvent('keydown', {
        code: 'KeyS',
        metaKey: true,
        shiftKey: false
      });
      expect(isShortcut(event, 'KeyS', { mod: true, shift: true })).toBe(false);
    });

    it('should match without modifiers', () => {
      const event = new KeyboardEvent('keydown', { code: 'Escape' });
      expect(isShortcut(event, 'Escape')).toBe(true);
    });
  });
});
```

**Coverage**: 100% of utility functions

---

### 2. Text Formatting Shortcuts (ToolbarPlugin)

#### 2.1 Bold (Ctrl/⌘+B)

```javascript
describe('Bold shortcut', () => {
  it('should apply bold to selected text', () => {
    // Setup editor with text
    const editor = createTestEditor();
    editor.update(() => {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      const text = $createTextNode('Hello World');
      paragraph.append(text);
      root.append(paragraph);
    });

    // Select all text
    editor.update(() => {
      const selection = $getSelection();
      selection.selectAll();
    });

    // Trigger Ctrl+B
    const event = new KeyboardEvent('keydown', {
      code: 'KeyB',
      ctrlKey: true,
      bubbles: true
    });
    editor.getRootElement().dispatchEvent(event);

    // Assert text is bold
    editor.getEditorState().read(() => {
      const text = $getRoot().getFirstChild().getFirstChild();
      expect(text.hasFormat('bold')).toBe(true);
    });
  });

  it('should toggle bold off', () => {
    // Setup with bold text
    // Trigger Ctrl+B
    // Assert bold removed
  });
});
```

**Test Cases**:
- [ ] Apply bold to plain text
- [ ] Remove bold from bold text
- [ ] Apply bold to partial selection
- [ ] No-op on empty selection
- [ ] Prevents browser default (no bold dialog)

#### 2.2 Italic, Underline, Strikethrough

Similar test structure for:
- Ctrl/⌘+I (italic)
- Ctrl/⌘+U (underline)
- Ctrl/⌘+Shift+S (strikethrough)

#### 2.3 Clear Formatting (Ctrl/⌘+\)

```javascript
it('should clear all formatting', () => {
  // Setup with bold+italic+underline text
  // Trigger Ctrl+\
  // Assert all formats removed
});
```

**Test Cases**:
- [ ] Clear single format
- [ ] Clear multiple formats
- [ ] No-op on plain text
- [ ] Clear from partial selection

---

### 3. Block Type Shortcuts (ToolbarPlugin)

#### 3.1 Headings (Ctrl/⌘+Alt+1/2/3)

```javascript
describe('Heading shortcuts', () => {
  it('should convert paragraph to H1', () => {
    // Setup paragraph
    // Trigger Ctrl+Alt+1
    // Assert paragraph is now H1 node
  });

  it('should convert H2 to H1', () => {
    // Setup H2
    // Trigger Ctrl+Alt+1
    // Assert H2 changed to H1
  });

  it('should not work in tables', () => {
    // Setup table cell with selection
    // Trigger Ctrl+Alt+1
    // Assert cell content unchanged (table handles it)
  });
});
```

**Test Cases**:
- [ ] Paragraph → H1 (Ctrl/⌘+Alt+1)
- [ ] Paragraph → H2 (Ctrl/⌘+Alt+2)
- [ ] Paragraph → H3 (Ctrl/⌘+Alt+3)
- [ ] Heading → Paragraph (Ctrl/⌘+Alt+0)
- [ ] H1 → H2 (change level)
- [ ] Skip when in table
- [ ] Skip when in code block

#### 3.2 Quote (Ctrl/⌘+Shift+Q)

```javascript
it('should convert paragraph to blockquote', () => {
  // Setup paragraph
  // Trigger Ctrl+Shift+Q
  // Assert paragraph is now QuoteNode
});
```

#### 3.3 Code Block (Ctrl/⌘+Alt+C)

```javascript
it('should convert paragraph to code block', () => {
  // Setup paragraph
  // Trigger Ctrl+Alt+C
  // Assert paragraph is now CodeNode
});
```

---

### 4. List Shortcuts (ToolbarPlugin)

#### 4.1 Bullet List (Ctrl/⌘+Shift+8)

```javascript
describe('List shortcuts', () => {
  it('should create bullet list from paragraph', () => {
    // Setup paragraph
    // Trigger Ctrl+Shift+8
    // Assert paragraph is now ListItemNode in unordered list
  });

  it('should toggle off bullet list', () => {
    // Setup bullet list
    // Trigger Ctrl+Shift+8
    // Assert list converted to paragraph
  });
});
```

**Test Cases**:
- [ ] Create bullet list
- [ ] Toggle off bullet list
- [ ] Create numbered list (Ctrl/⌘+Shift+7)
- [ ] Toggle off numbered list
- [ ] Switch between list types

---

### 5. Alignment Shortcuts (ToolbarPlugin)

```javascript
describe('Alignment shortcuts', () => {
  it('should align paragraph left', () => {
    // Setup center-aligned paragraph
    // Trigger Ctrl+Shift+L
    // Assert alignment is 'left'
  });

  it('should center align', () => {
    // Trigger Ctrl+Shift+E
    // Assert alignment is 'center'
  });

  it('should right align', () => {
    // Trigger Ctrl+Shift+R
    // Assert alignment is 'right'
  });

  it('should justify', () => {
    // Trigger Ctrl+Shift+J
    // Assert alignment is 'justify'
  });
});
```

**Test Cases**:
- [ ] Align left (Ctrl/⌘+Shift+L)
- [ ] Align center (Ctrl/⌘+Shift+E)
- [ ] Align right (Ctrl/⌘+Shift+R)
- [ ] Justify (Ctrl/⌘+Shift+J)
- [ ] Alignment persists on heading
- [ ] No effect on list items (expected)

---

### 6. Link Shortcut (FloatingLinkEditorPlugin)

```javascript
describe('Link insertion shortcut', () => {
  it('should show link editor on Ctrl+K with selection', () => {
    // Setup editor with selected text
    // Trigger Ctrl+K
    // Assert FloatingLinkEditor is visible
  });

  it('should not show link editor on Ctrl+K without selection', () => {
    // Setup editor with collapsed selection
    // Trigger Ctrl+K
    // Assert FloatingLinkEditor not shown
  });

  it('should edit existing link', () => {
    // Setup editor with link node
    // Select link
    // Trigger Ctrl+K
    // Assert link editor shows current URL
  });
});
```

**Test Cases**:
- [ ] Show link editor with text selection
- [ ] No-op with collapsed selection
- [ ] Edit existing link
- [ ] Prevent browser search dialog

---

### 7. Context Awareness Tests

```javascript
describe('Context awareness', () => {
  it('should not handle formatting shortcuts in tables', () => {
    // Setup table with cell selection
    // Trigger Ctrl+B
    // Assert TableComponent handled it, not ToolbarPlugin
  });

  it('should not handle block shortcuts in code blocks', () => {
    // Setup code block
    // Trigger Ctrl+Alt+1
    // Assert code block unchanged
  });

  it('should work in custom blocks', () => {
    // Setup custom block (QuizNode)
    // Trigger formatting shortcut
    // Assert formatting applied within custom block
  });
});
```

---

### 8. Cross-Browser Compatibility Tests

Manual testing checklist:

| Shortcut | Chrome | Firefox | Safari | Edge |
|----------|--------|---------|--------|------|
| Ctrl/⌘+B (Bold) | [ ] | [ ] | [ ] | [ ] |
| Ctrl/⌘+I (Italic) | [ ] | [ ] | [ ] | [ ] |
| Ctrl/⌘+U (Underline) | [ ] | [ ] | [ ] | [ ] |
| Ctrl/⌘+K (Link) | [ ] | [ ] | [ ] | [ ] |
| Ctrl/⌘+Alt+1 (H1) | [ ] | [ ] | [ ] | [ ] |
| Ctrl/⌘+Shift+8 (List) | [ ] | [ ] | [ ] | [ ] |

**Platforms**:
- [ ] Mac (test ⌘ key)
- [ ] Windows (test Ctrl key)
- [ ] Linux (test Ctrl key)

---

### 9. Integration Tests

```javascript
describe('Full editor integration', () => {
  it('should chain multiple shortcuts', () => {
    // Type text
    // Select all (Ctrl+A)
    // Apply bold (Ctrl+B)
    // Apply italic (Ctrl+I)
    // Convert to H1 (Ctrl+Alt+1)
    // Assert text is bold+italic H1
  });

  it('should not interfere with existing shortcuts', () => {
    // Verify Tab still works in lists
    // Verify Enter still works in code blocks
    // Verify table navigation still works
    // Verify AI suggestions still work
  });
});
```

---

### 10. E2E Tests (Cypress)

```javascript
// cypress/e2e/keyboard-shortcuts.cy.ts
describe('Keyboard Shortcuts E2E', () => {
  beforeEach(() => {
    cy.visit('/unit/test-unit');
    cy.get('[data-testid="editor"]').should('be.visible');
    cy.get('[contenteditable="true"]').first().as('editor');
  });

  it('should apply bold with Ctrl+B', () => {
    cy.get('@editor')
      .click()
      .type('Hello World')
      .type('{selectall}')
      .type('{ctrl}b');
    
    cy.get('@editor').find('strong').should('contain', 'Hello World');
  });

  it('should create heading with Ctrl+Alt+1', () => {
    cy.get('@editor')
      .click()
      .type('Heading Text')
      .type('{ctrl}{alt}1');
    
    cy.get('@editor').find('h1').should('contain', 'Heading Text');
  });

  it('should insert link with Ctrl+K', () => {
    cy.get('@editor')
      .click()
      .type('Click here')
      .type('{selectall}')
      .type('{ctrl}k');
    
    cy.get('[data-testid="link-input"]').should('be.visible');
  });

  // Test on Mac (if available)
  it('should use Cmd key on Mac', function() {
    if (!Cypress.platform.includes('darwin')) {
      this.skip();
    }

    cy.get('@editor')
      .click()
      .type('Hello')
      .type('{selectall}')
      .type('{meta}b'); // ⌘B on Mac
    
    cy.get('@editor').find('strong').should('exist');
  });
});
```

---

## Error Handling Tests

### Invalid Input Tests

```javascript
describe('Error handling', () => {
  it('should not throw on invalid selection', () => {
    // Setup editor with no selection
    // Trigger shortcut
    // Assert no error thrown
  });

  it('should handle missing dependencies gracefully', () => {
    // Mock missing Lexical command
    // Trigger shortcut
    // Assert fallback behavior or error logged
  });
});
```

---

## Performance Tests

```javascript
describe('Performance', () => {
  it('should execute shortcut in <10ms', () => {
    const start = performance.now();
    // Trigger shortcut
    const end = performance.now();
    expect(end - start).toBeLessThan(10);
  });

  it('should not create memory leaks', () => {
    // Register handlers
    // Unregister handlers
    // Check event listener count unchanged
  });
});
```

---

## Accessibility Tests

### Screen Reader Tests

```javascript
describe('Accessibility', () => {
  it('should announce formatting changes', () => {
    // Apply bold
    // Assert aria-live region updated
    // Assert announcement contains "bold applied"
  });

  it('should work with keyboard-only navigation', () => {
    // Tab to editor
    // Type text
    // Use shortcuts without mouse
    // Assert all functions work
  });
});
```

**Manual Tests**:
- [ ] Test with VoiceOver (Mac)
- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows)

---

## Validation Checklist

### Unit Tests
- [ ] All utility functions tested (>80% coverage)
- [ ] All helper functions tested (clearFormatting, formatHeading, etc.)
- [ ] Platform detection tested
- [ ] Edge cases covered (null, undefined, empty)

### Integration Tests
- [ ] All shortcuts tested in editor
- [ ] Context awareness verified (tables, code, custom blocks)
- [ ] Priority conflicts tested
- [ ] No interference with existing shortcuts

### E2E Tests
- [ ] Critical shortcuts tested in Cypress
- [ ] Mac and Windows tested (where available)
- [ ] All browsers tested (Chrome, Firefox, Safari, Edge)
- [ ] No browser console errors

### Manual Tests
- [ ] Full checklist completed on Mac
- [ ] Full checklist completed on Windows
- [ ] Visual verification of all shortcuts
- [ ] Accessibility verification with screen readers

### Performance
- [ ] Event handler registration <5ms
- [ ] Shortcut execution <10ms
- [ ] No memory leaks
- [ ] No impact on editor initialization time

### Documentation
- [ ] All shortcuts documented in [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md)
- [ ] User guide created
- [ ] Tooltips added to toolbar buttons
- [ ] Help dialog implemented (Ctrl/⌘+/)

---

## Test Execution Commands

```bash
# Run all unit tests
npm test -- keyboard

# Run specific test file
npm test -- keyboardUtils.test.js

# Run with coverage
npm test -- --coverage keyboard

# Run E2E tests
npm run cypress:run -- --spec "cypress/e2e/keyboard-shortcuts.cy.ts"

# Run E2E interactively
npm run cypress:open
```

---

## Bug Report Template

When filing bugs for keyboard shortcut issues:

```markdown
**Shortcut**: Ctrl/⌘+[Key]
**Expected**: [What should happen]
**Actual**: [What actually happened]
**Platform**: Mac / Windows / Linux
**Browser**: Chrome / Firefox / Safari / Edge (version)
**Steps to Reproduce**:
1. Open editor
2. Type text
3. Press shortcut
4. [Unexpected result]

**Console Errors**: [Any errors]
**Screenshots**: [If applicable]
```

---

## Success Criteria

Implementation is testable and complete when:

- [ ] All unit tests pass (>80% coverage)
- [ ] All integration tests pass
- [ ] All E2E tests pass (Cypress)
- [ ] Manual testing complete on Mac and Windows
- [ ] No console errors in any browser
- [ ] No TypeScript compilation errors
- [ ] No regression in existing functionality
- [ ] Accessibility verified with screen readers
- [ ] Performance metrics met (<10ms execution)

---

**Next Steps**: Begin Phase 1 implementation → Run tests after each implementation → Iterate based on test results
