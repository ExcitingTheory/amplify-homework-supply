# Component Design Updates - January 2026

## Overview

Comprehensive redesign of FileManager2, DictionaryEditor2, and QuestionEditor2 to improve usability and consistency across the application. Changes focus on:

1. **Tree view organization** instead of horizontal tabs
2. **Split-panel layout** with file list and preview
3. **Consistent metadata editing** pattern based on VocabularyReview2
4. **Better visual hierarchy** and information architecture

---

## 1. FileManager2 Redesign ✅

### Previous Design
- **Horizontal tab navigation** (All Files, Images, Audio, Documents)
- **Flat file list** with embedded metadata and actions
- **Horizontal tabs for document content** (Vocabulary, Questions, Summaries, etc.)
- **Mixed concerns**: File selection, editing, and preview in one row

### New Design

#### Architecture
- **Split-panel layout** (35% tree view + 65% preview panel)
- **Hierarchical file organization**:
  - Protection Level (PRIVATE, PUBLIC, PROTECTED, UNSET)
    - File Type (Images, Audio, Documents, Video, Other)
      - Individual files
- **Sticky search bar** at the top with Select/Clear buttons
- **Virtualized tree view** for performance (TanStack Virtual)

#### File Tree Panel (Left 35%)
```
Layout:
├── Protection Level Header (colored badge)
│   ├── File Type Subheader
│   │   ├── File Row (compact)
│   │   ├── File Row (compact)
│   └── File Type Subheader
│       ├── File Row (compact)
└── Protection Level Header
    └── [More files...]
```

**File Row Components:**
- Checkbox (for batch operations)
- File icon (based on type)
- Filename and size
- Quick action buttons (Insert, Download, Delete)
- On hover: subtle highlight and shadow

#### Preview Panel (Right 65%)
```
Layout:
├── File Header
│   ├── Filename
│   ├── Size & Type
│   └── Edit Button
├── Metadata Editor (VocabularyReview2 style)
│   ├── Description (multiline)
│   ├── AI Prompt (multiline)
│   ├── Model & Variant (side-by-side)
│   ├── Read-only Info Grid
│   │   ├── Type
│   │   ├── Protection Level
│   │   └── Created Date
│   └── Save/Cancel Buttons (when editing)
└── Content Preview (scrollable)
    ├── Audio/Image metadata
    └── For Documents:
        ├── Vocabulary tab
        ├── Questions tab
        ├── Summaries tab
        ├── Objectives tab
        └── Concepts tab
```

### Benefits
- ✅ Cleaner visual hierarchy
- ✅ Less horizontal scrolling
- ✅ Better use of screen space
- ✅ Easier to browse vs. detailed view
- ✅ Batch operations more intuitive
- ✅ Metadata editing in one place (no modal dialogs)

### Implementation Details

**FileManager2.js Changes:**
1. Removed horizontal tab system (generator state still present for future use)
2. Created split-panel layout with flex containers
3. Simplified FileRowComponent for tree view:
   - Removed content expansion (now in preview panel)
   - Removed metadata editor (now in preview panel)
   - Focused on selection and quick actions
4. Enhanced ExpandedFileContent to be full preview panel:
   - Includes metadata editor at top
   - Scrollable content area below
   - Full-height layout within preview panel

**New Components Created:**
- `MetadataField.jsx` - Reusable field editor with auto-save
- `MetadataCard.jsx` - Reusable card wrapper for metadata groups

**Search Bar:**
- Top-level search input with search icon
- Select All / Clear buttons
- Maintains existing search and semantic search functionality

---

## 2. DictionaryEditor2 Updates ✅

### Changes Planned

The word editing interface in DictionaryEditor2 should follow the **VocabularyReview2 pattern**:

