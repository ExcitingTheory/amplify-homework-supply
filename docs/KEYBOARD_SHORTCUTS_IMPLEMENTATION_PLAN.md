# Keyboard Shortcuts Implementation Plan

**Created**: January 31, 2026  
**Status**: Ready for Implementation  
**Related**: [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md)

## Executive Summary

This document provides a comprehensive plan to enable all keyboard shortcuts listed in [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md) for the Homework Supply Editor (Lexical-based Editor3).

**Architecture**: Distributed approach - keyboard shortcuts are added to the plugins that already handle the related functionality, keeping shortcuts co-located with their features.

### Current State Analysis

**What's Already Working:**
- ✅ Basic text navigation (arrow keys, home/end)
- ✅ Undo/Redo (Ctrl/⌘+Z, Ctrl/⌘+Y)
- ✅ Some block-specific shortcuts (tables, code blocks, custom blocks)
- ✅ AI content completion (Tab, Arrow Right, Esc)
- ✅ Block suggestions navigation (arrows, Tab, Enter, Esc)
- ✅ Basic selection (Ctrl/⌘+A in some contexts)
- ✅ Link editing (Esc to close)
- ✅ File manager (Enter to save, Esc to cancel)
- ✅ Chat (Enter to send, Shift+Enter for newline)

**What's Missing:**
- ❌ Text formatting shortcuts (Ctrl/⌘+B, I, U, etc.) → **Add to ToolbarPlugin**
- ❌ Block type shortcuts (Ctrl/⌘+Alt+1-3 for headings) → **Add to ToolbarPlugin**  
- ❌ List shortcuts (Ctrl/⌘+Shift+8/7) → **Add to ToolbarPlugin**
- ❌ Alignment shortcuts (Ctrl/⌘+Shift+L/E/R/J) → **Add to ToolbarPlugin**
- ❌ Link insertion shortcut (Ctrl/⌘+K) → **Add to FloatingLinkEditorPlugin**
- ❌ Clear formatting (Ctrl/⌘+\) → **Add to ToolbarPlugin**
- ❌ Quote shortcut (Ctrl/⌘+Shift+Q) → **Add to ToolbarPlugin**
- ❌ Code block shortcut (Ctrl/⌘+Alt+C) → **Add to ToolbarPlugin**

---

## Implementation Strategy

### Architecture: Distributed Keyboard Shortcuts 🏗️

**Approach**: Add keyboard shortcuts to the plugins that already handle the related functionality, rather than creating a centralized plugin. This keeps shortcuts co-located with their features.

#### Shortcut Distribution Map

| Shortcuts | Plugin/Component | Rationale |
|-----------|------------------|-----------|
| Bold, Italic, Underline, Strikethrough, Clear Format | `ToolbarPlugin.js` | Already dispatches FORMAT_TEXT_COMMAND |
| Headings, Paragraph, Quote, Code Block | `ToolbarPlugin.js` | Already has block type change logic |
| Bullet/Numbered Lists | `ToolbarPlugin.js` | Already dispatches list commands |
| Align Left/Center/Right/Justify | `ToolbarPlugin.js` | Already has alignment dropdowns |
| Insert/Edit Link (Ctrl/⌘+K) | `FloatingLinkEditorPlugin.js` | Already handles link editing |
| Tab/Shift+Tab (indent/outdent) | `TabIndentationPlugin.js` | ✅ Already implemented |
| Table navigation | `TableComponent.js` | ✅ Already implemented |
| Code block enter/exit | `CodeActionMenuPlugin.js` | ✅ Already implemented |
| Block suggestions | `BlockSuggestionPlugin.js` | ✅ Already implemented |
| AI content completion | `AIContentCompletionPlugin.js` | ✅ Already implemented |

#### Platform Detection Utility

Create a shared utility for consistent platform detection across plugins:

**File to Create**: `src/components/Editor3/utils/keyboardUtils.js`

