# Block Component Accessibility & Interaction Standardization Plan

## Overview

This document outlines the plan to standardize keyboard selection, deletion, mouse interactions, and accessibility outlines across all block-level components in the Editor3 system.

## Current State Analysis

### Components with Proper Implementation ✅

The following components already implement the standard pattern with `useLexicalNodeSelection`:

1. **ImageComponent** ([src/components/Editor3/components/ImageComponent.js](src/components/Editor3/components/ImageComponent.js))
   - ✅ Uses `useLexicalNodeSelection(nodeKey)`
   - ✅ Handles DELETE/BACKSPACE commands
   - ✅ Handles ESCAPE command
   - ✅ Click handler for selection
   - ✅ Visual selection state with outline
   - ✅ Keyboard navigation support

2. **QuizEditor** ([src/components/Editor3/components/QuizEditor.js](src/components/Editor3/components/QuizEditor.js))
   - ✅ Uses `useLexicalNodeSelection(nodeKey)`
   - ✅ DELETE/BACKSPACE handlers
   - ✅ ESCAPE handler
   - ✅ Click handler
   - ⚠️ Border-based selection (`border: '2px solid #1976d2'`)

3. **AnswerEditor** ([src/components/Editor3/components/AnswerEditor.js](src/components/Editor3/components/AnswerEditor.js))
   - ✅ Uses `useLexicalNodeSelection(nodeKey)`
   - ✅ DELETE/BACKSPACE handlers
   - ✅ ESCAPE handler
   - ✅ Click handler
   - ⚠️ Border-based selection (`border: '2px solid #1976d2'`)

4. **MeaningAssociationEditor** ([src/components/Editor3/components/MeaningAssociationEditor.js](src/components/Editor3/components/MeaningAssociationEditor.js))
   - ✅ Uses `useLexicalNodeSelection(nodeKey)`
   - ✅ DELETE/BACKSPACE handlers
   - ✅ ESCAPE handler
   - ✅ Click handler
   - ⚠️ Border-based selection (`border: '2px solid #1976d2'`)

5. **CustomAnswerEditor** ([src/components/Editor3/nodes/CustomAnswerNode/CustomAnswerEditor.js](src/components/Editor3/nodes/CustomAnswerNode/CustomAnswerEditor.js))
   - ✅ Uses `useLexicalNodeSelection(nodeKey)`
   - ✅ DELETE/BACKSPACE handlers
   - ⚠️ Missing ESCAPE handler
   - ✅ Click handler
   - ⚠️ Border-based selection (`border: '2px solid #1976d2'`)

6. **PdfViewerComponent** ([src/components/Editor3/components/PdfViewerComponent.js](src/components/Editor3/components/PdfViewerComponent.js))
   - ✅ Uses `useLexicalNodeSelection(nodeKey)`
   - ✅ DELETE/BACKSPACE handlers
   - ✅ ESCAPE handler
   - ✅ Click handler
   - ✅ Outline-based selection (`outline: '2px solid #1976d2'`)
   - ✅ ENTER handler for inserting paragraph

7. **TableComponent** ([src/components/Editor3/components/TableComponent.js](src/components/Editor3/components/TableComponent.js))
   - ✅ Uses `useLexicalNodeSelection(nodeKey)`
   - ✅ DELETE/BACKSPACE handlers
   - ✅ ESCAPE handler
   - ✅ Complex cell selection logic
   - ✅ CSS class-based selection (`.tableSelected`)

8. **PlaylistEditor** ([src/components/Editor3/components/PlaylistEditor.js](src/components/Editor3/components/PlaylistEditor.js))
   - ⚠️ May need verification - has keyboard handlers
   - ⚠️ Need to check if using `useLexicalNodeSelection`

### Components Needing Updates ⚠️

1. **FileMetadataComponent** ([src/components/Editor3/nodes/FileMetadataNode/FileMetadataComponent.js](src/components/Editor3/nodes/FileMetadataNode/FileMetadataComponent.js))
   - ❌ Uses manual `useState(false)` for selection instead of `useLexicalNodeSelection`
   - ❌ Missing keyboard handlers (DELETE/BACKSPACE/ESCAPE)
   - ❌ No accessibility outline
   - ❌ Selection is managed manually via checkbox
   - **Impact**: Cannot be selected/deleted via keyboard