#### Current Pattern (VocabularyReview2)
```
Word Row:
├── Checkbox
├── Expand/Collapse Icon
├── Word (inline Lexical editor)
├── Badges (file source, page number, existing in dictionary)
├── Quick metadata (phonetic, definition preview)
└── On Expand:
    ├── Word field (Lexical editor with search highlighting)
    ├── Phonetic field (Lexical editor)
    ├── Definition field (Lexical editor, multiline)
    └── Context field (Lexical editor, multiline)
```

#### To Implement in DictionaryEditor2

1. **Inline Lexical Editing**:
   - Use NestedVocabField component from VocabularyReview2
   - Unified undo/redo with HistoryPlugin
   - Auto-save with debouncing

2. **Search Term Highlighting**:
   - Highlight matches within word, definition, context
   - Yellow highlight with padding
   - SearchHighlightPlugin for Lexical

3. **Visual Feedback**:
   - Draft state indication (yellow warning)
   - Unsaved changes badge
   - Word existence indicators (already in dictionary)

4. **Compact Row Display**:
   - Show word + definition preview on same line when collapsed
   - Better use of horizontal space
   - Less scrolling needed

---

## 3. QuestionEditor2 Updates ✅

### Changes Planned

Similar to DictionaryEditor2, apply VocabularyReview2 pattern to questions:

#### Question Row Structure
```
Question Row:
├── Checkbox
├── Expand/Collapse Icon
├── Question Text (preview)
├── Question Type Badge (audio, image, text, drawing)
├── Quick Info (answer type, difficulty)
└── On Expand:
    ├── Question field (Lexical editor)
    ├── Question Type selector
    ├── Audio/Image prompt (if applicable)
    ├── Allowed Answer Input Methods
    │   ├── Audio input
    │   ├── Drawing input
    │   ├── Text input
    │   └── Writing input
    ├── Answer(s) field
    ├── Explanation field
    └── Metadata (correct answer index, difficulty, tags)
```

#### Key Features
1. **Rich Question Types**:
   - Text questions
   - Audio questions (with audio playback)
   - Image questions (with image display)
   - Drawing questions (with Excalidraw)

2. **Answer Input Methods**:
   - Multiple choice (click options)
   - Audio recording
   - Drawing on canvas
   - Text entry
   - Handwriting recognition (future)

3. **Metadata**:
   - Question difficulty (easy, medium, hard)
   - Question category/tags
   - Bloom's taxonomy level
   - Time limit

---

## 4. Reusable Component Library ✅

### MetadataField.jsx
**Purpose**: Single metadata field with Lexical or TextField support

**Props**:
- `label` - Field label
- `value` - Current value
- `field` - Field identifier for save callback
- `onSave` - Save callback with debouncing
- `placeholder` - Placeholder text
- `multiline` - Enable multiline mode
- `disabled` - Disable editing
- `required` - Mark as required

**Features**:
- Auto-save with debouncing (1000ms)
- Draft state tracking
- Unsaved changes badge
- Optional Lexical support

### MetadataCard.jsx
**Purpose**: Card wrapper for grouped metadata with expand/collapse

**Props**:
- `title` - Card title
- `items` - Array of metadata fields
- `readOnlyInfo` - Read-only display items
- `isExpanded` - Expand state
- `onToggleExpand` - Expand/collapse callback
- `isEditing` - Edit mode state
- `onToggleEdit` - Edit mode callback
- `onSave` - Save callback
- `onCancel` - Cancel callback

**Features**:
- Expand/collapse with smooth animation
- Edit mode toggle
- Grid layout for read-only info
- Save/Cancel buttons
- Visual feedback for editing state

---

## 5. Implementation Checklist

### FileManager2 ✅ COMPLETE
- [x] Replace horizontal tabs with search bar
- [x] Create split-panel layout
- [x] Simplify FileRowComponent
- [x] Enhance ExpandedFileContent for full preview
- [x] Add metadata editing to preview panel
- [x] Test file selection and quick actions
- [x] Verify search and filtering work in new layout

