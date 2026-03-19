# Cypress Test Selectors Reference

## Exact Selectors for Skipped Tests

This document provides the exact selectors for UI elements needed to enable the remaining `.skip()` tests.

---

## Publishing Control

### Status Dropdown (Editor Toolbar)

**Location**: Editor3 toolbar - ToolBarPlugin.jsx  
**Component**: `StatusSelect` component  
**Selector**: `#status-select` or `[id="status-select"]`

**Usage**:
```javascript
// Open status dropdown
cy.get('#status-select').click();

// Select "Published" option
cy.contains('li', 'Published').click();
// OR by value
cy.get('#status-select').parent().click();
cy.get('[role="listbox"] [data-value="PUBLISHED"]').click();
```

**Options**:
- `DRAFT` - Draft status
- `PUBLISHED` - Published status (removes from Drafts, shows on /units page)
- `ARCHIVED` - Archived status

**Translation Keys**:
- Label: `t('toolBarPlugin.status')`
- Draft: `t('toolBarPlugin.draft')`
- Published: `t('toolBarPlugin.published')`
- Archived: `t('toolBarPlugin.archived')`

---

## Search TextFields

### 1. DictionaryEditor2 Search

**Location**: Left Vertical Toolbar → Tab Index 2  
**Context**: Within `data-tour="dictionary"` container  
**Selector**: `[data-tour="dictionary"] input[placeholder="Search words..."]`

**Alternative Selectors**:
- By placeholder: `input[placeholder="Search words..."]`
- By label: `[data-tour="dictionary"] input[name="Search"]`

**Usage**:
```javascript
cy.get('[data-tour="dictionary"] input[placeholder="Search words..."]')
  .type('photosynthesis');
```

---

### 2. QuestionEditor2 Search

**Location**: Left Vertical Toolbar → Tab Index 3  
**Selector**: `input[placeholder="Search questions..."]`

**Alternative Selectors**:
- By label: Within question editor toolbar, look for TextField with label "Search"

**Usage**:
```javascript
cy.get('input[placeholder="Search questions..."]')
  .type('ecosystem');
```

---

### 3. FileManager2 Search

**Location**: Left Vertical Toolbar → Tab Index 4  
**Translation Key**: `t('fileManager2.toolbar.searchPlaceholder')`  
**English Placeholder**: "Search files..."  
**Selector**: `input[placeholder="Search files..."]`

**Alternative Selectors**:
- Within FileManager2 toolbar context
- Look for TextField with SearchIcon startAdornment

**Usage**:
```javascript
cy.get('input[placeholder="Search files..."]')
  .type('biology.pdf');
```

---

### 4. ChatSidebar Search (search_content tool)

**Location**: ChatSidebar (right panel or modal)  
**Selector**: `[data-tour="chat-input"]`

**Usage**:
```javascript
// Search via chatbot
cy.get('[data-tour="chat-input"]')
  .type('Search for marine biology content');
cy.get('[data-tour="chat-input"]').type('{enter}');
```

**Note**: This uses the `search_content` tool with textbook embeddings and returns similarity scores.

---

## Tests Ready to Enable

With these selectors, you can enable the following skipped tests:

### instructor-workflow.cy.ts
- ✅ `instructor verifies document appears in search` - Use FileManager2 search or ChatSidebar
- ✅ `instructor publishes the unit` - Use `#status-select`

### learner-workflow.cy.ts  
- ℹ️ `learner submits grade` - No selector needed (auto-submit), can test completion triggers grade

### search-functionality.cy.ts
- ✅ `should search files by type` - Use `input[placeholder="Search files..."]`
- ✅ `should search documents by keyword` - Use `input[placeholder="Search files..."]`
- ✅ `should search vocabulary by keyword` - Use `[data-tour="dictionary"] input[placeholder="Search words..."]`
- ✅ `should search questions by keyword` - Use `input[placeholder="Search questions..."]`
- ✅ `should search units by keyword` - May need to find units page search input
- ✅ `should search published units` - Use units page search + `#status-select` to publish first

### chatbot-workflows.cy.ts
- ℹ️ `should use chatbot with embedded search tool` - Duplicate test, can be removed or use `[data-tour="chat-input"]`

---

## Testing Strategy

### Opening Left Toolbar Tabs

To access the editors with search:

```javascript
// Open Dictionary Editor (tab 2)
cy.get('[aria-label*="Dictionary"]').click();
cy.wait(500);
cy.get('[data-tour="dictionary"] input[placeholder="Search words..."]')
  .should('be.visible');

// Open Question Editor (tab 3)
cy.get('[aria-label*="Questions"]').click();
cy.wait(500);
cy.get('input[placeholder="Search questions..."]')
  .should('be.visible');

// Open File Manager (tab 4)
cy.get('[aria-label*="Files"]').click();
cy.wait(500);
cy.get('input[placeholder="Search files..."]')
  .should('be.visible');
```

### Publishing Workflow

```javascript
// Navigate to unit editor
cy.visit(`/unit/${unitId}`);
cy.wait(2000);

// Change status to Published
cy.get('#status-select').click();
cy.get('[role="listbox"] [data-value="PUBLISHED"]').click();
cy.wait(1000);

// Verify unit appears on /units page
cy.visit('/units');
cy.contains('Test Unit').should('be.visible');
```

---

## Implementation Priority

1. **High Priority** - Enable these first:
   - instructor publishes unit (`#status-select`)
   - ChatSidebar search tests (already working via `[data-tour="chat-input"]`)

2. **Medium Priority** - Search functionality:
   - DictionaryEditor2 search
   - QuestionEditor2 search  
   - FileManager2 search

3. **Low Priority** - Advanced search features:
   - Search highlighting
   - Multi-criteria search
   - Clear search controls