```javascript
/**
 * Detect if running on Apple platform (Mac, iPad, iPhone)
 */
export const IS_APPLE = typeof navigator !== 'undefined' && 
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

/**
 * Check if the modifier key is pressed (⌘ on Mac, Ctrl on Windows/Linux)
 */
export const isModifierKey = (event) => {
  return IS_APPLE ? event.metaKey : event.ctrlKey;
};

/**
 * Check if a specific keyboard shortcut is pressed
 * @param {KeyboardEvent} event
 * @param {string} key - Key code (e.g., 'KeyB', 'Digit1')
 * @param {object} modifiers - { mod, shift, alt }
 */
export const isShortcut = (event, key, { mod = false, shift = false, alt = false } = {}) => {
  const modPressed = IS_APPLE ? event.metaKey : event.ctrlKey;
  
  return (
    event.code === key &&
    (!mod || modPressed) &&
    (!shift || event.shiftKey) &&
    (!alt || event.altKey)
  );
};
```

---

### Phase 1: Toolbar Plugin Shortcuts 🎨

**Priority**: HIGH  
**Effort**: Medium (6-8 hours)  
**Dependencies**: Create keyboard utils
**File**: `src/components/Editor3/plugins/ToolbarPlugin.js`

Add keyboard shortcuts to ToolbarPlugin for formatting, block types, lists, and alignment.

#### A. Text Formatting Shortcuts

| Shortcut | Windows/Linux | Mac | Command |
|----------|---------------|-----|---------|
| Bold | `Ctrl+B` | `⌘B` | `FORMAT_TEXT_COMMAND, 'bold'` |
| Italic | `Ctrl+I` | `⌘I` | `FORMAT_TEXT_COMMAND, 'italic'` |
| Underline | `Ctrl+U` | `⌘U` | `FORMAT_TEXT_COMMAND, 'underline'` |
| Strikethrough | `Ctrl+Shift+S` | `⌘⇧S` | `FORMAT_TEXT_COMMAND, 'strikethrough'` |
| Clear Formatting | `Ctrl+\` | `⌘\` | Custom handler to clear all formats |

#### Implementation Pattern

**Location**: Add to `ToolbarPlugin.js` in the main component function

```javascript
import { isShortcut, isModifierKey } from '../utils/keyboardUtils';

// In ToolbarPlugin component, add useEffect for keyboard shortcuts
useEffect(() => {
  const removeKeyModifierCommand = activeEditor.registerCommand(
    KEY_MODIFIER_COMMAND,
    (event) => {
      // Text formatting shortcuts
      if (isShortcut(event, 'KeyB', { mod: true })) {
        event.preventDefault();
        activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
        return true;
      }
      
      if (isShortcut(event, 'KeyI', { mod: true })) {
        event.preventDefault();
        activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        return true;
      }
      
      if (isShortcut(event, 'KeyU', { mod: true })) {
        event.preventDefault();
        activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
        return true;
      }
      
      if (isShortcut(event, 'KeyS', { mod: true, shift: true })) {
        event.preventDefault();
        activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
        return true;
      }
      
      if (isShortcut(event, 'Backslash', { mod: true })) {
        event.preventDefault();
        clearFormatting(activeEditor);
        return true;
      }
      
      return false;
    },
    COMMAND_PRIORITY_NORMAL,
  );
  
  return () => {
    removeKeyModifierCommand();
  };
}, [activeEditor]);
```

#### Clear Formatting Helper

```javascript
function clearFormatting(editor) {
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Clear all text formats
      selection.formatText(0); // Clears all formatting flags
    }
  });
}
```

---

#### B. Block Type Shortcuts 📄

**Same Plugin**: Add to the KEY_MODIFIER_COMMAND handler in ToolbarPlugin.js

#### Shortcuts to Implement

| Shortcut | Windows/Linux | Mac | Action |
|----------|---------------|-----|--------|
| Heading 1 | `Ctrl+Alt+1` | `⌘⌥1` | Convert to H1 |
| Heading 2 | `Ctrl+Alt+2` | `⌘⌥2` | Convert to H2 |
| Heading 3 | `Ctrl+Alt+3` | `⌘⌥3` | Convert to H3 |
| Paragraph | `Ctrl+Alt+0` | `⌘⌥0` | Convert to paragraph |
| Bullet List | `Ctrl+Shift+8` | `⌘⇧8` | Toggle bullet list |
| Numbered List | `Ctrl+Shift+7` | `⌘⇧7` | Toggle numbered list |
| Quote | `Ctrl+Shift+Q` | `⌘⇧Q` | Convert to blockquote |
| Code Block | `Ctrl+Alt+C` | `⌘⌥C` | Convert to code block |

#### Implementation Pattern

**Location**: Extend the KEY_MODIFIER_COMMAND handler in ToolbarPlugin.js

```javascript
// Add to existing KEY_MODIFIER_COMMAND handler in ToolbarPlugin

