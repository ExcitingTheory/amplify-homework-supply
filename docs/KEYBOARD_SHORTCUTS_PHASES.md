# Keyboard Shortcuts Development Phases

**Created**: January 31, 2026  
**Related**: [Feature Spec](KEYBOARD_SHORTCUTS_FEATURE_SPEC.md) | [Testing Guide](KEYBOARD_SHORTCUTS_TESTING_GUIDE.md)

## Phase Overview

| Phase | Name | Complexity | Estimated Effort | Dependencies |
|-------|------|------------|------------------|--------------|
| 1 | Utilities & Setup | Low | 1-2 hours | None |
| 2 | ToolbarPlugin Shortcuts | Medium | 6-8 hours | Phase 1 |
| 3 | Link Shortcut | Low | 2-3 hours | Phase 1 |
| 4 | Verification & Integration | Medium | 4-6 hours | Phases 1-3 |

**Total Estimated Time**: 13-19 hours (2-3 days full-time, 1 week part-time)

---

## Phase 1: Utilities & Setup

**Goal**: Create shared keyboard utility functions for platform detection and shortcut matching.

### Deliverables
- [x] Create `src/components/Editor3/utils/keyboardUtils.js`
- [ ] Implement `IS_APPLE` platform detection
- [ ] Implement `isModifierKey()` function
- [ ] Implement `isShortcut()` function
- [ ] Add JSDoc comments
- [ ] Create `src/components/Editor3/utils/keyboardUtils.test.js`
- [ ] Write unit tests for all utility functions
- [ ] Ensure 100% test coverage for utils

### Success Criteria
- All utility functions work correctly
- Unit tests pass with 100% coverage
- Platform detection accurate on Mac and Windows
- No TypeScript/linting errors

### Files Created
- `src/components/Editor3/utils/keyboardUtils.js` (~80 lines)
- `src/components/Editor3/utils/keyboardUtils.test.js` (~150 lines)

### Dependencies
- None (standalone utilities)

### Estimated Time
- Implementation: 1 hour
- Testing: 1 hour
- **Total: 2 hours**

---

## Phase 2: ToolbarPlugin Shortcuts

**Goal**: Add keyboard shortcuts for text formatting, block types, lists, and alignment to ToolbarPlugin.

### Deliverables

#### 2A: Text Formatting Shortcuts
- [ ] Import keyboard utils in ToolbarPlugin.js
- [ ] Add `KEY_MODIFIER_COMMAND` handler
- [ ] Implement Ctrl/⌘+B (Bold)
- [ ] Implement Ctrl/⌘+I (Italic)
- [ ] Implement Ctrl/⌘+U (Underline)
- [ ] Implement Ctrl/⌘+Shift+S (Strikethrough)
- [ ] Implement Ctrl/⌘+\ (Clear Formatting)
- [ ] Create `clearFormatting()` helper function
- [ ] Test all formatting shortcuts

#### 2B: Block Type Shortcuts
- [ ] Implement Ctrl/⌘+Alt+1 (Heading 1)
- [ ] Implement Ctrl/⌘+Alt+2 (Heading 2)
- [ ] Implement Ctrl/⌘+Alt+3 (Heading 3)
- [ ] Implement Ctrl/⌘+Alt+0 (Paragraph)
- [ ] Implement Ctrl/⌘+Shift+Q (Quote)
- [ ] Implement Ctrl/⌘+Alt+C (Code Block)
- [ ] Create helper functions: `formatHeading()`, `formatParagraph()`, `formatQuote()`, `formatCodeBlock()`
- [ ] Add context checks (skip in tables/code blocks)
- [ ] Test all block shortcuts

#### 2C: List Shortcuts
- [ ] Implement Ctrl/⌘+Shift+8 (Bullet List)
- [ ] Implement Ctrl/⌘+Shift+7 (Numbered List)
- [ ] Test list creation and toggling

#### 2D: Alignment Shortcuts
- [ ] Implement Ctrl/⌘+Shift+L (Align Left)
- [ ] Implement Ctrl/⌘+Shift+E (Align Center)
- [ ] Implement Ctrl/⌘+Shift+R (Align Right)
- [ ] Implement Ctrl/⌘+Shift+J (Justify)
- [ ] Test alignment changes

