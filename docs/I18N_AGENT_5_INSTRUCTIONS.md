# Agent 5 Instructions: Miscellaneous Components

**Agent ID**: Agent 5  
**Assignment**: Components namespace - Remaining miscellaneous components  
**Branch**: `i18n/components-misc`  
**Estimated Time**: 2 hours  
**Priority**: MEDIUM-LOW (various UI components)

## Your Mission

Implement i18n translation tags in 18 miscellaneous component files using the `components` namespace.

## Setup

```bash
# Create your branch
cd /path/to/amplify-homework-supply
git checkout -b i18n/components-misc

# Verify namespace
cat public/locales/en/components.json | grep -A 3 "mainToolbar\|questionBlock"
```

## Files to Complete (alphabetically)

### File 1: src/components/MainToolbar.js (8 strings)

**Strings**:
- Menu attributes
- "New Unit"
- "Save"
- Dialog titles

**Implementation**:
```javascript
import { useTranslation } from 'react-i18next';

export default function MainToolbar(props) {
    const { t } = useTranslation('components');
    
    // Replace strings:
    <Button>{t('mainToolbar.newUnit')}</Button>
    <Button>{t('mainToolbar.save')}</Button>
}
```

**Commit**:
```bash
git add src/components/MainToolbar.js
git commit -m "i18n: Add translations to MainToolbar.js (8 strings)"
```

### File 2: src/components/MeaningAssociationExercise/* (4 strings)

**Multiple files in this directory**

**Strings**:
- **SKIP**: Layout direction attributes ("row") - CSS values, not translatable

**Implementation**:
```javascript
// Check if these are actual UI strings or just CSS
// If CSS attributes, skip them
// If user-facing labels, use:
const { t } = useTranslation('components');
// t('meaningAssociationExercise.layoutDirection')
```

**Commit**:
```bash
git add src/components/MeaningAssociationExercise/
git commit -m "i18n: Review MeaningAssociationExercise CSS attributes (4 strings)"
```

### File 3: src/components/ModerationBadge.js (3 strings)

**Strings**:
- "Content flagged for moderation"
- "Category"

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('moderationBadge.warning')
// t('moderationBadge.category')
```

**Commit**:
```bash
git add src/components/ModerationBadge.js
git commit -m "i18n: Add translations to ModerationBadge.js (3 strings)"
```

### File 4: src/components/ModerationPanel.js (6 strings)

**Strings**:
- Panel title
- Category descriptions
- Warning messages

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('moderationPanel.title')
// t('moderationPanel.categoryDescription')
// t('moderationPanel.warning')
```

**Commit**:
```bash
git add src/components/ModerationPanel.js
git commit -m "i18n: Add translations to ModerationPanel.js (6 strings)"
```

### File 5: src/components/QuestionBlock.js (5 strings)

**Strings**:
- "Submit" button
- "Grade: {{score}}%"
- "Status"

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('questionBlock.submit')
// t('questionBlock.gradeDisplay', { score: gradeValue })
// t('questionBlock.status')
```

**Commit**:
```bash
git add src/components/QuestionBlock.js
git commit -m "i18n: Add translations to QuestionBlock.js (5 strings)"
```

### File 6: src/components/QuestionEditor2.js (2 strings)

**Strings**:
- Dialog title
- "Cancel" / "Save" buttons

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('questionEditor.dialogTitle')
// t('questionEditor.cancel')
// t('questionEditor.save')
```

**Commit**:
```bash
git add src/components/QuestionEditor2.js
git commit -m "i18n: Add translations to QuestionEditor2.js (2 strings)"
```

### File 7: src/components/QuestionsReview2.tsx (17 strings)

**Strings**:
- "Questions Review" heading
- Alert messages
- "Filter by" label
- "Cancel" / "Submit" buttons

**Implementation**:
```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('components');
// t('questionsReview.sectionHeading')
// t('questionsReview.alertMessage')
// t('questionsReview.filterBy')
// t('questionsReview.cancel')
// t('questionsReview.submit')
```

**Commit**:
```bash
git add src/components/QuestionsReview2.tsx
git commit -m "i18n: Add translations to QuestionsReview2.tsx (17 strings)"
```

### File 8: src/components/RecordingStudio2.js (3 strings)

**Strings**:
- "Recording Studio" heading
- "Preview" label

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('recordingStudio.sectionHeading')
// t('recordingStudio.preview')
```

**Commit**:
```bash
git add src/components/RecordingStudio2.js
git commit -m "i18n: Add translations to RecordingStudio2.js (3 strings)"
```

### File 9: src/components/RecordingStudio3.jsx (16 strings)

**Strings**:
- "Record", "Stop", "Play", "Save" buttons
- "Timeline" label
- Section heading

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('recordingStudio3.record')
// t('recordingStudio3.stop')
// t('recordingStudio3.play')
// t('recordingStudio3.save')
// t('recordingStudio3.timeline')
// t('recordingStudio3.sectionHeading')
```

**Commit**:
```bash
git add src/components/RecordingStudio3.jsx
git commit -m "i18n: Add translations to RecordingStudio3.jsx (16 strings)"
```

### File 10: src/components/RecordingStudio3/ScreenplayEditor.js (2 strings)