// Block type shortcuts - Headings and Code (Ctrl/Cmd + Alt + Number/C)
if (isShortcut(event, 'Digit1', { mod: true, alt: true })) {
  event.preventDefault();
  formatHeading(activeEditor, 'h1');
  return true;
}

if (isShortcut(event, 'Digit2', { mod: true, alt: true })) {
  event.preventDefault();
  formatHeading(activeEditor, 'h2');
  return true;
}

if (isShortcut(event, 'Digit3', { mod: true, alt: true })) {
  event.preventDefault();
  formatHeading(activeEditor, 'h3');
  return true;
}

if (isShortcut(event, 'Digit0', { mod: true, alt: true })) {
  event.preventDefault();
  formatParagraph(activeEditor);
  return true;
}

if (isShortcut(event, 'KeyC', { mod: true, alt: true })) {
  event.preventDefault();
  formatCodeBlock(activeEditor);
  return true;
}

// Lists and Quote (Ctrl/Cmd + Shift)
if (isShortcut(event, 'Digit8', { mod: true, shift: true })) {
  event.preventDefault();
  activeEditor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  return true;
}

if (isShortcut(event, 'Digit7', { mod: true, shift: true })) {
  event.preventDefault();
  activeEditor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  return true;
}

if (isShortcut(event, 'KeyQ', { mod: true, shift: true })) {
  event.preventDefault();
  formatQuote(activeEditor);
  return true;
}
```

#### Helper Functions

```javascript
function formatHeading(editor, headingTag) {
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      $setBlocksType(selection, () => $createHeadingNode(headingTag));
    }
  });
}

function formatParagraph(editor) {
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      $setBlocksType(selection, () => $createParagraphNode());
    }
  });
}

function formatQuote(editor) {
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      $setBlocksType(selection, () => $createQuoteNode());
    }
  });
}

function formatCodeBlock(editor) {
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      $setBlocksType(selection, () => $createCodeNode());
    }
  });
}
```

---

#### C. Alignment Shortcuts ⬅️➡️

**Same Plugin**: Add to the KEY_MODIFIER_COMMAND handler in ToolbarPlugin.js

#### Shortcuts to Implement

| Shortcut | Windows/Linux | Mac | Command |
|----------|---------------|-----|---------|
| Align Left | `Ctrl+Shift+L` | `⌘⇧L` | `FORMAT_ELEMENT_COMMAND, 'left'` |
| Align Center | `Ctrl+Shift+E` | `⌘⇧E` | `FORMAT_ELEMENT_COMMAND, 'center'` |
| Align Right | `Ctrl+Shift+R` | `⌘⇧R` | `FORMAT_ELEMENT_COMMAND, 'right'` |
| Justify | `Ctrl+Shift+J` | `⌘⇧J` | `FORMAT_ELEMENT_COMMAND, 'justify'` |

#### Implementation Pattern

**Location**: Extend the KEY_MODIFIER_COMMAND handler in ToolbarPlugin.js

```javascript
// Add to existing KEY_MODIFIER_COMMAND handler in ToolbarPlugin

// Alignment shortcuts (Ctrl/Cmd + Shift + L/E/R/J)
if (isShortcut(event, 'KeyL', { mod: true, shift: true })) {
  event.preventDefault();
  activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
  return true;
}

if (isShortcut(event, 'KeyE', { mod: true, shift: true })) {
  event.preventDefault();
  activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
  return true;
}