### Success Criteria
- All 17 shortcuts implemented and working
- Context checks prevent conflicts with tables/code blocks
- `event.preventDefault()` called for all shortcuts
- No interference with existing functionality
- Integration tests pass

### Files Modified
- `src/components/Editor3/plugins/ToolbarPlugin.js` (~200 lines added)

### Files Created
- `src/components/Editor3/plugins/__tests__/ToolbarPlugin.shortcuts.test.js` (~400 lines)

### Dependencies
- Phase 1 (keyboard utils)
- Lexical packages: `@lexical/selection`, `@lexical/utils`, `@lexical/list`

### Estimated Time
- Formatting shortcuts (2A): 2 hours
- Block type shortcuts (2B): 2-3 hours
- List shortcuts (2C): 1 hour
- Alignment shortcuts (2D): 1 hour
- Testing & debugging: 2 hours
- **Total: 8-9 hours**

---

## Phase 3: Link Insertion Shortcut

**Goal**: Add Ctrl/⌘+K shortcut to insert/edit links via FloatingLinkEditorPlugin.

### Deliverables
- [ ] Import keyboard utils in FloatingLinkEditorPlugin.js
- [ ] Add `KEY_MODIFIER_COMMAND` handler
- [ ] Implement Ctrl/⌘+K shortcut
- [ ] Check for text selection (required)
- [ ] Show FloatingLinkEditor UI when shortcut triggered
- [ ] Handle existing link editing
- [ ] Test link insertion workflow
- [ ] Verify browser search dialog is prevented

### Success Criteria
- Ctrl/⌘+K shows link editor with selected text
- No-op when selection is collapsed
- Existing links can be edited
- Browser default (search dialog) is prevented
- Integration with existing link UI works correctly

### Files Modified
- `src/components/Editor3/plugins/FloatingLinkEditorPlugin.js` (~30 lines added)

### Files Created
- `src/components/Editor3/plugins/__tests__/FloatingLinkEditorPlugin.shortcuts.test.js` (~100 lines)

### Dependencies
- Phase 1 (keyboard utils)
- Lexical package: `@lexical/link`

### Estimated Time
- Implementation: 1.5 hours
- Testing: 1 hour
- **Total: 2.5 hours**

---

## Phase 4: Verification & Integration Testing

**Goal**: Ensure all shortcuts work correctly, no conflicts exist, and existing functionality is not broken.

### Deliverables