2. **ExcalidrawNode** ([src/components/Editor3/nodes/ExcalidrawNode/index.ts](src/components/Editor3/nodes/ExcalidrawNode/index.ts))
   - ❌ `decorate()` method returns `null` - component disabled
   - ❌ No component implementation exists (ExcalidrawComponent not found)
   - ❌ Missing all interaction handlers
   - **Impact**: Non-functional block type

### Outline Style Inconsistencies

**Current Implementations:**

1. **Border-based** (4 components):
   ```javascript
   border: isSelected ? '2px solid #1976d2' : '1px solid transparent'
   ```
   - QuizEditor
   - AnswerEditor
   - MeaningAssociationEditor
   - CustomAnswerEditor

2. **Outline-based** (2 components):
   ```javascript
   outline: isSelected ? '2px solid #1976d2' : 'none',
   outlineOffset: '2px'
   ```
   - PdfViewerComponent
   - ImageComponent (uses CSS class)

3. **CSS Class-based** (1 component):
   ```css
   .LanguageEditorTheme__tableSelected {
     outline: 2px solid rgb(60, 132, 244);
   }
   ```
   - TableComponent

**Theme CSS Values:**
- Primary selection color in CSS: `rgb(60, 132, 244)` (#3C84F4)
- Inline selection color: `#1976d2` (Material-UI primary blue)

## Issues to Address

### 1. **Child Container Outline Skewing**

**Problem**: When block components contain child elements with their own padding/margins, the outline appears to encircle empty space rather than the actual content.

**Example Scenario**:
```
┌─ Outline ──────────────────┐
│  ┌─ Child Container ─────┐ │  ← Empty space
│  │                        │ │
│  │  Actual Content        │ │
│  │                        │ │
│  └────────────────────────┘ │
└────────────────────────────┘
```

**Solution Options**:
1. Apply outline to the immediate content wrapper instead of root container
2. Use `box-sizing: border-box` consistently
3. Add negative `outline-offset` to compensate for padding
4. Consider using `::after` pseudo-element for outline visualization

### 2. **Inconsistent Selection Indicators**

**Problem**: Three different visual patterns create inconsistent UX.

**Recommended Standard**: Use outline-based approach
- **Pros**: Doesn't affect layout, doesn't push content, better for accessibility
- **Cons**: Can be clipped by `overflow: hidden` parents

**Recommended Values**:
```javascript
{
  outline: isSelected ? '2px solid #1976d2' : 'none',
  outlineOffset: '2px',
  transition: 'outline 0.15s ease-in-out'
}
```

### 3. **Missing Keyboard Support**

**Problem**: FileMetadataComponent cannot be navigated or deleted via keyboard.

**Required Handlers**:
```javascript
useEffect(() => {
  return mergeRegister(
    editor.registerCommand(
      KEY_DELETE_COMMAND,
      onDelete,
      COMMAND_PRIORITY_LOW
    ),
    editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      onDelete,
      COMMAND_PRIORITY_LOW
    ),
    editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      onEscape,
      COMMAND_PRIORITY_LOW
    ),
    editor.registerCommand(
      CLICK_COMMAND,
      onClick,
      COMMAND_PRIORITY_LOW
    )
  );
}, [editor, isSelected, ...]);
```

## Implementation Plan

### Phase 1: Standardize Outline Styles (2-3 hours)

**Priority: Medium-High**

#### Tasks:

1. **Define Standard Outline Theme Variables**
   - Update [src/components/Editor3/theme.css](src/components/Editor3/theme.css)
   - Add CSS custom properties for consistent theming
   ```css
   :root {
     --editor-block-outline-color: #1976d2;
     --editor-block-outline-width: 2px;
     --editor-block-outline-offset: 2px;
     --editor-block-outline-transition: outline 0.15s ease-in-out;
   }
   ```

2. **Convert Border-based to Outline-based**
   - [ ] Update QuizEditor.js
   - [ ] Update AnswerEditor.js
   - [ ] Update MeaningAssociationEditor.js
   - [ ] Update CustomAnswerEditor.js
   
   **Change Pattern**:
   ```javascript
   // OLD
   sx={{
     border: isSelected ? '2px solid #1976d2' : '1px solid transparent',
     borderRadius: '4px',
     padding: 2
   }}
   
   // NEW
   sx={{
     outline: isSelected ? '2px solid #1976d2' : 'none',
     outlineOffset: '2px',
     borderRadius: '4px',
     padding: 2,
     transition: 'outline 0.15s ease-in-out'
   }}
   ```

3. **Fix Child Container Outline Issues**
   - Audit each component for nested containers
   - Apply outline to the correct wrapper level
   - Test with various content sizes
   
   **Example Fix Pattern**:
   ```javascript
   // Wrap content in a focused container
   <Box
     ref={containerRef}
     sx={{
       outline: isSelected ? '2px solid #1976d2' : 'none',
       outlineOffset: '2px',
       // Remove any padding that creates empty space
       // or apply padding to inner container instead
     }}
   >
     <Box sx={{ padding: 2 }}> {/* Inner padding */}
       {/* Actual content */}
     </Box>
   </Box>
   ```

### Phase 2: Fix FileMetadataComponent (2-4 hours)

**Priority: High**

#### Tasks:

1. **Replace Manual Selection State**
   ```javascript
   // OLD
   const [isSelected, setIsSelected] = useState(false);
   
   // NEW
   const [editor] = useLexicalComposerContext();
   const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
   ```

2. **Add Keyboard Handlers**
   ```javascript
   // Delete handler
   const onDelete = useCallback((payload) => {
     if (isSelected && $isNodeSelection($getSelection())) {
       const event = payload;
       event.preventDefault();
       editor.update(() => {
         const node = $getNodeByKey(nodeKey);
         if ($isFileMetadataNode(node)) {
           node.remove();
           // Optionally call onRemove callback
           if (onRemove) onRemove(nodeKey);
         }
       });
       return true;
     }
     return false;
   }, [isSelected, nodeKey, editor, onRemove]);

   // Escape handler
   const onEscape = useCallback((payload) => {
     if (isSelected) {
       const event = payload;
       event.preventDefault();
       clearSelection();
       return true;
     }
     return false;
   }, [isSelected, clearSelection]);

   // Click handler
   const onClick = useCallback((payload) => {
     const event = payload;
     if (event.target === containerRef.current || 
         containerRef.current?.contains(event.target)) {
       if (!isSelected) {
         setSelected(true);
         return true;
       }
     }
     return false;
   }, [isSelected, setSelected]);
   ```

3. **Register Commands**
   ```javascript
   useEffect(() => {
     return mergeRegister(
       editor.registerCommand(
         KEY_DELETE_COMMAND,
         onDelete,
         COMMAND_PRIORITY_LOW
       ),
       editor.registerCommand(
         KEY_BACKSPACE_COMMAND,
         onDelete,
         COMMAND_PRIORITY_LOW
       ),
       editor.registerCommand(
         KEY_ESCAPE_COMMAND,
         onEscape,
         COMMAND_PRIORITY_LOW
       ),
       editor.registerCommand(
         CLICK_COMMAND,
         onClick,
         COMMAND_PRIORITY_LOW
       )
     );
   }, [editor, onDelete, onEscape, onClick]);
   ```

4. **Add Visual Selection Indicator**
   ```javascript
   <Paper
     ref={containerRef}
     sx={{
       outline: isSelected ? '2px solid #1976d2' : 'none',
       outlineOffset: '2px',
       transition: 'outline 0.15s ease-in-out',
       backgroundColor: isEvenRow ? 'grey.50' : 'background.paper',
       // ... other styles
     }}
   >
     {/* content */}
   </Paper>
   ```

### Phase 3: Add Missing Features (1-2 hours)

**Priority: Medium**

#### Tasks:

1. **Add ESCAPE Handler to CustomAnswerEditor**
   - Follow pattern from AnswerEditor
   - Test selection clearing

2. **Verify PlaylistEditor Implementation**
   - Check if using `useLexicalNodeSelection`
   - Add if missing
   - Test keyboard interactions

3. **Consider ENTER Handler for Navigation**
   - Some blocks (PdfViewer) support ENTER to insert paragraph below
   - Evaluate if this should be standard for all blocks
   - Would improve keyboard navigation UX

### Phase 4: ExcalidrawNode Investigation (Optional)

**Priority: Low**

The ExcalidrawNode appears to be disabled (returns `null` from `decorate()`). 

**Options**:
1. **Remove if unused**: Delete the node type and plugin if not in use
2. **Implement if needed**: Create ExcalidrawComponent with full interaction support
3. **Defer**: Leave as-is if planned for future implementation

## Testing Plan

### Manual Testing Checklist

For each updated component:

- [ ] **Keyboard Selection**
  - [ ] Click to select shows outline
  - [ ] Arrow keys navigate between blocks
  - [ ] Multiple selections work correctly
  
- [ ] **Keyboard Deletion**
  - [ ] DELETE key removes block
  - [ ] BACKSPACE key removes block
  - [ ] Undo/redo works correctly
  
- [ ] **Escape Behavior**
  - [ ] ESC clears selection
  - [ ] Focus returns to editor
  
- [ ] **Mouse Interactions**
  - [ ] Single click selects
  - [ ] Click outside deselects
  - [ ] Drag handles work (if applicable)
  
- [ ] **Visual Appearance**
  - [ ] Outline appears on selection
  - [ ] Outline doesn't create layout shift
  - [ ] Outline is clearly visible
  - [ ] Outline doesn't encircle excessive empty space
  - [ ] Outline works in dark mode (if applicable)
  
- [ ] **Accessibility**
  - [ ] `tabIndex` set correctly for keyboard navigation
  - [ ] ARIA attributes present where needed
  - [ ] Screen reader announces selection state

### Automated Testing

Add Cypress E2E tests for block interactions:

```javascript
// cypress/e2e/block-interactions.cy.js
describe('Block Component Keyboard Interactions', () => {
  it('should select block on click', () => {
    cy.get('[data-block-type="quiz"]').first().click();
    cy.get('[data-block-type="quiz"]').first()
      .should('have.css', 'outline-color', 'rgb(25, 118, 210)');
  });
  
  it('should delete block on DELETE key', () => {
    cy.get('[data-block-type="quiz"]').first().click();
    cy.get('body').type('{del}');
    cy.get('[data-block-type="quiz"]').should('not.exist');
  });
  
  it('should deselect on ESC key', () => {
    cy.get('[data-block-type="quiz"]').first().click();
    cy.get('body').type('{esc}');
    cy.get('[data-block-type="quiz"]').first()
      .should('have.css', 'outline-style', 'none');
  });
});
```

## Component-Specific Considerations

### QuizEditor
- Contains DataGrid and interactive controls
- Need to ensure keyboard shortcuts don't conflict with grid navigation
- Consider `stopPropagation()` for certain child interactions

### CustomAnswerEditor
- Contains nested Question components with audio players
- Audio player controls should not trigger block selection
- Test with multiple question items

### FileMetadataComponent
- Has tabs and expandable sections
- Tab navigation should work independently of block selection
- Checkbox selection conflicts with block selection - needs UX decision

### MeaningAssociationEditor
- DataGrid with word selection
- Similar concerns to QuizEditor
- Row selection vs block selection needs clear UX

## Open Questions

1. **Color Standardization**: Should we use `#1976d2` or `rgb(60, 132, 244)` as the standard?
   - **Recommendation**: Use `#1976d2` (Material-UI primary) for consistency with theme

2. **Outline vs Border**: Should TableComponent convert to outline for consistency?
   - **Recommendation**: Yes, but test carefully as tables have complex selection states

3. **FileMetadata Checkbox**: Should checkbox selection be removed in favor of block selection?
   - **Recommendation**: Keep checkbox for multi-select scenarios, but add block selection as well

4. **ENTER Key Behavior**: Should all blocks support ENTER to insert paragraph below?
   - **Recommendation**: Yes, improves keyboard navigation significantly

5. **Focus Management**: Should blocks set focus on selection?
   - **Recommendation**: Depends on block type - interactive blocks should NOT auto-focus to avoid breaking internal navigation

## Success Criteria

- ✅ All block components use `useLexicalNodeSelection`
- ✅ All block components handle DELETE/BACKSPACE/ESCAPE consistently
- ✅ All block components show consistent visual selection indicator
- ✅ Outlines properly encompass content without excessive empty space
- ✅ Keyboard navigation works smoothly between all block types
- ✅ No regression in existing functionality
- ✅ Automated tests pass for all block interactions

## Estimated Timeline

- **Phase 1** (Outline Standardization): 2-3 hours
- **Phase 2** (FileMetadata fixes): 2-4 hours
- **Phase 3** (Missing features): 1-2 hours
- **Phase 4** (ExcalidrawNode - optional): TBD
- **Testing**: 2-3 hours

**Total**: 7-12 hours of development + testing

## References

- [Lexical Selection Documentation](https://lexical.dev/docs/concepts/selection)
- [useLexicalNodeSelection Hook](https://github.com/facebook/lexical/tree/main/packages/lexical-react/src/useLexicalNodeSelection.ts)
- [Editor3 README](src/components/Editor3/README.md)
- [Material-UI Accessibility Guide](https://mui.com/material-ui/guides/accessibility/)