if (isShortcut(event, 'KeyR', { mod: true, shift: true })) {
  event.preventDefault();
  activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
  return true;
}

if (isShortcut(event, 'KeyJ', { mod: true, shift: true })) {
  event.preventDefault();
  activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
  return true;
}
```

---

### Phase 2: Link Insertion Shortcut 🔗

**Priority**: MEDIUM  
**Effort**: Low (2-3 hours)  
**Dependencies**: Keyboard utils
**File**: `src/components/Editor3/plugins/FloatingLinkEditorPlugin.js`

Add `Ctrl/⌘+K` shortcut to insert/edit links.

#### Implementation Pattern

**Location**: Add to FloatingLinkEditorPlugin.js

```javascript
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { isShortcut } from '../utils/keyboardUtils';

// In FloatingLinkEditorPlugin component, add useEffect
useEffect(() => {
  const removeKeyCommand = editor.registerCommand(
    KEY_MODIFIER_COMMAND,
    (event) => {
      if (isShortcut(event, 'KeyK', { mod: true })) {
        event.preventDefault();
        
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection) && !selection.isCollapsed()) {
            // Open link editor for selected text
            setIsLink(true);
            return true;
          }
        });
      }
      return false;
    },
    COMMAND_PRIORITY_NORMAL,
  );
  
  return () => {
    removeKeyCommand();
  };
}, [editor]);
```

**Note**: This shows the link editing UI when text is selected and `Ctrl/⌘+K` is pressed.

---

### Phase 3: Verify Existing Shortcuts ✅

**Priority**: LOW  
**Effort**: Low (1-2 hours)  
**Dependencies**: None

Verify existing keyboard shortcuts still work correctly.

#### Already Implemented ✅

1. **TabIndentationPlugin** (`@lexical/react`)
   - Tab for indent
   - Shift+Tab for outdent
   - Works in paragraphs and lists

2. **MarkdownShortcutPlugin** (`@lexical/react`)
   - `# ` → Heading 1
   - `## ` → Heading 2
   - `### ` → Heading 3
   - `- ` or `* ` → Bullet list
   - `1. ` → Numbered list
   - `> ` → Block quote
   - ` ``` ` → Code block
   - `---` → Horizontal rule

3. **TableComponent.js**
   - Arrow keys for cell navigation
   - Tab to move to next cell
   - Enter to edit cell
   - Escape to exit editing
   - Ctrl/⌘+C/X/V for copy/cut/paste

4. **CodeActionMenuPlugin.js**
   - Enter twice to exit code block
   - Arrow down to exit code block

5. **BlockSuggestionPlugin.js**
   - Arrow up/down to navigate suggestions
   - Tab or Enter to accept
   - Escape to dismiss

6. **AIContentCompletionPlugin.js**
   - Tab or Arrow right to accept suggestion
   - Escape to dismiss

7. **FloatingLinkEditorPlugin.js**
   - Escape to close link editor
   - Enter to save link

8. **FileManager2.js**
   - Enter to save filename
   - Escape to cancel edit

9. **HistoryPlugin** (`@lexical/react`)
   - Ctrl/⌘+Z for undo
   - Ctrl/⌘+Y or Ctrl/⌘+Shift+Z for redo

#### Testing Checklist

- [ ] Verify Tab/Shift+Tab in paragraphs
- [ ] Verify Tab/Shift+Tab in lists (nesting)
- [ ] Verify Tab in code blocks inserts tab character
- [ ] Verify all markdown shortcuts work
- [ ] Verify table navigation shortcuts
- [ ] Verify code block exit shortcuts
- [ ] Verify block suggestion shortcuts
- [ ] Verify AI suggestion shortcuts
- [ ] Verify undo/redo shortcuts

---

### Phase 4: Testing & Integration 🎯

**Priority**: MEDIUM  
**Effort**: Medium (4-6 hours)  
**Dependencies**: Phases 1-3

Integrate all shortcuts and ensure no conflicts between plugins.

#### Priority Order (Handler Resolution)

When multiple shortcuts could apply, Lexical uses `COMMAND_PRIORITY` to control precedence:

```javascript
COMMAND_PRIORITY_CRITICAL  // Tables, custom blocks (highest)
COMMAND_PRIORITY_HIGH      // Specific plugins (AI, code, block suggestions)
COMMAND_PRIORITY_NORMAL    // General shortcuts (toolbar, links)
COMMAND_PRIORITY_LOW       // Fallback handlers (lowest)
```

**Usage in Plugins**:
- ToolbarPlugin → `COMMAND_PRIORITY_NORMAL`
- FloatingLinkEditorPlugin → `COMMAND_PRIORITY_NORMAL`
- TableComponent → `COMMAND_PRIORITY_CRITICAL` (already set)
- CodeActionMenuPlugin → `COMMAND_PRIORITY_HIGH` (already set)
- BlockSuggestionPlugin → `COMMAND_PRIORITY_LOW` (already set)

#### Context Checks

Plugins should check context before handling shortcuts:

```javascript
// In ToolbarPlugin keyboard handler
const removeKeyModifierCommand = activeEditor.registerCommand(
  KEY_MODIFIER_COMMAND,
  (event) => {
    // Let higher priority handlers process first
    const selection = activeEditor.getEditorState().read(() => $getSelection());
    
    if (!$isRangeSelection(selection)) {
      return false; // Not a text selection
    }
    
    // Check if we're in a special context that should handle its own shortcuts
    const anchorNode = selection.anchor.getNode();
    const parent = anchorNode.getParent();
    
    if ($isCodeNode(parent) || $isTableNode(parent)) {
      return false; // Let specialized handlers deal with it
    }
    
    // Handle toolbar shortcuts...
    if (isShortcut(event, 'KeyB', { mod: true })) {
      // ...
    }
    
    return false;
  },
  COMMAND_PRIORITY_NORMAL,
);
```

---

## Implementation Checklist

### Utilities & Setup
- [ ] Create `src/components/Editor3/utils/keyboardUtils.js`
- [ ] Implement `IS_APPLE` detection
- [ ] Implement `isModifierKey()` helper
- [ ] Implement `isShortcut()` helper
- [ ] Write unit tests for keyboard utils

### ToolbarPlugin Shortcuts (Phase 1)
- [ ] Import keyboard utils and required commands
- [ ] Add `KEY_MODIFIER_COMMAND` handler to ToolbarPlugin
- [ ] Implement Ctrl/⌘+B (Bold)
- [ ] Implement Ctrl/⌘+I (Italic)
- [ ] Implement Ctrl/⌘+U (Underline)
- [ ] Implement Ctrl/⌘+Shift+S (Strikethrough)
- [ ] Implement Ctrl/⌘+\ (Clear Formatting)
- [ ] Add `clearFormatting()` helper function
- [ ] Implement Ctrl/⌘+Alt+1 (Heading 1)
- [ ] Implement Ctrl/⌘+Alt+2 (Heading 2)
- [ ] Implement Ctrl/⌘+Alt+3 (Heading 3)
- [ ] Implement Ctrl/⌘+Alt+0 (Paragraph)
- [ ] Implement Ctrl/⌘+Shift+8 (Bullet List)
- [ ] Implement Ctrl/⌘+Shift+7 (Numbered List)
- [ ] Implement Ctrl/⌘+Shift+Q (Quote)
- [ ] Implement Ctrl/⌘+Alt+C (Code Block)
- [ ] Add helper functions: `formatHeading()`, `formatParagraph()`, `formatQuote()`, `formatCodeBlock()`
- [ ] Implement Ctrl/⌘+Shift+L (Align Left)
- [ ] Implement Ctrl/⌘+Shift+E (Align Center)
- [ ] Implement Ctrl/⌘+Shift+R (Align Right)
- [ ] Implement Ctrl/⌘+Shift+J (Justify)
- [ ] Add context checks to avoid conflicts with tables/code
- [ ] Test all ToolbarPlugin shortcuts

### FloatingLinkEditorPlugin Shortcuts (Phase 2)
- [ ] Import keyboard utils
- [ ] Add `KEY_MODIFIER_COMMAND` handler
- [ ] Implement Ctrl/⌘+K (Insert/Edit Link)
- [ ] Coordinate with existing link UI state
- [ ] Test link insertion with selected text
- [ ] Test link editing on existing links

### Verify Existing Shortcuts (Phase 3)
- [ ] Verify Tab works in paragraphs
- [ ] Verify Tab works in lists (nesting)
- [ ] Verify Shift+Tab works (outdent)
- [ ] Verify Tab in code blocks inserts tab character
- [ ] Verify `# ` creates H1
- [ ] Verify `## ` creates H2
- [ ] Verify `### ` creates H3
- [ ] Verify `- ` creates bullet list
- [ ] Verify `1. ` creates numbered list
- [ ] Verify `> ` creates quote
- [ ] Verify ` ``` ` creates code block
- [ ] Verify `---` creates horizontal rule
- [ ] Verify table navigation shortcuts
- [ ] Verify code block exit shortcuts
- [ ] Verify block suggestion shortcuts
- [ ] Verify AI suggestion shortcuts
- [ ] Verify undo/redo shortcuts

### Integration & Testing (Phase 4)
- [ ] Test shortcuts don't interfere with table navigation
- [ ] Test shortcuts don't interfere with code block behavior
- [ ] Test shortcuts don't interfere with custom blocks
- [ ] Test shortcuts don't interfere with AI suggestions
- [ ] Verify command priority handling
- [ ] Test on Mac
- [ ] Test on Windows/Linux
- [ ] Test in different browsers (Chrome, Firefox, Safari)
- [ ] Run Cypress E2E tests
- [ ] Fix any conflicts or issues

---

## Testing Strategy

### Manual Testing

Create test document with:
1. **Text Formatting Section**
   - Plain text to test bold, italic, underline, strikethrough
   - Formatted text to test clear formatting

2. **Block Types Section**
   - Paragraphs to convert to headings
   - Text to convert to lists
   - Text to convert to quotes/code

3. **Alignment Section**
   - Multiple paragraphs to test alignments
   - Headings to test alignment
   - Lists (should not align)

4. **Links Section**
   - Plain text to convert to link
   - Existing links to edit

5. **Lists Section**
   - Test Tab for nesting
   - Test Shift+Tab for outdenting
   - Test maximum depth

### Automated Testing

Create Cypress E2E tests:

```javascript
// cypress/e2e/keyboard-shortcuts.cy.ts
describe('Keyboard Shortcuts', () => {
  beforeEach(() => {
    cy.visit('/unit/test-unit');
    cy.get('[data-testid="editor"]').click();
  });

  it('should apply bold with Ctrl+B', () => {
    cy.get('[contenteditable="true"]')
      .type('Hello World')
      .type('{selectall}')
      .type('{ctrl}b');
    
    cy.get('strong').should('contain', 'Hello World');
  });

  it('should create heading with Ctrl+Alt+1', () => {
    cy.get('[contenteditable="true"]')
      .type('Heading Text')
      .type('{ctrl}{alt}1');
    
    cy.get('h1').should('contain', 'Heading Text');
  });

  // ... more tests
});
```

---

## Browser Compatibility Considerations

### Shortcut Conflicts

Some shortcuts may conflict with browser defaults:

| Shortcut | Browser Default | Resolution |
|----------|----------------|------------|
| Ctrl/⌘+K | Chrome search bar | `event.preventDefault()` |
| Ctrl/⌘+U | View source | `event.preventDefault()` |
| Ctrl/⌘+Shift+S | Save As | `event.preventDefault()` |
| Ctrl/⌘+L | Address bar | Use Shift+L instead ✅ |
| Ctrl/⌘+\ | None | Safe to use ✅ |

**Solution**: Always call `event.preventDefault()` before handling shortcuts to prevent browser defaults.

### Platform Detection

```javascript
const IS_APPLE = typeof navigator !== 'undefined' && 
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