#### 4A: Verify Existing Shortcuts
- [ ] Test Tab in paragraphs (indent)
- [ ] Test Shift+Tab in paragraphs (outdent)
- [ ] Test Tab in lists (nest)
- [ ] Test Shift+Tab in lists (un-nest)
- [ ] Test Tab in code blocks (insert tab character)
- [ ] Test markdown shortcuts (# → H1, - → bullet, etc.)
- [ ] Test table navigation (Arrow keys, Tab, Enter, Esc)
- [ ] Test code block exit (Enter twice, Arrow down)
- [ ] Test block suggestions (Arrows, Tab, Enter, Esc)
- [ ] Test AI suggestions (Tab, Arrow right, Esc)
- [ ] Test undo/redo (Ctrl/⌘+Z, Ctrl/⌘+Y)

#### 4B: Context Conflict Testing
- [ ] Verify toolbar shortcuts don't fire in tables
- [ ] Verify toolbar shortcuts don't fire in code blocks
- [ ] Verify command priority handling works
- [ ] Test shortcuts in custom blocks (QuizNode, AnswerNode, etc.)

#### 4C: Cross-Browser Testing
- [ ] Test all shortcuts in Chrome (Mac & Windows)
- [ ] Test all shortcuts in Firefox (Mac & Windows)
- [ ] Test all shortcuts in Safari (Mac)
- [ ] Test all shortcuts in Edge (Windows)

#### 4D: E2E Testing (Cypress)
- [ ] Create Cypress test suite for shortcuts
- [ ] Test bold, italic, underline shortcuts
- [ ] Test heading shortcuts
- [ ] Test list shortcuts
- [ ] Test link insertion shortcut
- [ ] Test cross-platform (Mac vs. Windows keys)

#### 4E: Performance & Accessibility
- [ ] Verify event handler registration is fast (<5ms)
- [ ] Verify shortcut execution is instant (<10ms)
- [ ] Test with screen readers (VoiceOver, NVDA)
- [ ] Verify keyboard-only navigation works
- [ ] Check for memory leaks

### Success Criteria
- All existing shortcuts still work (no regressions)
- No conflicts between new and existing shortcuts
- All cross-browser tests pass
- All E2E tests pass
- Performance metrics met
- Accessibility verified

### Files Created
- `cypress/e2e/keyboard-shortcuts.cy.ts` (~300 lines)
- `docs/KEYBOARD_SHORTCUTS_STATUS.md` - Implementation status tracker

### Files Modified
- `docs/KEYBOARD_SHORTCUTS.md` - Mark shortcuts as implemented
- `docs/ONBOARDING.md` - Add shortcuts architecture section

### Dependencies
- Phases 1, 2, 3 complete

### Estimated Time
- Existing shortcuts verification: 1 hour
- Context conflict testing: 1 hour
- Cross-browser testing: 2 hours
- E2E tests: 1.5 hours
- Performance & accessibility: 1 hour
- Documentation updates: 1 hour
- **Total: 7.5 hours**

---

## Phase Completion Checklist

### After Each Phase

- [ ] All code implemented
- [ ] **[MANDATORY]** TypeScript/JavaScript compilation passes (no errors)
- [ ] All unit tests written and passing
- [ ] Code reviewed for quality
- [ ] No linting errors
- [ ] Documentation updated
- [ ] Changes committed to git

### After All Phases

- [ ] Full feature spec requirements met
- [ ] All test scenarios from Testing Guide covered
- [ ] Cross-browser validation complete
- [ ] Performance metrics verified
- [ ] Accessibility validated
- [ ] User documentation created
- [ ] [KEYBOARD_SHORTCUTS_STATUS.md](KEYBOARD_SHORTCUTS_STATUS.md) completed
- [ ] Ready for production deployment

---

## Risk Management

### Phase 2 Risks
**Risk**: Conflicts with table or code block shortcuts  
**Mitigation**: Add context checks, use `COMMAND_PRIORITY_NORMAL`  
**Contingency**: Adjust priority or add more specific context detection

**Risk**: Browser default shortcuts not prevented  
**Mitigation**: Always call `event.preventDefault()`  
**Contingency**: Test in all browsers, add browser-specific handling if needed

### Phase 3 Risks
**Risk**: Link editor state conflicts with shortcut  
**Mitigation**: Check existing link editor code, maintain state properly  
**Contingency**: Coordinate with FloatingLinkEditorPlugin author if issues arise

### Phase 4 Risks
**Risk**: Regressions in existing functionality  
**Mitigation**: Comprehensive testing checklist, verify all existing shortcuts  
**Contingency**: Rollback changes, fix conflicts, re-test

---

## Recommended Start Order

**Option 1: Sequential (Recommended)**
1. ✅ Phase 1 (Utilities) - Foundation for all other phases
2. Phase 2 (Toolbar) - Bulk of functionality
3. Phase 3 (Link) - Small addition
4. Phase 4 (Testing) - Validation

**Option 2: Parallel (Advanced)**
- Start Phase 1 first (required)
- After Phase 1 complete, do Phases 2 & 3 in parallel (if multiple developers)
- Phase 4 always last

**Option 3: MVP First**
1. Phase 1 (Utilities)
2. Phase 2A only (Text formatting shortcuts - most commonly used)
3. Phase 4 (Test just Phase 2A)
4. Later: Phases 2B-2D, then Phase 3
5. Final Phase 4 (Full testing)

---

## Next Steps

**Question for User**: Which phase would you like to start with?

**Recommendation**: Start with **Phase 1 (Utilities & Setup)** - it's the foundation for all other phases and can be completed quickly (1-2 hours).

After Phase 1 is complete and tested, we can move to Phase 2 to implement the bulk of keyboard shortcuts.

---

**Status**: Ready to begin Phase 1  
**Waiting for**: User confirmation to proceed