**Strings**:
- "Format" label
- "Start writing..." placeholder

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('screenplayEditor.formatLabel')
// t('screenplayEditor.placeholder')
```

**Commit**:
```bash
git add src/components/RecordingStudio3/ScreenplayEditor.js
git commit -m "i18n: Add translations to ScreenplayEditor.js (2 strings)"
```

### File 11: src/components/RecordingStudioEnhanced.js (10 strings)

**Strings**:
- "Filter" label
- "Record" button
- "Click record to start" instructions
- "Input" label

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('recordingStudioEnhanced.filterLabel')
// t('recordingStudioEnhanced.record')
// t('recordingStudioEnhanced.instructions')
// t('recordingStudioEnhanced.inputLabel')
```

**Commit**:
```bash
git add src/components/RecordingStudioEnhanced.js
git commit -m "i18n: Add translations to RecordingStudioEnhanced.js (10 strings)"
```

### File 12: src/components/SavedPdfThumbnail.tsx (2 strings)

**Strings**:
- "Error loading PDF"
- "Page {{number}}" overlay

**Implementation**:
```typescript
const { t } = useTranslation('components');
// t('savedPdfThumbnail.errorMessage')
// t('savedPdfThumbnail.pageOverlay', { number: pageNum })
```

**Commit**:
```bash
git add src/components/SavedPdfThumbnail.tsx
git commit -m "i18n: Add translations to SavedPdfThumbnail.tsx (2 strings)"
```

### File 13: src/components/SectionAssigner.js (6 strings)

**Strings**:
- "Assign to Section" dialog title
- "Select Section" label
- "Cancel" / "Assign" buttons

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('sectionAssigner.dialogTitle')
// t('sectionAssigner.selectSection')
// t('sectionAssigner.cancel')
// t('sectionAssigner.assign')
```

**Commit**:
```bash
git add src/components/SectionAssigner.js
git commit -m "i18n: Add translations to SectionAssigner.js (6 strings)"
```

### File 14: src/components/SvgPreview.js (2 strings)

**Strings**:
- "No SVG to preview" empty state
- "Caption" text

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('svgPreview.emptyState')
// t('svgPreview.caption')
```

**Commit**:
```bash
git add src/components/SvgPreview.js
git commit -m "i18n: Add translations to SvgPreview.js (2 strings)"
```

### File 15: src/components/VocabularyReview2.tsx (17 strings)

**Strings**:
- "Vocabulary Review" heading
- Alert messages
- "Summary"
- "Cancel" / "Continue" buttons

**Implementation**:
```typescript
const { t } = useTranslation('components');
// t('vocabularyReview.sectionHeading')
// t('vocabularyReview.alertMessage')
// t('vocabularyReview.summary')
// t('vocabularyReview.cancel')
// t('vocabularyReview.continue')
```

**Commit**:
```bash
git add src/components/VocabularyReview2.tsx
git commit -m "i18n: Add translations to VocabularyReview2.tsx (17 strings)"
```

### File 16: src/components/authenticator.js (1 string)

**String**:
- Username attribute

**SKIP if technical**: This might be an AWS Cognito attribute name, not user-facing text.

**Implementation**:
```javascript
// If user-facing label:
const { t } = useTranslation('components');
// t('authenticator.usernameAttribute')

// If technical attribute, skip
```

**Commit**:
```bash
git add src/components/authenticator.js
git commit -m "i18n: Review authenticator.js attribute (1 string - may be technical)"
```

### File 17: src/components/embeddings/UnitEmbeddingComponents.js (4 strings)

**Strings**:
- "Generate Embeddings" button
- "Embeddings generated" success
- "Error generating embeddings" error

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('unitEmbeddingComponents.generateButton')
// t('unitEmbeddingComponents.successMessage')
// t('unitEmbeddingComponents.errorMessage')
```

**Commit**:
```bash
git add src/components/embeddings/UnitEmbeddingComponents.js
git commit -m "i18n: Add translations to UnitEmbeddingComponents.js (4 strings)"
```

### File 18: src/components/embeddings/WordEmbeddingIntegration.js (4 strings)

**Strings**:
- Alert messages
- Success confirmations

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('wordEmbeddingIntegration.alertMessage')
// t('wordEmbeddingIntegration.successConfirmation')
```

**Commit**:
```bash
git add src/components/embeddings/WordEmbeddingIntegration.js
git commit -m "i18n: Add translations to WordEmbeddingIntegration.js (4 strings)"
```

## Quality Checklist

- [ ] All files have `useTranslation('components')`
- [ ] Skipped CSS/technical attributes
- [ ] Keys exist in `components.json`
- [ ] Reviewed technical vs UI strings
- [ ] Descriptive commits
- [ ] Status document updated

## Update Status Document

After each file:
```markdown
| src/components/MainToolbar.js | 8 | ✅ Complete - Agent 5 |
```

## Final Steps

```bash
git log --oneline
git push origin i18n/components-misc
# Update status: Agent 5 finished (18 files, ~85 strings)
```

## Reference

- **Namespace**: `public/locales/en/components.json`
- **Audit**: `I18N_TRANSLATION_TODOS.md` lines 407-486
- **Custom instruction**: Check ONBOARDING docs for component context

## Notes on Technical Strings

Some strings in these files may be:
- AWS Cognito attributes (authenticator.js)
- CSS layout values (MeaningAssociationExercise)
- API field names (embeddings components)

Use judgment to skip purely technical strings that aren't displayed to users.

## Success Criteria

✅ 18 component files translated  
✅ Technical strings identified and skipped appropriately  
✅ Clean git history  
✅ Status document updated