// Use appropriate modifier
const mod = IS_APPLE ? event.metaKey : event.ctrlKey;
```

---

## Documentation Updates

### Update KEYBOARD_SHORTCUTS.md

After implementation, update the documentation to:
1. ✅ Mark all shortcuts as "Implemented"
2. Add implementation date
3. Add "Tested on" browsers/platforms
4. Link to KeyboardShortcutsPlugin.js

### Create User Guide

Create `docs/USER_GUIDE_KEYBOARD_SHORTCUTS.md`:
- Visual cheatsheet with icons
- Platform-specific instructions
- Common workflows using shortcuts
- Troubleshooting section

### Update ONBOARDING.md

Add keyboard shortcuts section to developer onboarding:
- Link to implementation plan
- Link to plugin architecture
- How to add new shortcuts

---

## Accessibility Notes

### Screen Reader Announcements

When shortcuts trigger actions, announce them:

```javascript
function announceShortcut(action) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.textContent = `${action} applied`;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}
```

### Keyboard-Only Navigation

Ensure all shortcut features are:
- [ ] Discoverable via toolbar tooltips
- [ ] Accessible via keyboard-only navigation
- [ ] Documented in help system
- [ ] Announced to screen readers

---

## Performance Considerations

### Event Handler Optimization

```javascript
// ✅ GOOD: Single event handler with switch
editor.registerCommand(KEY_MODIFIER_COMMAND, (event) => {
  switch (event.code) {
    case 'KeyB': return handleBold();
    case 'KeyI': return handleItalic();
    // ...
  }
}, COMMAND_PRIORITY_NORMAL);

