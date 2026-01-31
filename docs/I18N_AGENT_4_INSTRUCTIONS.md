# Agent 4 Instructions: Editor3 Plugins & Nodes

**Agent ID**: Agent 4  
**Assignment**: Components namespace - Editor3 plugins and custom nodes  
**Branch**: `i18n/components-editor3-plugins`  
**Estimated Time**: 2-3 hours  
**Priority**: MEDIUM (editor functionality)

## Your Mission

Implement i18n translation tags in 25 Editor3 plugin and node files using the `components` namespace.

## Setup

```bash
# Create your branch
cd /path/to/amplify-homework-supply
git checkout -b i18n/components-editor3-plugins

# Verify namespace
cat public/locales/en/components.json | grep -A 3 "toolBarPlugin\|quizComponent"
```

## Files to Complete (alphabetically)

### File 1: src/components/Editor3/components/PromptMethodSelector.js (8 strings)

**Strings**:
- Menu attributes
- Button labels
- "Select Prompt"

**Implementation**:
```javascript
import { useTranslation } from 'next-i18next';

const { t } = useTranslation('components');
// t('promptMethodSelector.menuAttribute')
// t('promptMethodSelector.selectPrompt')
```

**Commit**:
```bash
git add src/components/Editor3/components/PromptMethodSelector.js
git commit -m "i18n: Add translations to PromptMethodSelector.js (8 strings)"
```

### File 2: src/components/Editor3/components/QuizComponent.js (1 string)

**String**:
- "Grade: {{score}}%"

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('quizComponent.gradeDisplay', { score: gradeValue })
```

**Commit**:
```bash
git add src/components/Editor3/components/QuizComponent.js
git commit -m "i18n: Add translations to QuizComponent.js (1 string)"
```

### File 3: src/components/Editor3/components/QuizEditor.js (4 strings)

**Strings**:
- "Save" / "Cancel" buttons
- Grade display
- Status text

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('quizEditor.save')
// t('quizEditor.cancel')
// t('quizEditor.gradeDisplay', { score })
// t('quizEditor.status')
```

**Commit**:
```bash
git add src/components/Editor3/components/QuizEditor.js
git commit -m "i18n: Add translations to QuizEditor.js (4 strings)"
```

### File 4: src/components/Editor3/components/SketchPad.js (3 strings)

**Strings**:
- "Draw your answer"
- "{{seconds}} seconds remaining"
- "Clear" / "Save" buttons

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('sketchPad.instructions')
// t('sketchPad.countdown', { seconds: remainingTime })
// t('sketchPad.clear')
// t('sketchPad.save')
```

**Commit**:
```bash
git add src/components/Editor3/components/SketchPad.js
git commit -m "i18n: Add translations to SketchPad.js (3 strings)"
```

### File 5: src/components/Editor3/components/StaticWaveform.js (1 string)

**String**:
- "Error loading waveform"

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('staticWaveform.errorLoading')
```

**Commit**:
```bash
git add src/components/Editor3/components/StaticWaveform.js
git commit -m "i18n: Add translations to StaticWaveform.js (1 string)"
```

### File 6: src/components/Editor3/components/SuggestedContent.js (4 strings)

**Strings**:
- **SKIP**: Owner/identity placeholders (test data, not user-facing)

**Implementation**:
```javascript
// These are test placeholders, likely don't need translation
// If they appear in actual UI, use:
const { t } = useTranslation('components');
// t('suggestedContent.ownerPlaceholder')
// t('suggestedContent.identityPlaceholder')
```

**Commit**:
```bash
git add src/components/Editor3/components/SuggestedContent.js
git commit -m "i18n: Review SuggestedContent.js placeholders (4 strings - test data)"
```

### File 7: src/components/Editor3/components/TableComponent.js (15 strings)

**Strings**:
- "Insert Row"
- "Insert Column"
- "Delete Row"
- "Delete Column"
- Context menu items

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('tableComponent.insertRow')
// t('tableComponent.insertColumn')
// t('tableComponent.deleteRow')
// t('tableComponent.deleteColumn')
```

**Commit**:
```bash
git add src/components/Editor3/components/TableComponent.js
git commit -m "i18n: Add translations to TableComponent.js (15 strings)"
```

### File 8: src/components/Editor3/components/TableOfContents.js (2 strings)

**Strings**:
- "No headings found"
- "Table of Contents"

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('tableOfContents.emptyState')
// t('tableOfContents.title')
```

**Commit**:
```bash
git add src/components/Editor3/components/TableOfContents.js
git commit -m "i18n: Add translations to TableOfContents.js (2 strings)"
```

### File 9: src/components/Editor3/components/TabsVerticalLeft.js (7 strings)

**Strings**:
- Tab labels
- **SKIP**: Overflow attributes (CSS, not translatable)

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('tabsVerticalLeft.overflow') - only if user-facing label
```

**Commit**:
```bash
git add src/components/Editor3/components/TabsVerticalLeft.js
git commit -m "i18n: Add translations to TabsVerticalLeft.js (7 strings)"
```

### File 10: src/components/Editor3/components/TabsVerticalRight.js (14 strings)

**Strings**:
- Instructions text
- Features list
- Tab panel content

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('tabsVerticalRight.instructions')
// t('tabsVerticalRight.features')
```

