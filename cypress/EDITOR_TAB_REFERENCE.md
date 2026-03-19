# Unit Editor Tab Reference for Cypress Tests

When testing the Unit Editor, tabs must be explicitly opened before accessing their content.

## Left Drawer Tabs (TabsVerticalLeft)

Use `cy.openEditorTab('left', index)`:

| Index | Tab Name | Content | Data Tour Selector |
|-------|----------|---------|-------------------|
| 0 | Assignments | Assignment Configuration | - |
| 1 | TOC | Table of Contents | - |
| 2 | Dictionary | Dictionary Editor | `[data-tour="dictionary"]` |
| 3 | Questions | Question Bank Editor | - |
| 4 | Files | File Manager | - |
| 6 | Configuration | Unit Configuration | - |

## Right Drawer Tabs (TabsVerticalRight)

Use `cy.openEditorTab('right', index)`:

| Index | Tab Name | Content | Data Tour Selector |
|-------|----------|---------|-------------------|
| 1 | TOC | Table of Contents | - |
| 5 | Chat | AI Chat Assistant | `[data-tour="chat-input"]` |
| 7 | AI Suggestions | Block Suggestions | - |
| 8 | Grades | Grades View | - |
| 9 | Cohort Chat | Discussion Forum | - |

## Usage Examples

```typescript
// Open Dictionary tab to add vocabulary
cy.openEditorTab('left', 2);
cy.get('[data-tour="dictionary"]').should('be.visible');

// Open Questions tab to add questions
cy.openEditorTab('left', 3);
cy.contains('Question Bank').should('be.visible');

// Open Chat to interact with AI
cy.openEditorTab('right', 5);
cy.get('[data-tour="chat-input"]').should('be.visible').type('Hello AI');

// Open Files tab to upload files
cy.openEditorTab('left', 4);
cy.get('[data-tour="file-manager-toggle"]').should('be.visible');
```

## Tab Behavior

- Clicking a tab when it's already open will **close** the drawer
- Clicking a different tab will **switch** to that tab
- Tabs persist their open/closed state during a session
- ✅ **The `cy.openEditorTab()` command automatically waits for content to be visible**
- ❌ **Never use `cy.wait(milliseconds)` for arbitrary timeouts** (see [WAIT_BEST_PRACTICES.md](WAIT_BEST_PRACTICES.md))

## Common Test Pattern

```typescript
// ✅ GOOD: Explicit waits for specific conditions

// 1. Navigate to unit and wait for editor
cy.visit(`/unit/${unitId}`);
cy.waitForEditor(); // Custom command - waits for editor to be visible

// 2. Open the appropriate tab (automatically waits for content)
cy.openEditorTab('left', 2); // Dictionary - waits for [data-tour="dictionary"] to be visible

// 3. Interact with content
cy.get('[data-tour="dictionary"]').within(() => {
  // Your test interactions
});

// ❌ BAD: Don't use arbitrary timeouts
// cy.wait(2000); // NEVER DO THIS
// cy.wait(500);  // NEVER DO THIS
```
