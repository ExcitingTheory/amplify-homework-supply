# Feature: Keyboard Shortcuts for Lexical Editor

**Created**: January 31, 2026  
**Status**: 🟡 In Progress  
**Related Documents**: 
- [Implementation Plan](KEYBOARD_SHORTCUTS_IMPLEMENTATION_PLAN.md)
- [Keyboard Shortcuts Reference](KEYBOARD_SHORTCUTS.md)

## Overview

Add comprehensive keyboard shortcuts to the Homework Supply Editor (Lexical-based Editor3) following platform conventions (⌘ on Mac, Ctrl on Windows/Linux). Implementation uses a **distributed architecture** where shortcuts are added to existing plugins rather than creating a centralized plugin.

## Goals

### Primary Objectives
- ✅ Enable all keyboard shortcuts documented in [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md)
- ✅ Platform-aware (Mac vs. Windows/Linux) modifier key detection
- ✅ No conflicts with browser defaults or existing plugin handlers
- ✅ Consistent behavior across all supported browsers (Chrome, Firefox, Safari)

### Success Criteria
- All shortcuts from reference doc work on both Mac and Windows
- TypeScript compilation passes with strict mode
- No regression in existing keyboard functionality (tables, code blocks, AI suggestions)
- Automated tests cover all shortcut handlers
- Documentation updated with implementation status

## Technical Requirements

### TypeScript/JavaScript
- **Language**: JavaScript (.js) - existing plugins are JS, maintaining consistency
- **Type Safety**: JSDoc comments for function signatures
- **Compatibility**: ES6+ features, transpiled via Next.js

### Required Dependencies
- `@lexical/react` - KEY_MODIFIER_COMMAND, format commands
- `@lexical/selection` - $getSelection, $isRangeSelection
- `@lexical/utils` - $setBlocksType
- `@lexical/list` - INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND
- `@lexical/link` - TOGGLE_LINK_COMMAND
- `lexical` - FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## API Design

### Utility Functions (keyboardUtils.js)

```javascript
/**
 * Detect if running on Apple platform (Mac, iPad, iPhone)
 * @returns {boolean}
 */
export const IS_APPLE: boolean;

/**
 * Check if the modifier key is pressed (⌘ on Mac, Ctrl on Windows/Linux)
 * @param {KeyboardEvent} event
 * @returns {boolean}
 */
export function isModifierKey(event: KeyboardEvent): boolean;

/**
 * Check if a specific keyboard shortcut is pressed
 * @param {KeyboardEvent} event
 * @param {string} key - Key code (e.g., 'KeyB', 'Digit1')
 * @param {Object} modifiers - { mod, shift, alt }
 * @param {boolean} [modifiers.mod=false] - Require Cmd/Ctrl
 * @param {boolean} [modifiers.shift=false] - Require Shift
 * @param {boolean} [modifiers.alt=false] - Require Alt/Option
 * @returns {boolean}
 */
export function isShortcut(
  event: KeyboardEvent, 
  key: string, 
  modifiers?: { mod?: boolean; shift?: boolean; alt?: boolean }
): boolean;
```

### Plugin Integration Points

#### ToolbarPlugin.js
- Registers `KEY_MODIFIER_COMMAND` handler
- Priority: `COMMAND_PRIORITY_NORMAL`
- Handles: Text formatting, block types, lists, alignment
- Context checks: Skip if in tables or code blocks

#### FloatingLinkEditorPlugin.js
- Registers `KEY_MODIFIER_COMMAND` handler
- Priority: `COMMAND_PRIORITY_NORMAL`
- Handles: Ctrl/⌘+K link insertion/editing
- Shows link UI when text is selected

## Implementation Architecture

### Distributed Approach

Shortcuts are **not** centralized in a single plugin. Instead, each plugin handles its own shortcuts:

| Plugin | Shortcuts Handled | Rationale |
|--------|-------------------|-----------|
| `keyboardUtils.ts` | Platform detection utilities | Shared across all plugins |
| `ToolbarPlugin` | Formatting, blocks, lists, alignment | Already has toolbar UI and command dispatch |
| `FloatingLinkEditorPlugin` | Insert/edit link (Ctrl/⌘+K) | Already manages link editing state |
| `TabIndentationPlugin` | Tab/Shift+Tab ✅ (existing) | Built-in Lexical plugin |
| `TableComponent` | Table navigation ✅ (existing) | Complex table-specific handlers |
| `CodeActionMenuPlugin` | Code block exit ✅ (existing) | Code block context |
### Command Priority System

When multiple plugins could handle a shortcut, Lexical uses `COMMAND_PRIORITY`:

```javascript
COMMAND_PRIORITY_CRITICAL  // Tables, custom blocks (highest)
COMMAND_PRIORITY_HIGH      // AI, code, block suggestions
COMMAND_PRIORITY_NORMAL    // Toolbar, links (new shortcuts)
COMMAND_PRIORITY_LOW       // Fallback handlers (lowest)
```

Higher priority handlers execute first and can return `true` to prevent propagation.

## Keyboard Shortcuts Specification

### Text Formatting

| Shortcut | Windows/Linux | Mac | Action | Command |
|----------|---------------|-----|--------|---------|
| Bold | `Ctrl+B` | `⌘B` | Toggle bold | `FORMAT_TEXT_COMMAND, 'bold'` |
| Italic | `Ctrl+I` | `⌘I` | Toggle italic | `FORMAT_TEXT_COMMAND, 'italic'` |
| Underline | `Ctrl+U` | `⌘U` | Toggle underline | `FORMAT_TEXT_COMMAND, 'underline'` |
| Strikethrough | `Ctrl+Shift+S` | `⌘⇧S` | Toggle strikethrough | `FORMAT_TEXT_COMMAND, 'strikethrough'` |
| Clear Formatting | `Ctrl+\` | `⌘\` | Remove all formats | `clearFormatting()` helper |

### Block Types

| Shortcut | Windows/Linux | Mac | Action | Command |
|----------|---------------|-----|--------|---------|
| Heading 1 | `Ctrl+Alt+1` | `⌘⌥1` | Convert to H1 | `$setBlocksType(selection, $createHeadingNode('h1'))` |
| Heading 2 | `Ctrl+Alt+2` | `⌘⌥2` | Convert to H2 | `$setBlocksType(selection, $createHeadingNode('h2'))` |
| Heading 3 | `Ctrl+Alt+3` | `⌘⌥3` | Convert to H3 | `$setBlocksType(selection, $createHeadingNode('h3'))` |
| Paragraph | `Ctrl+Alt+0` | `⌘⌥0` | Convert to paragraph | `$setBlocksType(selection, $createParagraphNode())` |
| Quote | `Ctrl+Shift+Q` | `⌘⇧Q` | Convert to blockquote | `$setBlocksType(selection, $createQuoteNode())` |
| Code Block | `Ctrl+Alt+C` | `⌘⌥C` | Convert to code | `$setBlocksType(selection, $createCodeNode())` |

### Lists

| Shortcut | Windows/Linux | Mac | Action | Command |
|----------|---------------|-----|--------|---------|
| Bullet List | `Ctrl+Shift+8` | `⌘⇧8` | Toggle bullet list | `INSERT_UNORDERED_LIST_COMMAND` |
| Numbered List | `Ctrl+Shift+7` | `⌘⇧7` | Toggle numbered list | `INSERT_ORDERED_LIST_COMMAND` |

### Alignment

| Shortcut | Windows/Linux | Mac | Action | Command |
|----------|---------------|-----|--------|---------|
| Align Left | `Ctrl+Shift+L` | `⌘⇧L` | Left align | `FORMAT_ELEMENT_COMMAND, 'left'` |
| Align Center | `Ctrl+Shift+E` | `⌘⇧E` | Center align | `FORMAT_ELEMENT_COMMAND, 'center'` |
| Align Right | `Ctrl+Shift+R` | `⌘⇧R` | Right align | `FORMAT_ELEMENT_COMMAND, 'right'` |
| Justify | `Ctrl+Shift+J` | `⌘⇧J` | Justify | `FORMAT_ELEMENT_COMMAND, 'justify'` |

### Links

| Shortcut | Windows/Linux | Mac | Action | Implementation |
|----------|---------------|-----|--------|----------------|
| Insert Link | `Ctrl+K` | `⌘K` | Insert/edit link | Show FloatingLinkEditor UI |

## Implementation Notes

### Platform Detection

```javascript
// Detect Apple platforms
const IS_APPLE = typeof navigator !== 'undefined' && 
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

