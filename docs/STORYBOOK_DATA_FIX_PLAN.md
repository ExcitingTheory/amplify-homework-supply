# Storybook Story Data Fix Plan

## Problem Summary

**Root Cause**: Stories that use custom data seeding (via `seedMock*` functions in decorators or loaders) are getting polluted with default mock data from `.storybook/preview.jsx`.

**Execution Order**:
1. `.storybook/preview.jsx` loader runs → calls `initializeMockData()` → seeds default data
2. Story-specific loaders run → seed custom data
3. Story decorators run → seed custom data
4. Component renders → sees **MIXED default + custom data**

**Solution**: Add `parameters: { initializeMockData: false }` to stories that provide their own mock data.

---

## Stories Already Fixed ✅

### ChatSidebar.stories.jsx
- **Status**: Fixed (13 stories)
- **Stories**: TranslationHelper, ContentCreation, WithFileAttachments, QuizGenerator, AnswerBlockGenerator, MeaningAssociationGenerator, CustomAnswerGenerator, GrammarExplainer, ConversationHistory, ToolCallSearch, ToolCallCreateUnit, ToolCallGenerateContent, ToolCallMultiStep
- **Fix Applied**: Added `parameters: { initializeMockData: false }` to each story

### Editor.stories.jsx
- **Status**: Fixed (9 stories)
- **Stories**: CreateNewUnit, LoadExistingUnit, WithFiles, WithCompleteContent, ReadOnlyMode, EmptyEditor, MobileView, FullscreenMode, WithTimer
- **Fix Applied**: Already has `initializeMockData: false` on stories that use `seedMockUnit`

### Workbook.stories.jsx
- **Status**: Fixed (5 stories)
- **Stories**: MinimalAnswer, MinimalQuiz, CompleteQuizInteraction, WithComplexContent, TimedAssignment
- **Fix Applied**: Already has `initializeMockData: false` on stories that use `seedMockUnit`, `seedMockGrade`, `seedMockWords`

---

## Stories That Need Fixes ❌

### Priority 1: Component Stories with Loaders

#### 1. QuestionsReview2.stories.tsx
- **Location**: `src/components/QuestionsReview2.stories.tsx`
- **Issue**: Uses `createQuestionLoader()` which calls `seedMockDocuments()` and `seedMockParsedContent()`
- **Stories Affected**: 2 stories (BasicQuestionReview, WithLargeQuestionSet or similar)
- **Fix**: Add to meta-level `parameters`:
  ```typescript
  const meta: Meta<typeof QuestionsReview2> = {
    // ... existing config
    parameters: {
      layout: 'padded',
      initializeMockData: false, // ← ADD THIS
      // ... rest of parameters
    },
  };
  ```

#### 2. VocabularyReview2.stories.tsx
- **Location**: `src/components/VocabularyReview2.stories.tsx`
- **Issue**: Uses `createVocabularyLoader()` which calls `seedMockDocuments()` and `seedMockParsedContent()`
- **Stories Affected**: 2 stories (BasicVocabularyReview, WithLargeVocabularySet or similar)
- **Fix**: Add to meta-level `parameters`:
  ```typescript
  const meta: Meta<typeof VocabularyReview2> = {
    // ... existing config
    parameters: {
      layout: 'padded',
      initializeMockData: false, // ← ADD THIS
      // ... rest of parameters
    },
  };
  ```

#### 3. FileManager2.stories.jsx
- **Location**: `src/components/Editor3/components/FileManager2.stories.jsx`
- **Issue**: Uses `seedMockData` loader which calls `seedMockFiles()`, `seedMockDocuments()`, `seedMockParsedContent()`
- **Stories Affected**: 3 stories (WithMultipleFiles, WithPDFFiles, WithMediaFiles)
- **Fix**: Add to each story that uses `loaders: [seedMockData]`:
  ```javascript
  export const WithMultipleFiles = {
    loaders: [seedMockData],
    parameters: {
      initializeMockData: false, // ← ADD THIS
    },
    // ... rest of story
  };
  ```

### Priority 2: Component Stories with Decorators

#### 4. RecordingStudio2.stories.jsx
- **Location**: `src/components/RecordingStudio2.stories.jsx`
- **Issue**: `WithRecordedAnswer` story uses decorator that calls `seedMockFiles()`
- **Stories Affected**: 1 story (WithRecordedAnswer)
- **Fix**: Add to story:
  ```javascript
  export const WithRecordedAnswer = {
    args: { /* ... */ },
    decorators: [ /* ... existing decorator ... */ ],
    parameters: {
      initializeMockData: false, // ← ADD THIS
    },
  };
  ```

### Priority 3: Editor Plugin Stories (24 files)

All plugin stories use `seedMockUnit()` in their template components (called during render). While this might work without conflicts if default data doesn't include Units, it's safer to disable default data loading for consistency.

**Pattern**: Each plugin story file renders a template component that calls `seedMockUnit()` with story-specific data.