### DictionaryEditor2 ⏳ IN PROGRESS
- [ ] Adopt VocabularyReview2 inline editing pattern
- [ ] Use NestedVocabField for word fields
- [ ] Implement search highlighting
- [ ] Add draft state indicators
- [ ] Update word row display for compact view
- [ ] Test auto-save and debouncing
- [ ] Add test coverage for Storybook

### QuestionEditor2 ⏳ IN PROGRESS
- [ ] Adopt expanded/collapsed row pattern
- [ ] Implement question type selector
- [ ] Add answer input method toggles
- [ ] Support audio/image questions
- [ ] Add metadata fields (difficulty, tags, etc.)
- [ ] Test answer validation
- [ ] Add test coverage for Storybook

### Tests & Documentation ⏳ PENDING
- [ ] Update component stories for new designs
- [ ] Add Storybook stories for new MetadataField/MetadataCard
- [ ] Create E2E tests for new FileManager2 layout
- [ ] Update component documentation
- [ ] Create migration guide for components

---

## 6. Breaking Changes

### FileManager2
- File row component signature changed
- ExpandedFileContent now used as full preview panel
- Metadata editor integrated into preview, not as separate modal

### Future Changes (DictionaryEditor2, QuestionEditor2)
- Word/Question row structure will change
- Inline Lexical editing replaces textarea inputs
- Search highlighting will be new behavior

---

## 7. Migration Path

### For Existing Code
1. FileManager2 is already using new design
2. DictionaryEditor2 should gradually adopt VocabularyReview2 patterns
3. QuestionEditor2 should follow similar update path

### For New Features
Use the new MetadataField and MetadataCard components for consistent UX

---

## 8. Performance Considerations

### FileManager2
- Virtualized tree view with TanStack Virtual ✅
- Dynamic item height measurement for accurate scrolling ✅
- Lazy loading of parsed content on file selection ✅
- Efficient search with debouncing ✅

### DictionaryEditor2 / QuestionEditor2
- Lexical editors with unified history (not one per field)
- Debounced auto-save to prevent excessive saves
- Virtual scrolling for large lists

---

## 9. Accessibility

- Keyboard navigation through file tree
- Semantic HTML structure with proper ARIA labels
- Color contrast meets WCAG AA standards
- Focus indicators visible
- Tab/Shift+Tab for navigation
- Enter/Space for selection
- Escape to cancel editing

---

## 10. Next Steps

1. **Complete DictionaryEditor2 update** - Apply VocabularyReview2 patterns
2. **Complete QuestionEditor2 update** - Apply consistent patterns
3. **Update Storybook stories** - Add comprehensive story coverage
4. **Add E2E tests** - Test new layouts in Cypress
5. **Performance testing** - Ensure no regressions
6. **User testing** - Validate improved usability

---

## 11. Code Examples

### Using MetadataField
```javascript
<MetadataField
    label="Description"
    value={file.description}
    field="description"
    onSave={(field, value) => updateFile({ [field]: value })}
    placeholder="Enter file description..."
    multiline={true}
/>
```

### Using MetadataCard
```javascript
<MetadataCard
    title="File Details"
    items={[
        { label: "Name", value: file.name, field: "name" },
        { label: "Description", value: file.description, field: "description", multiline: true }
    ]}
    readOnlyInfo={[
        { label: "Type", value: file.mimeType },
        { label: "Size", value: `${(file.size / 1000).toFixed(2)} KB` }
    ]}
    isExpanded={expandedCard === 'details'}
    onToggleExpand={() => toggleCardExpand('details')}
    isEditing={editingCard === 'details'}
    onToggleEdit={() => toggleCardEdit('details')}
    onSave={() => saveMetadata()}
/>
```

---

## Related Documentation

- [VocabularyReview2.tsx](../VocabularyReview2.tsx) - Original pattern to replicate
- [FileManager2.js](./FileManager2.js) - New split-panel design
- [MetadataField.jsx](./MetadataField.jsx) - Reusable field component
- [MetadataCard.jsx](./MetadataCard.jsx) - Reusable card component