// Use appropriate modifier
const mod = IS_APPLE ? event.metaKey : event.ctrlKey;
```

### Preventing Browser Defaults

Always call `event.preventDefault()` before handling shortcuts to prevent:
- Ctrl/⌘+K → Browser search bar
- Ctrl/⌘+U → View source
- Ctrl/⌘+Shift+S → Save As dialog

### Context Awareness

ToolbarPlugin checks context before handling shortcuts:

```javascript
// Don't handle shortcuts in tables or code blocks
const anchorNode = selection.anchor.getNode();
const parent = anchorNode.getParent();

if ($isCodeNode(parent) || $isTableNode(parent)) {
  return false; // Let specialized handlers deal with it
}
```

### Performance Optimization

Single event handler per plugin using switch/if-else for multiple shortcuts:

```javascript
// ✅ GOOD: One handler, multiple shortcuts
editor.registerCommand(KEY_MODIFIER_COMMAND, (event) => {
  if (isShortcut(event, 'KeyB', { mod: true })) { /* ... */ }
  if (isShortcut(event, 'KeyI', { mod: true })) { /* ... */ }
  // ...
  return false;
}, COMMAND_PRIORITY_NORMAL);

// ❌ BAD: Separate handler per shortcut
```

## Edge Cases

### Browser Conflicts
- Ctrl/⌘+K conflicts with Chrome search → `event.preventDefault()` required
- Ctrl/⌘+U conflicts with View Source → `event.preventDefault()` required
- Ctrl/⌘+L conflicts with address bar → Use Shift+L instead (already planned)

### Plugin Priority Conflicts
- Table shortcuts (Tab, arrows) have `COMMAND_PRIORITY_CRITICAL`
- Code block shortcuts (Enter, arrows) have `COMMAND_PRIORITY_HIGH`
- New toolbar shortcuts use `COMMAND_PRIORITY_NORMAL` (won't interfere)

### Special Contexts
- In tables: Let `TableComponent.js` handle all shortcuts
- In code blocks: Let `CodeActionMenuPlugin.js` handle Enter/arrows
- In custom blocks: Higher priority handlers take precedence

### Invalid States
- No selection: Return `false`, don't handle
- Collapsed selection: Some shortcuts require text selection (e.g., Ctrl/⌘+K)
- Read-only mode: Toolbar is disabled, shortcuts won't fire

## Error Handling

### Missing Dependencies
If required Lexical packages aren't imported:
- TypeScript/JSDoc will show missing import errors
- Runtime error if command not registered

### Platform Detection Failure
If `navigator` is undefined (SSR):
- `IS_APPLE` falls back to `false` (assumes Windows/Linux)
- Still functional, just uses Ctrl instead of Cmd

### Event Handler Errors
If shortcut handler throws exception:
- Lexical catches and logs to console
- Editor remains functional
- Other shortcuts still work

## Security Considerations

### No Security Risks
- Keyboard shortcuts are client-side only
- No data transmission or storage
- No XSS risk (not inserting user-controlled HTML)
- No CSRF risk (no server requests)

### Performance Impact
- Minimal: Single event listener per plugin
- No DOM manipulation outside editor
- No network requests

## Accessibility

### Screen Reader Announcements
When shortcuts trigger actions, announce to screen readers:

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
All shortcut features must be:
- Discoverable via toolbar button tooltips
- Accessible without mouse
- Documented in help system
- Screen reader compatible

## Testing Strategy

### Unit Tests
- Test `isShortcut()` with various key combinations
- Test platform detection (`IS_APPLE`)
- Test helper functions (clearFormatting, formatHeading, etc.)
- Mock KeyboardEvent objects

### Integration Tests
- Test shortcuts in actual editor instance
- Test priority conflicts (table vs. toolbar)
- Test context switching (paragraph → code → table)
- Test on Mac and Windows

### E2E Tests (Cypress)
- Type text, select, apply bold (Ctrl/⌘+B)
- Create heading (Ctrl/⌘+Alt+1)
- Insert link (Ctrl/⌘+K)
- Verify across browsers

### Browser Compatibility Tests
- Chrome, Firefox, Safari, Edge
- Mac and Windows/Linux
- Verify preventDefault() works

## Migration Strategy

Not applicable - this is a new feature enhancement, not a rewrite or migration.

## Documentation Requirements

- [x] Implementation plan created ([KEYBOARD_SHORTCUTS_IMPLEMENTATION_PLAN.md](KEYBOARD_SHORTCUTS_IMPLEMENTATION_PLAN.md))
- [ ] Update [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md) with implementation status
- [ ] Create user guide with visual cheatsheet
- [ ] Update [ONBOARDING.md](ONBOARDING.md) with keyboard shortcuts architecture
- [ ] Add toolbar button tooltips showing shortcuts
- [ ] Create help dialog (Ctrl/⌘+/ to show shortcuts)

## Future Enhancements

### User Customization (Post-MVP)
Allow users to remap shortcuts:
```javascript
const userShortcuts = {
  bold: { key: 'KeyB', mod: true },
  italic: { key: 'KeyI', mod: true },
  // ... customizable
};
```

### Shortcut Recording/Replay (Post-MVP)
Record sequences for tutorials:
```javascript
const recorder = new ShortcutRecorder(editor);
recorder.start();
// ... user performs actions
const sequence = recorder.stop();
```

### Vim Mode (Post-MVP)
Optional Vim-style keyboard shortcuts for power users.

## Success Metrics

### Completion Criteria
- [ ] All shortcuts from [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md) implemented
- [ ] TypeScript compilation passes (if converted to TS)
- [ ] All unit tests passing (>80% coverage)
- [ ] All E2E tests passing
- [ ] No browser console errors
- [ ] No regressions in existing functionality
- [ ] Documentation updated

### Performance Metrics
- Event handler registration: <5ms per plugin
- Shortcut execution: <10ms (should feel instant)
- No impact on editor initialization time
- No memory leaks from event listeners

## Timeline Estimate

| Phase | Effort | Duration |
|-------|--------|----------|
| Utils (keyboardUtils.js) | Low | 1-2 hours |
| ToolbarPlugin shortcuts | Medium | 6-8 hours |
| FloatingLinkEditorPlugin | Low | 2-3 hours |
| Verify existing shortcuts | Low | 1-2 hours |
| Testing & Integration | Medium | 4-6 hours |
| Documentation | Low | 2-3 hours |
| **TOTAL** | | **16-24 hours** |

**Recommended Sprint**: 1 week part-time or 3-4 days full-time

## Related Files

### Files to Create
- `src/components/Editor3/utils/keyboardUtils.js` - Platform detection utilities
- `src/components/Editor3/utils/keyboardUtils.test.js` - Unit tests for utils
- `docs/KEYBOARD_SHORTCUTS_TESTING_GUIDE.md` - Testing specification
- `docs/KEYBOARD_SHORTCUTS_STATUS.md` - Implementation status tracker
- `docs/USER_GUIDE_KEYBOARD_SHORTCUTS.md` - User-facing guide

### Files to Modify
- `src/components/Editor3/plugins/ToolbarPlugin.js` - Add formatting/block/alignment shortcuts
- `src/components/Editor3/plugins/FloatingLinkEditorPlugin.js` - Add Ctrl/⌘+K shortcut
- `docs/KEYBOARD_SHORTCUTS.md` - Mark shortcuts as implemented
- `docs/ONBOARDING.md` - Add shortcuts architecture section

### Files to Reference
- `src/components/Editor3/plugins/BlockSuggestionPlugin.js` - Example keyboard handling
- `src/components/Editor3/components/TableComponent.js` - Complex keyboard patterns
- `src/components/Editor3/plugins/AIContentCompletionPlugin.js` - Event handler examples

---

**Status**: Ready for implementation  
**Next Steps**: Create Testing Guide → Break down into phases → Begin Phase 1