// ❌ BAD: Multiple separate handlers
editor.registerCommand(KEY_MODIFIER_COMMAND, handleBold, ...);
editor.registerCommand(KEY_MODIFIER_COMMAND, handleItalic, ...);
```

### Lazy Loading

If the plugin becomes large, consider code splitting:

```javascript
// KeyboardShortcutsPlugin.js
const handlers = {
  formatting: () => import('./handlers/formattingHandlers'),
  blocks: () => import('./handlers/blockHandlers'),
  alignment: () => import('./handlers/alignmentHandlers'),
};
```

---

## Future Enhancements

### User Customization

**Priority**: LOW (Post-MVP)

Allow users to customize shortcuts:

```javascript
// User settings
const userShortcuts = {
  bold: { key: 'KeyB', mod: true },
  italic: { key: 'KeyI', mod: true },
  // ... customizable mappings
};
```

### Shortcut Help Dialog

**Priority**: MEDIUM

Show available shortcuts via `?` key or Help menu:

```javascript
// Ctrl/Cmd + / to show help
if (mod && code === 'Slash') {
  showShortcutHelpDialog();
  return true;
}
```

### Recording/Replay

**Priority**: LOW

Record sequences of shortcuts for tutorials:

```javascript
const recorder = new ShortcutRecorder(editor);
recorder.start();
// ... user performs actions
const sequence = recorder.stop();
```

---

## Success Criteria

Implementation is complete when:

✅ All shortcuts from [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md) work  
✅ Shortcuts distributed across appropriate plugins (not centralized)  
✅ Shared `keyboardUtils.js` created for platform detection  
✅ Shortcuts work on both Mac and Windows/Linux  
✅ No conflicts with browser defaults  
✅ No conflicts with existing plugin handlers (tables, code, etc.)  
✅ Context checks prevent interference between plugins  
✅ Automated tests pass  
✅ Manual testing checklist complete  
✅ Documentation updated  
✅ Accessibility verified  
✅ Code reviewed and merged  

---

## Estimated Timeline

| Phase | Effort | Duration |
|-------|--------|----------|
| Utilities: keyboardUtils.js | Low | 1-2 hours |
| Phase 1: ToolbarPlugin Shortcuts | Medium | 6-8 hours |
| Phase 2: Link Shortcut | Low | 2-3 hours |
| Phase 3: Verify Existing | Low | 1-2 hours |
| Phase 4: Testing & Integration | Medium | 4-6 hours |
| Documentation Updates | Low | 2-3 hours |
| **TOTAL** | | **16-24 hours** |

**Recommended Sprint**: 1 week (part-time) or 3-4 days (full-time)

**Reduced from original estimate** due to distributed approach - no central plugin needed, just extending existing plugins.

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Browser conflicts | Medium | High | Always preventDefault(), test all browsers |
| Plugin priority conflicts | High | Medium | Use COMMAND_PRIORITY_NORMAL for toolbar/links |
| Platform detection fails | Low | High | Test on actual Mac and Windows machines |
| Shortcuts interfere with tables/code | Medium | High | Add context checks in handler |
| Performance (multiple handlers) | Low | Low | Each plugin handles its own shortcuts efficiently |
| User confusion (new shortcuts) | Medium | Low | Update docs, add tooltips, announce changes |

---

## Related Files

### Files to Create
- [src/components/Editor3/utils/keyboardUtils.js](../src/components/Editor3/utils/keyboardUtils.js) - Platform detection and shortcut helpers
- [src/components/Editor3/utils/keyboardUtils.test.js](../src/components/Editor3/utils/keyboardUtils.test.js) - Tests for utils
- [docs/USER_GUIDE_KEYBOARD_SHORTCUTS.md](USER_GUIDE_KEYBOARD_SHORTCUTS.md) - User guide

### Files to Modify
- [src/components/Editor3/plugins/ToolbarPlugin.js](../src/components/Editor3/plugins/ToolbarPlugin.js) - Add shortcuts for formatting, blocks, alignment
- [src/components/Editor3/plugins/FloatingLinkEditorPlugin.js](../src/components/Editor3/plugins/FloatingLinkEditorPlugin.js) - Add Ctrl/⌘+K shortcut
- [docs/KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md) - Mark implemented shortcuts
- [docs/ONBOARDING.md](ONBOARDING.md) - Add shortcuts architecture section
- [package.json](../package.json) - Add test scripts if needed

### Files to Reference
- [src/components/Editor3/plugins/ToolBarPlugin.js](../src/components/Editor3/plugins/ToolBarPlugin.js) - Existing command dispatches
- [src/components/Editor3/plugins/FloatingLinkEditorPlugin.js](../src/components/Editor3/plugins/FloatingLinkEditorPlugin.js) - Link handling
- [src/components/Editor3/plugins/BlockSuggestionPlugin.js](../src/components/Editor3/plugins/BlockSuggestionPlugin.js) - Keyboard pattern example
- [src/components/Editor3/components/TableComponent.js](../src/components/Editor3/components/TableComponent.js) - Complex keyboard handling

---

## Questions & Decisions

### Open Questions
1. **Should Ctrl/⌘+S trigger save?** 
   - Current: Auto-save via DataPlugin
   - Recommendation: No, could conflict with browser save

2. **Should we support Vim-style shortcuts?**
   - Recommendation: No, not in MVP. Future enhancement.

3. **Should shortcuts work in read-only mode?**
   - Recommendation: No, disable in read-only (toolbar is disabled)

4. **Should we log shortcut usage analytics?**
   - Recommendation: Yes, track via existing analytics system

### Decisions Made
- ✅ Use **distributed architecture** - shortcuts in their relevant plugins
- ✅ Create shared `keyboardUtils.js` for platform detection
- ✅ Use `KEY_MODIFIER_COMMAND` instead of raw `keydown` events
- ✅ Always preventDefault() for custom shortcuts
- ✅ ToolbarPlugin handles formatting, blocks, lists, alignment
- ✅ FloatingLinkEditorPlugin handles link insertion
- ✅ Use `COMMAND_PRIORITY_NORMAL` for general shortcuts
- ✅ Add context checks to avoid conflicts with specialized handlers

---

**Next Steps**: 
1. Review this plan with team
2. Create GitHub issue/task
3. Create `keyboardUtils.js` utility
4. Begin Phase 1: ToolbarPlugin shortcuts
5. Iterate based on testing feedback

---

**Architecture Note**: This plan uses a **distributed approach** where each plugin handles its own keyboard shortcuts, rather than a centralized KeyboardShortcutsPlugin. This keeps shortcuts co-located with their features, making the code more maintainable and reducing coupling.

---

*Document maintained by: Development Team*  
*Last updated: January 31, 2026*  
*Architecture: Distributed (revised from centralized)*
