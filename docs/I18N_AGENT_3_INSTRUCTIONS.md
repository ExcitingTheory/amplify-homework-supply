# Agent 3 Instructions: Editor3 Core Components

**Agent ID**: Agent 3  
**Assignment**: Components namespace - Editor3 core components  
**Branch**: `i18n/components-editor3-core`  
**Estimated Time**: 3-4 hours  
**Priority**: MEDIUM (content authoring tools)

## Your Mission

Implement i18n translation tags in 20 Editor3 core component files using the `components` namespace.

## Setup

```bash
# 1. Create your branch
cd /path/to/amplify-homework-supply
git checkout -b i18n/components-editor3-core

# 2. Verify namespace file exists
cat public/locales/en/components.json | grep -A 5 "answerComponent\|fileManager"
```

## Files to Complete (in order)

### File 1: src/components/Editor3/components/AnswerComponent.js (18 strings)

**Strings**:
- Input method toggles: "Text", "Audio", "Writing"
- Error messages: "Please provide an answer", "Recording failed"
- Feedback: "Correct!", "Try again"
- **SKIP**: Border style strings (CSS values)

**Implementation**:
```javascript
import { useTranslation } from 'next-i18next';

export default function AnswerComponent(props) {
    const { t } = useTranslation('components');
    
    // Input methods
    <Button>{t('answerComponent.inputMethods.text')}</Button>
    <Button>{t('answerComponent.inputMethods.audio')}</Button>
    <Button>{t('answerComponent.inputMethods.writing')}</Button>
    
    // Error messages
    {error && <Alert>{t('answerComponent.errorMessages.noAnswer')}</Alert>}
    
    // Feedback
    {correct && <Typography>{t('answerComponent.feedback.correct')}</Typography>}
}
```

**Commit**:
```bash
git add src/components/Editor3/components/AnswerComponent.js
git commit -m "i18n: Add translations to AnswerComponent.js (18 strings)"
```

### File 2: src/components/Editor3/components/AnswerEditor.js (6 strings)

**Strings**:
- "Create your answer below"
- "Edit Answer" dialog title
- "Cancel" / "Save" buttons
- "No answer provided" empty state

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('answerEditor.instructions')
// t('answerEditor.dialogTitle')
// t('answerEditor.cancel')
// t('answerEditor.save')
// t('answerEditor.emptyState')
```

**Commit**:
```bash
git add src/components/Editor3/components/AnswerEditor.js
git commit -m "i18n: Add translations to AnswerEditor.js (6 strings)"
```

### File 3: src/components/Editor3/components/AssignmentConfiguration.js (13 strings)

**Strings**:
- "Timer" label
- "Due Date" label
- "Section" label
- "Cancel" / "Save" buttons
- Timer configuration UI text

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('assignmentConfiguration.timerLabel')
// t('assignmentConfiguration.dueDateLabel')
// t('assignmentConfiguration.sectionLabel')
```

**Commit**:
```bash
git add src/components/Editor3/components/AssignmentConfiguration.js
git commit -m "i18n: Add translations to AssignmentConfiguration.js (13 strings)"
```

### File 4: src/components/Editor3/components/AudioWaveformPlayer.js (1 string)

**String**:
- Line 489: "No audio source provided"

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('audioWaveformPlayer.noAudioSource')
```

**Commit**:
```bash
git add src/components/Editor3/components/AudioWaveformPlayer.js
git commit -m "i18n: Add translations to AudioWaveformPlayer.js (1 string)"
```

### File 5: src/components/Editor3/components/AutocompleteNode.js (2 strings)

**Strings**:
- Mobile hint: "Tap to select"
- Desktop hint: "Press Enter to select"

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('autocompleteNode.mobileHint')
// t('autocompleteNode.desktopHint')
```

**Commit**:
```bash
git add src/components/Editor3/components/AutocompleteNode.js
git commit -m "i18n: Add translations to AutocompleteNode.js (2 strings)"
```

### File 6: src/components/Editor3/components/BlockSuggestionMenu.js (6 strings)

**Strings**:
- "Suggestions"
- "No suggestions available"
- "Type to search"
- "Cancel"

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('blockSuggestionMenu.suggestions')
// t('blockSuggestionMenu.emptyState')
// t('blockSuggestionMenu.helper')
```

**Commit**:
```bash
git add src/components/Editor3/components/BlockSuggestionMenu.js
git commit -m "i18n: Add translations to BlockSuggestionMenu.js (6 strings)"
```

### File 7: src/components/Editor3/components/ConfigurationManager.js (8 strings)

**Strings**:
- "PDF Analysis"
- "Featured Image"
- "On" / "Off" toggles

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('configurationManager.pdfAnalysis')
// t('configurationManager.featuredImage')
// t('configurationManager.toggleOn')
// t('configurationManager.toggleOff')
```