**Files to Fix**:
1. `src/components/Editor3/plugins/AnswerPlugin.stories.jsx` (2 stories)
2. `src/components/Editor3/plugins/AnswerPlugin.audio-drawing.stories.jsx` (1 story)
3. `src/components/Editor3/plugins/AutocompletePlugin.stories.jsx` (1 story)
4. `src/components/Editor3/plugins/AutoEmbedPlugin.stories.jsx` (1 story)
5. `src/components/Editor3/plugins/BlockSuggestionPlugin.stories.jsx` (1 story)
6. `src/components/Editor3/plugins/BlockSuggestionPluginAI.stories.jsx` (1 story)
7. `src/components/Editor3/plugins/ColorPicker.stories.jsx` (2 stories)
8. `src/components/Editor3/plugins/CustomAnswerPlugin.stories.jsx` (2 stories)
9. `src/components/Editor3/plugins/CustomAnswerPlugin.audio-drawing.stories.jsx` (2 stories)
10. `src/components/Editor3/plugins/DragDropPastePlugin.stories.jsx` (1 story)
11. `src/components/Editor3/plugins/DraggableBlockPlugin.stories.jsx` (1 story)
12. `src/components/Editor3/plugins/FloatingLinkEditorPlugin.stories.jsx` (1 story)
13. `src/components/Editor3/plugins/ImagesPlugin.stories.jsx` (2 stories)
14. `src/components/Editor3/plugins/LayoutPlugin.stories.jsx` (2 stories)
15. `src/components/Editor3/plugins/LinkPlugin.stories.jsx` (2 stories)
16. `src/components/Editor3/plugins/MeaningAssociationPlugin.stories.jsx` (2 stories)
17. `src/components/Editor3/plugins/PlaylistPlugin.stories.jsx` (2 stories)
18. `src/components/Editor3/plugins/QuizPlugin.stories.jsx` (2 stories)
19. `src/components/Editor3/plugins/TablePlugin.stories.jsx` (2 stories)
20. `src/components/Editor3/plugins/UnitCompletedPlugin.stories.jsx` (1 story)
21. `src/components/Editor3/plugins/WordBlockPlugin.stories.jsx` (2 stories)
22. `src/components/Editor3/plugins/YouTubePlugin.stories.jsx` (2 stories)
23. `src/components/Editor3/plugins/AIContentCompletionPlugin.stories.jsx` (1 story)
24. `src/components/Editor3/components/EditorComponents.stories.jsx` (multiple stories)

**Fix for Plugin Stories**: Add to meta-level parameters (affects all stories in file):
```javascript
export default {
  title: '🔌 Editor Plugins/...',
  component: PluginComponent,
  parameters: {
    layout: 'fullscreen',
    initializeMockData: false, // ← ADD THIS
  },
};
```

---

## Implementation Strategy

### Phase 1: Quick Wins (Priority 1 & 2)
1. Fix QuestionsReview2.stories.tsx (meta-level)
2. Fix VocabularyReview2.stories.tsx (meta-level)
3. Fix FileManager2.stories.jsx (3 stories)
4. Fix RecordingStudio2.stories.jsx (1 story)

**Estimated Impact**: 7 story fixes, prevents data pollution in component stories

### Phase 2: Systematic Plugin Fixes (Priority 3)
1. Add `initializeMockData: false` to all 24 plugin story files at meta level
2. This ensures plugins only see their custom unit data

**Estimated Impact**: ~40+ story fixes, ensures clean plugin testing environment

### Phase 3: Verification
1. Run `npm run test:storybook` to verify all stories render correctly
2. Check that no stories are showing unexpected/duplicate data
3. Verify ChatSidebar stories still show unique messages (regression test)

---

## Testing Checklist

After applying fixes, verify:

- [ ] QuestionsReview2 stories show only custom parsed content
- [ ] VocabularyReview2 stories show only custom vocabulary
- [ ] FileManager2 stories show only custom files/documents
- [ ] RecordingStudio2 WithRecordedAnswer shows only custom file
- [ ] Plugin stories render without console errors about duplicate IDs
- [ ] ChatSidebar stories still show unique messages (no regression)
- [ ] Editor/Workbook stories still work correctly (no regression)
- [ ] Test suite passes with no new failures

---

## Why This Matters

### Without Fix:
- Stories get polluted with default data from `.storybook/__mocks__/ui-data/`
- ChatSidebar stories all showed same default chat messages
- Plugin stories might get duplicate units or unexpected data
- Component stories show mixed data making testing unreliable

### With Fix:
- Each story shows ONLY the data it explicitly seeds
- Stories are isolated and predictable
- Testing is reliable and focused
- Storybook accurately represents component behavior

---

## Reference: Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Story Execution Order                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. preview.jsx loader runs                                │
│     ├─ checks parameters.initializeMockData                │
│     ├─ if NOT false: initializeMockData() → default data  │
│     └─ if false: skip                                      │
│                                                             │
│  2. Story-specific loaders run                             │
│     └─ seedMock*() → custom data added                     │
│                                                             │
│  3. Story decorators run                                   │
│     └─ seedMock*() → custom data added                     │
│                                                             │
│  4. Component renders                                      │
│     └─ observeQuery() returns ALL data from steps 1-3     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Solution: Set parameters.initializeMockData = false to skip step 1!
```

---

## Files Reference

**Already Fixed**:
- `src/components/ChatSidebar.stories.jsx` ✅
- `src/components/Editor3/Editor.stories.jsx` ✅
- `src/components/Editor3/Workbook.stories.jsx` ✅

**Need Fixes**:
- `src/components/QuestionsReview2.stories.tsx` ❌
- `src/components/VocabularyReview2.stories.tsx` ❌
- `src/components/Editor3/components/FileManager2.stories.jsx` ❌
- `src/components/RecordingStudio2.stories.jsx` ❌
- 24 plugin story files in `src/components/Editor3/plugins/` ❌
- `src/components/Editor3/components/EditorComponents.stories.jsx` ❌

---

**Total Stories to Fix**: ~50+ stories across 29 files
**Estimated Time**: 30-45 minutes
**Risk Level**: Low (adding parameter doesn't break existing stories)
