# Storybook Manual Testing Checklist - Phase 1.3

**Date**: January 24, 2026  
**Storybook URL**: http://localhost:6007  
**Tester**: _______________

---

## Testing Instructions

For each story, check the following and mark status in the inventory:

### ✅ **Pass Criteria**
- Story renders without errors
- No console errors (red)
- Component displays expected content
- Interactions work (if applicable)

### ⚠️ **Warning Criteria**
- Story renders but has console warnings (yellow)
- Minor visual issues
- Props warnings
- Performance warnings

### ❌ **Fail Criteria**
- Story does not render
- Console errors present
- Component crashes
- Missing data causes blank screen

---

## Quick Testing Process

### For Each Story:

1. **Navigate** to story in Storybook sidebar
2. **Visual Check**: Does it render something?
3. **Console Check**: Open DevTools Console (Cmd+Option+J)
   - Look for red errors
   - Note yellow warnings
4. **Interaction Check** (if story has controls):
   - Click buttons
   - Type in inputs
   - Check if updates work
5. **Mark Status** in inventory document
6. **Take Notes** if there are issues

---

## Priority Testing Order

### 🔴 **High Priority** (Test these first - 30 mins)

1. **ChatSidebar** (src/components/ChatSidebar.stories.jsx)
   - [ ] GettingStarted
   - [ ] TranslationHelper
   - [ ] ContentCreation
   - [ ] WithFileAttachments
   - [ ] QuizGenerator
   - [ ] GrammarExplainer
   - [ ] ConversationHistory
   
   **Special Check**: Verify message structure in console:
   ```javascript
   // In console while viewing story:
   console.log(window.__STORYBOOK_PREVIEW__.storyStore.stories);
   // Look for message format: { id, role, content } - NOT { id, role, parts[] }
   ```

2. **Editor3** (src/components/Editor3/Editor.stories.jsx)
   - [ ] EmptyEditorTextFormatting
   - [ ] EmptyEditorCustomBlocks
   - [ ] EditorWithContent
   - [ ] KitchenSink

3. **Workbook** (src/components/Editor3/Workbook.stories.jsx)
   - [ ] EmptyWorkbook
   - [ ] WorkbookWithContent
   - [ ] WorkbookWithProgress
   - [ ] KitchenSink
   - [ ] DataPluginDemo

### 🟡 **Medium Priority** (Test next - 1-2 hours)

4. **FileManager2** (src/components/Editor3/components/FileManager2.stories.jsx)
5. **QuestionsReview2** (src/components/QuestionsReview2.stories.tsx)
6. **VocabularyReview2** (src/components/VocabularyReview2.stories.tsx)
7. **RecordingStudio3** (src/components/RecordingStudio3.stories.jsx)
8. **MetadataEditor** (src/components/Editor3/components/MetadataEditor.stories.tsx)

### 🟢 **Lower Priority** (Test when time permits - 2-3 hours)

9. All Plugin stories (30+ files)
10. Utility components
11. Example stories

---

## Common Issues to Watch For

### Mock Data Issues
- [ ] `Cannot read property 'X' of undefined`
- [ ] `TypeError: data.map is not a function` (array expected, got object)
- [ ] `undefined is not an object` (missing context provider)

### Context Provider Issues
- [ ] `useContext() returned undefined`
- [ ] `UnitContext is not provided`
- [ ] `AuthContext missing`

### Import/Path Issues
- [ ] `Module not found`
- [ ] `Failed to resolve import`
- [ ] Mock not being applied

### Data Structure Issues
- [ ] Type mismatches (string vs number)
- [ ] Missing required fields
- [ ] Nested object structure wrong
- [ ] Array vs single object confusion

---

## Testing Template (Copy for each story)

```
Story: ___________________________
File: ____________________________
Date: ____________________________

Visual Rendering:  ✅ / ⚠️ / ❌
Console Errors:    ✅ / ⚠️ / ❌
Interactions:      ✅ / ⚠️ / ❌ / N/A

Issues Found:
- 

Root Cause (if known):
- 

Screenshots/Links:
- 

Notes:
- 
```

---

## Data Collection Sheet

| Story | Status | Console Errors | Visual Issues | Notes |
|-------|--------|----------------|---------------|-------|
| ChatSidebar/GettingStarted | 🔍 | | | |
| ChatSidebar/TranslationHelper | 🔍 | | | |
| ChatSidebar/ContentCreation | 🔍 | | | |
| ... | 🔍 | | | |

---

## Key Questions to Answer

### ChatSidebar Stories
- [ ] Do messages have `content: string` or `parts: array[]`?
- [ ] Are tool invocations structured correctly?
- [ ] Does streaming work?
- [ ] Are file attachments shown?

### Editor Stories
- [ ] Does Lexical state load correctly?
- [ ] Do custom nodes render (Quiz, Answer, MeaningAssociation)?
- [ ] Can you type and see updates?
- [ ] Do plugins activate?

### Workbook Stories
- [ ] Does grade data load?
- [ ] Are block IDs in rubric?
- [ ] Does accuracy calculation work?
- [ ] Can you submit answers?

### File Manager Stories
- [ ] Do file thumbnails show?
- [ ] Are S3 URLs mocked correctly?
- [ ] Does expansion work?
- [ ] Can you select files?

---

## Browser Console Snippets

### Check message structure in ChatSidebar:
```javascript
// Get messages from current story
const messages = window.__CHAT_MESSAGES__;
console.log('Message structure:', messages[0]);
console.log('Has content field?', messages[0]?.content);
console.log('Has parts field?', messages[0]?.parts);
```

### Check context values:
```javascript
// Check if contexts are provided
console.log('UnitContext:', window.__UNIT_CONTEXT__);
console.log('AuthContext:', window.__AUTH_CONTEXT__);
```

### Export test results:
```javascript
// Copy results to clipboard
const results = {
  tested: 10,
  passed: 8,
  warnings: 1,
  failed: 1,
  issues: [/* ... */]
};
copy(JSON.stringify(results, null, 2));
```

---

## Quick Wins

### If a story is broken due to mock data:

1. **Find the component**
2. **Check what data it expects** (look at prop types)
3. **Find the mock data file** (check story imports)
4. **Compare structure** (real vs mock)
5. **Update mock** to match expected structure
6. **Retest**

### If a story is broken due to missing context:

1. **Check component's `useContext()` calls**
2. **Find required contexts**
3. **Check story file for providers**
4. **Add missing provider** to story
5. **Retest**

---

## End of Testing Session

### Summary Checklist

- [ ] How many stories tested? ______
- [ ] How many passed? ✅ ______
- [ ] How many have warnings? ⚠️ ______
- [ ] How many failed? ❌ ______
- [ ] Top 3 issues found:
  1. ___________________
  2. ___________________
  3. ___________________
- [ ] Updated STORYBOOK_INVENTORY.md with statuses?
- [ ] Created issues/notes for failed stories?
- [ ] Ready for Phase 2 (Mock Data Structure Validation)?

---

**Time Log**:
- Start: ________
- End: ________
- Total: ________ hours

**Next Steps**: After completing testing, proceed to Phase 2 in STORYBOOK_VALIDATION_PLAN.md