**Commit**:
```bash
git add src/components/Editor3/components/TabsVerticalRight.js
git commit -m "i18n: Add translations to TabsVerticalRight.js (14 strings)"
```

### File 11: src/components/Editor3/components/UnifiedGenerateModal.js (13 strings)

**Strings**:
- "Generating..."
- Dialog title
- "Preview"
- "Cancel" / "Generate" buttons

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('unifiedGenerateModal.loading')
// t('unifiedGenerateModal.dialogTitle')
// t('unifiedGenerateModal.preview')
// t('unifiedGenerateModal.cancel')
// t('unifiedGenerateModal.generate')
```

**Commit**:
```bash
git add src/components/Editor3/components/UnifiedGenerateModal.js
git commit -m "i18n: Add translations to UnifiedGenerateModal.js (13 strings)"
```

### File 12: src/components/Editor3/components/VerticalTabsRo.js (7 strings)

**Strings**:
- Tab labels
- Overflow attributes

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('verticalTabsRo.overflow')
```

**Commit**:
```bash
git add src/components/Editor3/components/VerticalTabsRo.js
git commit -m "i18n: Add translations to VerticalTabsRo.js (7 strings)"
```

### Files 13-14: Custom Answer Nodes

**File 13: nodes/CustomAnswerNode/CustomAnswerComponent.js (14 strings)**
- Question display
- Input toggles (Text/Audio)
- Feedback messages
- Submit button

```javascript
const { t } = useTranslation('components');
// t('customAnswerComponent.questionDisplay')
// t('customAnswerComponent.inputToggle.text')
// t('customAnswerComponent.inputToggle.audio')
// t('customAnswerComponent.feedback.correct')
// t('customAnswerComponent.submit')
```

**File 14: nodes/CustomAnswerNode/CustomAnswerEditor.js (5 strings)**
- Instructions
- Dialog title
- Buttons

```javascript
// t('customAnswerEditor.instructions')
// t('customAnswerEditor.dialogTitle')
```

**Commits**:
```bash
git add src/components/Editor3/nodes/CustomAnswerNode/CustomAnswerComponent.js
git commit -m "i18n: Add translations to CustomAnswerComponent.js (14 strings)"

git add src/components/Editor3/nodes/CustomAnswerNode/CustomAnswerEditor.js
git commit -m "i18n: Add translations to CustomAnswerEditor.js (5 strings)"
```

### File 15: nodes/FileMetadataNode/FileMetadataComponent.js (21 strings)

**Strings**:
- Metadata field labels
- Content section headers
- Empty state messages

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('fileMetadataComponent.metadata')
// t('fileMetadataComponent.content')
// t('fileMetadataComponent.emptyState')
```

**Commit**:
```bash
git add src/components/Editor3/nodes/FileMetadataNode/FileMetadataComponent.js
git commit -m "i18n: Add translations to FileMetadataComponent.js (21 strings)"
```

### Files 16-22: Plugins (Quick Reference)

**File 16: plugins/AutoEmbedPlugin.js (1 string)**
- "Embed" button
- `t('autoEmbedPlugin.embed')`

**File 17: plugins/ImagesPlugin.js (8 strings)**
- "Upload Image", "Insert from URL"
- Input attributes, buttons
- `t('imagesPlugin.*')`

**File 18: plugins/TablePlugin.js (5 strings)**
- "Insert Table", "Rows", "Columns"
- `t('tablePlugin.*')`

**File 19: plugins/ToolBarPlugin.js (26 strings)**
- Dialog titles
- Menu labels (Bold, Italic, etc.)
- Button text
- Input labels
- `t('toolBarPlugin.*')`

**File 20: plugins/ToolBarRoPlugin.js (2 strings)**
- Fallback text
- `t('toolBarRoPlugin.fallbackText')`

**File 21: plugins/UnitCompletedPlugin.js (3 strings)**
- "Unit completed!"
- Section headings
- "Continue" button
- `t('unitCompletedPlugin.*')`

**File 22: plugins/WordBlockPlugin.js (2 strings)**
- "Error loading word"
- "Audio unavailable"
- `t('wordBlockPlugin.*')`

## Quality Checklist

- [ ] All files have `useTranslation('components')`
- [ ] Skipped CSS/technical attributes
- [ ] Keys exist in `components.json`
- [ ] Descriptive commit messages
- [ ] Status document updated

## Final Steps

```bash
git log --oneline
git push origin i18n/components-editor3-plugins
# Update status: Agent 4 finished (22 files, ~120 strings)
```

## Reference

- **Namespace**: `public/locales/en/components.json`
- **Audit**: `I18N_TRANSLATION_TODOS.md` lines 290-420

## Success Criteria

✅ 22 plugin/node files translated  
✅ Test placeholders identified  
✅ Clean commits  
✅ Status updated