**Commit**:
```bash
git add src/components/Editor3/components/ConfigurationManager.js
git commit -m "i18n: Add translations to ConfigurationManager.js (8 strings)"
```

### File 8: src/components/Editor3/components/DocumentUploader.js (11 strings)

**Strings**:
- Upload instructions
- File type info
- "How it works" steps
- "Upload" / "Cancel" buttons

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('documentUploader.uploadInstructions')
// t('documentUploader.fileTypeInfo')
// t('documentUploader.howItWorks.step1')
// t('documentUploader.howItWorks.step2')
// t('documentUploader.howItWorks.step3')
```

**Commit**:
```bash
git add src/components/Editor3/components/DocumentUploader.js
git commit -m "i18n: Add translations to DocumentUploader.js (11 strings)"
```

### File 9: src/components/Editor3/components/EnhancedGenerators.js (4 strings)

**Strings**:
- "Generate"
- "Cancel"
- Modal title

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('enhancedGenerators.generate')
// t('enhancedGenerators.cancel')
// t('enhancedGenerators.modalTitle')
```

**Commit**:
```bash
git add src/components/Editor3/components/EnhancedGenerators.js
git commit -m "i18n: Add translations to EnhancedGenerators.js (4 strings)"
```

### File 10: src/components/Editor3/components/FileManager2.js (71+ strings) ⚠️ LARGEST FILE

**⚠️ Work incrementally - commit after every 10-15 strings**

**Strings**:
- Metadata displays
- Button labels
- Status messages
- Filter text
- "Upload", "Delete", "No files", etc.

**Implementation strategy**:
```javascript
const { t } = useTranslation('components');

// Work in sections:
// 1. First 15 strings: Metadata fields
// 2. Next 15 strings: Button labels
// 3. Next 15 strings: Status messages
// 4. Remaining strings: Filter/sort UI
```

**Commit after each section**:
```bash
git add src/components/Editor3/components/FileManager2.js
git commit -m "i18n: Add translations to FileManager2.js (metadata section, 15 strings)"
# Continue until complete
git commit -m "i18n: Complete FileManager2.js translations (71 strings total)"
```

### Files 11-20: Quick Reference

**File 11: FreeSoloCreateOptionDialog.js (4 strings)**
- Dialog title, label, buttons
- `t('freeSoloCreateOptionDialog.*')`

**File 12: ImageMaskEditor.js (5 strings)**
- Instructions, brush size, zoom info
- `t('imageMaskEditor.*')`

**File 13: ImageResizer.js (1 string)**
- "Add Caption"
- `t('imageResizer.addCaption')`

**File 14: InsertLayoutDialog.js (2 strings)**
- "Cancel" / "Insert" buttons
- `t('insertLayoutDialog.*')`

**File 15: MeaningAssociationEditor.js (6 strings)**
- Dialog title, description, buttons
- `t('meaningAssociationEditor.*')`

**File 16: MediaPlayerComponent.js (2 strings)**
- **SKIP**: Display and type attributes (technical, not user-facing)

**File 17: MetadataEditor.tsx (16 strings)**
- File info fields, generation info
- `t('metadataEditor.*')`

**File 18: MetadataField.jsx (1 string)**
- "(unsaved changes)"
- `t('metadataField.unsavedChanges')`

**File 19: PdfViewerComponent.js (2 strings)**
- "Loading PDF...", empty state
- `t('pdfViewerComponent.*')`

**File 20: PlaylistEditor.js (4 strings)**
- Menu attributes, empty state
- `t('playlistEditor.*')`

## Quality Checklist (for each file)

- [ ] Imported `useTranslation` from 'next-i18next'
- [ ] Added `const { t } = useTranslation('components');`
- [ ] All literal strings replaced
- [ ] Keys exist in `public/locales/en/components.json`
- [ ] Committed with descriptive message
- [ ] **For FileManager2.js**: Incremental commits every 10-15 strings

## Update Status Document

After each file:
```markdown
| src/components/Editor3/components/AnswerComponent.js | 18 | ✅ Complete - Agent 3 |
```

## Final Steps

```bash
git log --oneline | head -20
git push origin i18n/components-editor3-core
# Update status: Agent 3 finished (20 files, ~150 strings)
```

## Reference

- **Namespace**: `public/locales/en/components.json`
- **Audit**: `I18N_TRANSLATION_TODOS.md` lines 215-280
- **Component docs**: `docs/API.md`, `ONBOARDING_README.md`

## Success Criteria

✅ All 20 component files translated  
✅ FileManager2.js completed incrementally  
✅ Clean git history  
✅ Status updated
