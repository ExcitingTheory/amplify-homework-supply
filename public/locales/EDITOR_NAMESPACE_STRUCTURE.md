# Editor Translation Namespace Structure

> **Status**: Planned (Feature-Based Split)  
> **Date**: January 31, 2026  
> **Original Size**: 9,581 lines → **Restructured**: 6 namespace files

---

## Overview

The `editor` translation namespace has been subdivided based on **feature domains** and **user roles**:

### Feature-Based Organization

**1. Core Authoring** (`editor.authoring`) - Toolbars, drawers, configuration  
**2. File Management** (`editor.files`) - File browser, uploads, metadata (LARGEST: 2,154 lines)  
**3. AI Features** (`editor.ai`) - Content generation, suggestions, prompts  
**4. Block Editors** (`editor.blocks`) - Quiz, answer, vocabulary editors  
**5. Learner Interface** (`workbook`) - Student-facing components and exercises  
**6. Shared Components** (`editor.shared`) - Display plugins, media, tables

### Benefits

✅ **Feature Isolation**: Related translations grouped together (e.g., all AI features in one namespace)  
✅ **Performance**: Much smaller files - largest is 2,304 lines (vs original 9,581)  
✅ **Maintainability**: Changes confined to specific feature domains  
✅ **Translation Workflow**: Translators focus on one feature area at a time  
✅ **Code Organization**: Clear namespace-to-feature mapping  
✅ **Bundle Optimization**: Load only needed translations per page/role

---

## Namespace Structure

### 1. `editor.authoring` (Core Editing Interface)
**Lines**: ~2,304  
**Used by**: Editor component, instructors, content creators  
**Purpose**: Main editing interface, toolbars, drawers, configuration

**Sections** (7):
| Section | Lines | Purpose |
|---------|-------|---------|
| toolBarPlugin | 1,017 | Full editing toolbar (save, publish, preview) |
| tabsVerticalRight | 343 | Right drawer (chat, outline, settings) |
| assignmentConfiguration | 291 | Assignment settings and configuration |
| toolbar | 288 | Toolbar utilities |
| configurationManager | 164 | Editor configuration management |
| tabsVerticalLeft | 144 | Left drawer (files, dictionary, grading) |
| mainToolbar | 57 | Main toolbar component |

**Code Pattern**:
```javascript
const { t } = useTranslation('editor.authoring');
<Button>{t('toolBarPlugin.save')}</Button>
```

---

### 2. `editor.files` (File Management) 🔥 LARGEST
**Lines**: ~2,154  
**Used by**: Editor component, file browser, upload dialogs  
**Purpose**: All file-related operations and metadata management

**Sections** (4):
| Section | Lines | Purpose |
|---------|-------|---------|
| fileManager2 | 955 | Modern file browser and management |
| fileMetadataComponent | 613 | File metadata editor (title, description, tags) |
| documentUploader | 428 | PDF document upload interface |
| fileManager | 158 | Legacy file management (deprecated) |

**Code Pattern**:
```javascript
const { t } = useTranslation('editor.files');
<Button>{t('fileManager2.upload')}</Button>
```

---

### 3. `editor.ai` (AI Features)
**Lines**: ~625  
**Used by**: AI generation modals, block suggestions, chat  
**Purpose**: All AI-powered content generation and suggestions

**Sections** (6):
| Section | Lines | Purpose |
|---------|-------|---------|
| unifiedGenerateModal | 184 | Unified AI content generation modal|
| promptMethodSelector | 144 | AI prompt selection interface |
| enhancedGenerators | 138 | Enhanced AI content generators |
| blockSuggestionMenu | 114 | AI-powered block suggestions |
| suggestedContent | 42 | AI content suggestions |
| aiContentSuggestion | 3 | AI suggestion hints |

**Code Pattern**:
```javascript
const { t } = useTranslation('editor.ai');
<Modal>{t('unifiedGenerateModal.title')}</Modal>
```

---

### 4. `editor.blocks` (Block Editors)
**Lines**: ~1,097  
**Used by**: Block editor components (quiz, answer, vocab)  
**Purpose**: Editing interfaces for all content block types

**Sections** (5):
| Section | Lines | Purpose |
|---------|-------|---------|
| customAnswerEditor | 519 | Custom answer block editor |
| meaningAssociationEditor | 260 | Vocabulary association editor |
| quizEditor | 176 | Quiz block editor |
| answerEditor | 120 | Answer block editor |
| questionEditor | 22 | Question editor |

**Code Pattern**:
```javascript
const { t } = useTranslation('editor.blocks');
<Editor>{t('quizEditor.addQuestion')}</Editor>
```

---

### 5. `workbook` (Learner Interface)
**Lines**: ~399  
**Used by**: Workbook component, students, learners  
**Purpose**: Read-only student interface for completing exercises

**Sections** (7):
| Section | Lines | Purpose |
|---------|-------|---------|
| answerComponent | 180 | Answer exercise component |
| toolBarRoPlugin | 59 | Read-only toolbar |
| verticalTabsRo | 56 | Single drawer for reference |
| unitCompletedPlugin | 50 | Completion tracking |
| quizComponent | 22 | Quiz exercise component |
| meaningAssociationExercise | 17 | Vocab association exercise |
| customAnswerComponent | 15 | Custom answer exercise |

**Code Pattern**:
```javascript
const { t } = useTranslation('workbook');
<Toolbar>{t('toolBarRoPlugin.submit')}</Toolbar>
```

---

### 6. `editor.shared` (Shared Components & Plugins)
**Lines**: ~3,006  
**Used by**: Both Editor and Workbook  
**Purpose**: Display plugins, media players, recording, embedding

**Sections** (36):
| Section | Lines | Purpose |
|---------|-------|---------|
| **Recording/Audio** | | |
| recordingStudio3 | 595 | Modern recording studio |
| recordingStudioEnhanced | 205 | Enhanced recording features |
| imagesPlugin | 202 | Image gallery plugin |
| metadataEditor | 257 | Metadata editing interface |
| playlistEditor | 55 | Audio playlist editor |
| recordingStudio | 42 | Legacy recording (deprecated) |
| audioWaveformPlayer | 21 | Audio waveform display |
| staticWaveform | 22 | Static waveform component |
| sketchPad | 59 | Drawing/sketch tool |
| **Embedding** | | |
| unitEmbedding | 147 | Unit embedding interface |
| autoEmbedPlugin | 83 | Auto-embed functionality |
| unitEmbeddingComponents | 61 | Embedding UI components |
| wordEmbeddingIntegration | 37 | Word embedding integration |
| wordEmbedding | 17 | Word embedding tools |
| **Display Plugins** | | |
| tablePlugin | 134 | Table component plugin |
| wordBlockPlugin | 73 | Vocabulary word display |
| vocabularyReview | 72 | Vocabulary review interface |
| questionsReview | 72 | Questions review panel |
| tableComponent | 95 | Table display component |
| mediaPlayerComponent | 22 | Media player wrapper |
| pdfViewerComponent | 40 | PDF viewer component |
| **UI Components** | | |
| floatingLinkEditorPlugin | 130 | Link editor popup |
| imageMaskEditor | 121 | Image masking/cropping |
| freeSoloCreateOptionDialog | 99 | Free solo create dialog |
| insertLayoutDialog | 42 | Layout insertion dialog |
| placeholders | 62 | Placeholder components |
| blocks | 76 | Generic block utilities |
| questionBlock | 41 | Question block display |
| autocompleteNode | 41 | Autocomplete functionality |
| tableOfContents | 34 | Table of contents widget |
| imageResizer | 22 | Image resize tool |

**Code Pattern**:
```javascript
const { t } = useTranslation('editor.shared');
<Plugin>{t('wordBlockPlugin.definition')}</Plugin>
```

---

## Namespace Mapping Statistics

```
BEFORE:
├── editor.json              9,581 lines    (59 sections, all mixed together)
├── components.json          5,179 lines    (existing)
└── common.json                XXX lines    (existing)

AFTER:
├── editor.authoring.json    2,304 lines    (7 sections - toolbars, drawers, config)
├── editor.files.json        2,154 lines    (4 sections - file management) 🔥 HUGE
├── editor.ai.json             625 lines    (6 sections - AI features)
├── editor.blocks.json       1,097 lines    (5 sections - block editors)
├── workbook.json              399 lines    (7 sections - learner interface)
├── editor.shared.json       3,006 lines    (36 sections - plugins, media, display)
├── components.json          5,179 lines    (unchanged)
└── common.json                XXX lines    (unchanged)
```

**Benefits**:
- **Feature isolation**: All AI features together, all file management together
- **Reduced max file size**: Largest file reduced from 9,581 → 2,304 lines (-76%)
- **Clear domains**: Each namespace has a single, well-defined purpose
- **Easier maintenance**: Changes confined to specific feature domains
- **Performance**: Load only needed namespaces per page/role
- **Translation workflow**: Translators can focus on one feature area at a time

---

## Complete Section Mapping

### editor.authoring (2,304 lines)
| Section | Lines | Purpose |
|---------|-------|---------|
| toolBarPlugin | 1,017 | Full editing toolbar (save, publish, preview, undo/redo) |
| tabsVerticalRight | 343 | Right drawer (AI chat, outline, settings) |
| assignmentConfiguration | 291 | Assignment settings and due dates |
| toolbar | 288 | Toolbar utilities and helpers |
| configurationManager | 164 | Editor configuration management |
| tabsVerticalLeft | 144 | Left drawer (files, dictionary, grading) |
| mainToolbar | 57 | Main toolbar component |
| **TOTAL** | **2,304** | **Core editing interface** |

### editor.files (2,154 lines) 🔥
| Section | Lines | Purpose |
|---------|-------|---------|
| fileManager2 | 955 | Modern file browser with grid/list views |
| fileMetadataComponent | 613 | File metadata editor (title, tags, description) |
| documentUploader | 428 | PDF document upload with progress tracking |
| fileManager | 158 | Legacy file management (deprecated) |
| **TOTAL** | **2,154** | **File management domain** |

### editor.ai (625 lines)
| Section | Lines | Purpose |
|---------|-------|---------|
| unifiedGenerateModal | 184 | Unified AI content generation interface |
| promptMethodSelector | 144 | AI prompt selection and configuration |
| enhancedGenerators | 138 | Enhanced AI content generators |
| blockSuggestionMenu | 114 | AI-powered block suggestions |
| suggestedContent | 42 | AI content suggestions panel |
| aiContentSuggestion | 3 | AI suggestion hints |
| **TOTAL** | **625** | **AI-powered features** |

### editor.blocks (1,097 lines)
| Section | Lines | Purpose |
|---------|-------|---------|
| customAnswerEditor | 519 | Custom answer block editor with validation |
| meaningAssociationEditor | 260 | Vocabulary association editor |
| quizEditor | 176 | Quiz block editor (questions + answers) |
| answerEditor | 120 | Answer block editor |
| questionEditor | 22 | Question editor component |
| **TOTAL** | **1,097** | **Block editing tools** |

### workbook (399 lines)
| Section | Lines | Purpose |
|---------|-------|---------|
| answerComponent | 180 | Answer exercise with feedback |
| toolBarRoPlugin | 59 | Read-only toolbar (submit, progress) |
| verticalTabsRo | 56 | Single drawer for reference materials |
| unitCompletedPlugin | 50 | Completion tracking and celebration |
| quizComponent | 22 | Quiz exercise for students |
| meaningAssociationExercise | 17 | Vocab association exercise |
| customAnswerComponent | 15 | Custom answer exercise |
| **TOTAL** | **399** | **Student learning interface** |

### editor.shared (3,006 lines)
| Section | Lines | Purpose | Category |
|---------|-------|---------|----------|
| recordingStudio3 | 595 | Modern recording studio | Recording |
| metadataEditor | 257 | Metadata editing | UI |
| recordingStudioEnhanced | 205 | Enhanced recording features | Recording |
| imagesPlugin | 202 | Image gallery plugin | Media |
| unitEmbedding | 147 | Unit embedding interface | Embedding |
| tablePlugin | 134 | Table component plugin | Display |
| floatingLinkEditorPlugin | 130 | Floating link editor | UI |
| imageMaskEditor | 121 | Image masking/cropping | Media |
| freeSoloCreateOptionDialog | 99 | Free solo create dialog | UI |
| tableComponent | 95 | Table display component | Display |
| autoEmbedPlugin | 83 | Auto-embed functionality | Embedding |
| blocks | 76 | Generic block utilities | Display |
| wordBlockPlugin | 73 | Vocabulary word display | Display |
| vocabularyReview | 72 | Vocabulary review panel | Display |
| questionsReview | 72 | Questions review panel | Display |
| placeholders | 62 | Placeholder components | UI |
| unitEmbeddingComponents | 61 | Embedding UI components | Embedding |
| sketchPad | 59 | Drawing/sketch tool | Media |
| playlistEditor | 55 | Audio playlist editor | Media |
| recordingStudio | 42 | Legacy recording (deprecated) | Recording |
| insertLayoutDialog | 42 | Layout insertion dialog | UI |
| questionBlock | 41 | Question block display | Display |
| autocompleteNode | 41 | Autocomplete functionality | UI |
| pdfViewerComponent | 40 | PDF viewer component | Media |
| wordEmbeddingIntegration | 37 | Word embedding integration | Embedding |
| tableOfContents | 34 | Table of contents widget | Display |
| mediaPlayerComponent | 22 | Media player wrapper | Media |
| staticWaveform | 22 | Static waveform display | Recording |
| imageResizer | 22 | Image resize tool | Media |
| audioWaveformPlayer | 21 | Audio waveform player | Recording |
| wordEmbedding | 17 | Word embedding tools | Embedding |
| **TOTAL** | **3,006** | **Shared plugins & components** | **Mixed** |

**Grand Total**: 9,585 lines (59 sections across 6 namespaces)

---

## Migration Checklist

| Section | Lines | Purpose | Used By |
|---------|-------|---------|---------|
| toolBarPlugin | 150 | Full editing toolbar | Editor only |
| tabsVerticalLeft | 120 | Left drawer (files, dict, grading) | Editor only |
| tabsVerticalRight | 100 | Right drawer (chat, outline, settings) | Editor only |
| answerEditor | 180 | Answer block editor | Editor only |
| audioRecording2 | 200 | Audio recording UI | Editor only |
| customAnswerEditor | 160 | Custom answer editor | Editor only |
| meaningAssociationEditor | 140 | Vocab editor | Editor only |
| quizEditor | 220 | Quiz editor | Editor only |
| fileManager2 | 250 | File browser/uploader | Editor only |
| fileManager | 200 | Legacy file management | Editor only |
| documentUploader | 180 | PDF upload | Editor only |
| selectQuizGenerator | 160 | Quiz generation | Editor only |
| blockSuggestionMenu | 140 | AI block suggestions | Editor only |
| unifiedGenerateModal | 200 | AI content generation | Editor only |
| generateModal | 150 | Legacy generation (deprecated) | Editor only |
| unifiedAudioEmbeddingModal | 140 | Audio embedding | Editor only |
| imageEmbeddingModal | 120 | Image embedding | Editor only |
| pdfEmbeddingModal | 120 | PDF embedding | Editor only |
| videoEmbeddingModal | 120 | Video embedding | Editor only |
| imageMaskEditor | 100 | Image masking | Editor only |
| imageResizer | 80 | Image resize | Editor only |
| configurationManager | 180 | Editor config | Editor only |
| testAudioRecording | 60 | Audio testing | Editor only |
| unitEmbeddings | 100 | Embedding management | Editor only |
| **TOTAL** | **~3,500** | **24 sections** | **Authoring surface** |

### Workbook (Learner) → `workbook`

| Section | Lines | Purpose | Used By |
|---------|-------|---------|---------|
| toolBarRoPlugin | 120 | Read-only toolbar | Workbook only |
| verticalTabsRo | 100 | Single drawer | Workbook only |
| unitCompletedPlugin | 80 | Completion tracking | Workbook only |
| storyProgressPlugin | 60 | Progress indicator | Workbook only |
| answerComponent | 220 | Answer exercise | Workbook only |
| quizComponent | 240 | Quiz exercise | Workbook only |
| meaningAssociationComponent | 200 | Vocab exercise | Workbook only |
| customAnswerComponent | 180 | Custom answer exercise | Workbook only |
| **TOTAL** | **~1,200** | **8 sections** | **Learner surface** |

### Shared Components → `editor.shared`

| Section | Lines | Purpose | Used By |
|---------|-------|---------|---------|
| answerPlugin | 200 | Answer block rendering | Both |
| quizPlugin | 220 | Quiz block rendering | Both |
| meaningAssociationPlugin | 180 | Vocab block rendering | Both |
| customAnswerPlugin | 180 | Custom answer rendering | Both |
| wordBlockPlugin | 300 | Vocabulary display | Both |
| audioPlugin | 180 | Audio player | Both |
| videoPlugin | 160 | Video player | Both |
| youtubePlugin | 140 | YouTube embed | Both |
| tablePlugin | 160 | Table component | Both |
| imagesPlugin | 200 | Image gallery | Both |
| pdfPlugin | 180 | PDF viewer | Both |
| playlistPlugin | 200 | Audio playlist | Both |
| layoutPlugin | 250 | Layout blocks | Both |
| drawer | 140 | Drawer container | Both |
| gradingDrawer | 240 | Grading interface | Both |
| chatSidebar | 280 | AI chat | Both |
| outlinePanel | 120 | Content outline | Both |
| settingsPanel | 160 | Settings UI | Both |
| lexicalEditor | 300 | Base editor | Both |
| editorWrapper | 180 | Editor container | Both |
| treeViewPlugin | 100 | Debug tree | Both |
| tabIndentationPlugin | 80 | Tab handling | Both |
| keyboardNavigation | 120 | Keyboard shortcuts | Both |
| autoLinkPlugin | 100 | Auto-link | Both |
| contextualMenu | 140 | Right-click menu | Both |
| *[2 more sections]* | 200 | Various | Both |
| **TOTAL** | **~4,800** | **27 sections** | **Both surfaces** |

---

## Migration Checklist

### Phase 1: Create New Namespace Files
- [ ] Extract authoring sections to `public/locales/en/editor.authoring.json`
- [ ] Extract file management to `public/locales/en/editor.files.json` (LARGE!)
- [ ] Extract AI features to `public/locales/en/editor.ai.json`
- [ ] Extract block editors to `public/locales/en/editor.blocks.json`
- [ ] Extract learner interface to `public/locales/en/workbook.json`
- [ ] Extract shared components to `public/locales/en/editor.shared.json`
- [ ] Validate JSON syntax: `find public/locales/en -name "*.json" -exec jq . {} \;`
- [ ] Verify total line count: `wc -l public/locales/en/{editor.authoring,editor.files,editor.ai,editor.blocks,workbook,editor.shared}.json`

### Phase 2: Update Component Imports

**Authoring Tools** (Toolbars, Drawers, Configuration):
```diff
- const { t } = useTranslation('editor');
+ const { t } = useTranslation('editor.authoring');
  <Button>{t('toolBarPlugin.save')}</Button>
```
**Files**: ToolBarPlugin, TabsVerticalLeft, TabsVerticalRight, ConfigurationManager

**File Management** (File Browser, Uploads):
```diff
- const { t } = useTranslation('editor');
+ const { t } = useTranslation('editor.files');
  <Button>{t('fileManager2.upload')}</Button>
```
**Files**: FileManager2, FileMetadataComponent, DocumentUploader

**AI Features** (Content Generation, Suggestions):
```diff
- const { t } = useTranslation('editor');
+ const { t } = useTranslation('editor.ai');
  <Modal>{t('unifiedGenerateModal.generate')}</Modal>
```
**Files**: UnifiedGenerateModal, BlockSuggestionMenu, PromptMethodSelector

**Block Editors** (Quiz, Answer, Vocab Editors):
```diff
- const { t } = useTranslation('editor');
+ const { t } = useTranslation('editor.blocks');
  <Editor>{t('quizEditor.addQuestion')}</Editor>
```
**Files**: QuizEditor, AnswerEditor, CustomAnswerEditor, MeaningAssociationEditor

**Workbook** (Student Interface):
```diff
- const { t } = useTranslation('editor');
+ const { t } = useTranslation('workbook');
  <Toolbar>{t('toolBarRoPlugin.submit')}</Toolbar>
```
**Files**: Workbook component, ToolBarRoPlugin, VerticalTabsRo, AnswerComponent

**Shared Plugins** (Display, Media, Recording):
```diff
- const { t } = useTranslation('editor');
+ const { t } = useTranslation('editor.shared');
  <Plugin>{t('wordBlockPlugin.definition')}</Plugin>
```
**Files**: WordBlockPlugin, RecordingStudio3, TablePlugin, ImagesPlugin, etc.

### Phase 3: Update next-i18next Configuration

```javascript
// next-i18next.config.js
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ja', 'es', 'fr', 'de'],
  },
  ns: [
    'common',
    'components',
    'editor.authoring',    // Core editing interface
    'editor.files',        // File management
    'editor.ai',           // AI features
    'editor.blocks',       // Block editors
    'workbook',            // Student interface
    'editor.shared',       // Shared plugins
    // ... other namespaces
  ],
};
```

### Phase 4: Create Translation Files for Other Locales
- [ ] Copy structure to `public/locales/ja/` (6 files)
- [ ] Copy structure to `public/locales/es/` (6 files)
- [ ] Copy structure to `public/locales/fr/` (6 files)
- [ ] Copy structure to `public/locales/de/` (6 files)
- [ ] Mark untranslated strings with `(en)` prefix or use fallback

### Phase 5: Testing
- [ ] Run `npm run dev` and verify no translation errors
- [ ] Test Editor authoring interface - all toolbar/drawer strings
- [ ] Test File management - upload, browse, metadata
- [ ] Test AI features - generation, suggestions
- [ ] Test Block editors - quiz, answer, vocab
- [ ] Test Workbook learner interface - exercises, completion
- [ ] Test shared components - media, tables, recording
- [ ] Check console for missing translation warnings
- [ ] Run E2E tests: `npm run cypress:open`

### Phase 6: Cleanup & Documentation
- [ ] Archive old `editor.json` file: `mv editor.json editor.json.backup`
- [ ] Update ONBOARDING.md with new namespace structure
- [ ] Document namespace usage in code comments
- [ ] Update i18n documentation with namespace guide
- [ ] Create PR with before/after file size comparison

---

## Usage Examples

### Example 1: Core Authoring (Toolbar)

**File**: `src/components/Editor3/plugins/ToolBarPlugin/index.js`

```javascript
import { useTranslation } from 'next-i18next';

export default function ToolBarPlugin() {
  const { t } = useTranslation('editor.authoring');
  
  return (
    <Toolbar>
      <Button onClick={handleSave}>
        {t('toolBarPlugin.save')}
      </Button>
      <Button onClick={handlePublish}>
        {t('toolBarPlugin.publish')}
      </Button>
      <Button onClick={handlePreview}>
        {t('toolBarPlugin.preview')}
      </Button>
    </Toolbar>
  );
}
```

---

### Example 2: File Management

**File**: `src/components/Editor3/components/FileManager2/index.js`

```javascript
import { useTranslation } from 'next-i18next';

export default function FileManager2() {
  const { t } = useTranslation('editor.files');
  
  return (
    <FileManagerContainer>
      <Button onClick={handleUpload}>
        {t('fileManager2.upload')}
      </Button>
      <FileGrid>
        {files.map(file => (
          <FileCard>
            <Typography>{file.name}</Typography>
            <Button>{t('fileManager2.edit')}</Button>
          </FileCard>
        ))}
      </FileGrid>
    </FileManagerContainer>
  );
}
```

---

### Example 3: AI Features

**File**: `src/components/Editor3/components/UnifiedGenerateModal/index.js`

```javascript
import { useTranslation } from 'next-i18next';

export default function UnifiedGenerateModal() {
  const { t } = useTranslation('editor.ai');
  
  return (
    <Modal>
      <Typography variant="h6">
        {t('unifiedGenerateModal.title')}
      </Typography>
      <Button onClick={handleGenerate}>
        {t('unifiedGenerateModal.generate')}
      </Button>
    </Modal>
  );
}
```

---

### Example 4: Block Editors

**File**: `src/components/Editor3/components/QuizEditor/index.js`

```javascript
import { useTranslation } from 'next-i18next';

export default function QuizEditor() {
  const { t } = useTranslation('editor.blocks');
  
  return (
    <Editor>
      <Button onClick={handleAddQuestion}>
        {t('quizEditor.addQuestion')}
      </Button>
      <QuestionList>
        {questions.map((q, i) => (
          <Question key={i}>
            {t('quizEditor.question', { number: i + 1 })}
          </Question>
        ))}
      </QuestionList>
    </Editor>
  );
}
```

---

### Example 5: Workbook (Student Interface)

**File**: `src/components/Editor3/Workbook.js`

```javascript
import { useTranslation } from 'next-i18next';

export function Workbook() {
  const { t: tWorkbook } = useTranslation('workbook');
  const { t: tShared } = useTranslation('editor.shared');
  
  return (
    <LexicalComposer editable={false}>
      <ToolBarRoPlugin />  {/* Uses 'workbook' */}
      
      <EditorWrapper>
        <WordBlockPlugin />  {/* Uses 'editor.shared' */}
      </EditorWrapper>
      
      <VerticalTabsRo>
        <Typography>{tWorkbook('verticalTabsRo.reference')}</Typography>
      </VerticalTabsRo>
    </LexicalComposer>
  );
}
```

---

### Example 6: Shared Components

**File**: `src/components/Editor3/plugins/WordBlockPlugin/index.js`

```javascript
import { useTranslation } from 'next-i18next';

export default function WordBlockPlugin({ word }) {
  const { t } = useTranslation('editor.shared');
  
  return (
    <div className="word-block">
      <Typography variant="h6">{word.word}</Typography>
      <Typography>
        {t('wordBlockPlugin.definition')}: {word.definition}
      </Typography>
      <Typography>
        {t('wordBlockPlugin.phonetic')}: {word.phonetic}
      </Typography>
    </div>
  );
}
```

---

### Example 7: Multiple Namespaces in One Component

**File**: `src/components/Editor3/index.js`

```javascript
import { useTranslation } from 'next-i18next';

export default function Editor() {
  const { t: tAuth } = useTranslation('editor.authoring');
  const { t: tFiles } = useTranslation('editor.files');
  const { t: tAI } = useTranslation('editor.ai');
  const { t: tShared } = useTranslation('editor.shared');
  
  return (
    <LexicalComposer>
      {/* Authoring namespace */}
      <ToolBarPlugin />  
      
      <TabsVerticalLeft>
        {/* Files namespace */}
        <FileManager2 />
      </TabsVerticalLeft>
      
      <EditorWrapper>
        {/* Shared namespace */}
        <WordBlockPlugin />
        <TablePlugin />
      </EditorWrapper>
      
      <TabsVerticalRight>
        {/* AI namespace */}
        <ChatSidebar />
        <BlockSuggestionMenu />
      </TabsVerticalRight>
    </LexicalComposer>
  );
}
```

---

## Decision Rationale

### Why Feature-Based Split (6 Namespaces)?

**1. Feature Isolation**
- All AI features together (`editor.ai`) - easy to find all generation-related strings
- All file management together (`editor.files`) - massive domain deserves its own namespace
- All block editors together (`editor.blocks`) - quiz/answer/vocab editing in one place

**2. File Size Optimization**
- Original: One 9,581-line monster file
- Largest after split: 2,304 lines (editor.authoring) - **76% reduction!**
- Makes files navigable and maintainable

**3. Translation Workflow**
- Translators can tackle one feature domain at a time
- Clear context: "This file is all AI features" vs "This file is file management"
- Easier to assign translation work to specialists (e.g., technical writer for AI prompts)

**4. Performance Benefits**
- Load only needed namespaces per page
- File management page doesn't need AI translation files
- Workbook students don't load authoring toolbars

**5. Code Clarity**
- `editor.files` - obviously file-related
- `editor.ai` - obviously AI-related
- `editor.blocks` - obviously block editors
- Clear mapping from namespace to feature domain

### Why These Specific Divisions?

**editor.authoring** - Everything related to the main editing interface  
**Rationale**: Toolbars and drawers are tightly coupled, always loaded together

**editor.files** - File management deserves its own namespace  
**Rationale**: 2,154 lines! Large enough to justify isolation. File operations are a distinct domain.

**editor.ai** - All AI features together  
**Rationale**: Related functionality, likely updated together as AI features evolve

**editor.blocks** - All block editors  
**Rationale**: Quiz/answer/vocab editors share similar patterns, edited by same team

**workbook** - Student interface  
**Rationale**: Different audience (students vs instructors), different tone, often translated differently

**editor.shared** - Everything used by multiple surfaces  
**Rationale**: Avoid duplication, single source of truth for shared components

### Alternative Approaches Considered

**Rejected**: User role only (editor vs workbook)
- **Problem**: 4,800-line shared file still too large
- **Problem**: Doesn't help organize by feature domain

**Rejected**: Component type (plugins vs components vs editors)
- **Problem**: Doesn't match how developers think about features
- **Problem**: Hard to find related strings (AI generation split across multiple files)

**Rejected**: Alphabetical or random grouping
- **Problem**: No semantic meaning
- **Problem**: Doesn't reflect code architecture

**Accepted**: Feature-based with role distinction
- **Benefit**: Clear feature domains
- **Benefit**: File sizes manageable (all under 2,400 lines)
- **Benefit**: Easy to find translations ("where's the upload button text?" → editor.files)
- **Benefit**: Matches developer mental model

---

## Implementation Status

**Completed**:
- [x] Analysis of 59 sections in editor.json
- [x] Line count analysis identifying natural divisions
- [x] Feature-domain mapping (files, AI, blocks, authoring, workbook, shared)
- [x] Documentation with complete section-to-namespace mapping
- [x] Usage examples for all 6 namespaces
- [x] Migration checklist with code examples

**Next Steps**:
- [ ] Extract sections to 6 new namespace files
- [ ] Update ~67 component imports to use new namespaces
- [ ] Update next-i18next.config.js
- [ ] Create translation files for other locales (ja, es, fr, de)
- [ ] Test all editor surfaces
- [ ] Remove old editor.json file

---

## Quick Reference

| Namespace | Lines | Sections | Use When |
|-----------|-------|----------|----------|
| `editor.authoring` | 2,304 | 7 | Toolbars, drawers, config |
| `editor.files` | 2,154 | 4 | File browser, upload, metadata |
| `editor.ai` | 625 | 6 | AI generation, suggestions |
| `editor.blocks` | 1,097 | 5 | Quiz/answer/vocab editors |
| `workbook` | 399 | 7 | Student exercises, completion |
| `editor.shared` | 3,006 | 36 | Display, media, recording, tables |

---

**Total Sections Mapped**: 59/59 ✅  
**New Namespaces**: 6  
**Largest File Reduction**: 9,581 → 2,304 lines (-76%)  
**Components to Update**: ~67 files  
**Estimated Migration Time**: 3-4 hours

---

*Last Updated*: January 31, 2026

### Root Namespace: `editor`
**Path**: `public/locales/{lang}/editor.json`  
**Count**: 8 sections (~1,000 lines)  

Core editor utilities and miscellaneous features:
- aiContentSuggestion
- configurationManager
- metadataField
- placeholders
- promptMethodSelector
- questionsReview
- staticWaveform
- suggestedContent

---

### `editor.plugins`
**Path**: `public/locales/{lang}/editor.plugins.json`  
**Count**: 8 sections (~2,500 lines)

Lexical editor plugins that extend core functionality:

| Section | Description | Lines |
|---------|-------------|-------|
| autoEmbedPlugin | YouTube/external content embedding | ~100 |
| floatingLinkEditorPlugin | Hyperlink editing toolbar | ~130 |
| imagesPlugin | Image upload and insertion | ~200 |
| tablePlugin | Table creation and management | ~100 |
| toolBarPlugin | Main editor formatting toolbar | ~1,400 |
| toolBarRoPlugin | Read-only toolbar variant | ~300 |
| unitCompletedPlugin | Unit completion tracking | ~150 |
| wordBlockPlugin | Vocabulary word blocks | ~120 |

---

### `editor.components`
**Path**: `public/locales/{lang}/editor.components.json`  
**Count**: 9 sections (~1,800 lines)

Reusable UI components within the editor:

| Section | Description | Lines |
|---------|-------------|-------|
| answerComponent | Answer display with audio/feedback | ~180 |
| customAnswerComponent | Custom answer exercise interface | ~120 |
| quizComponent | Quiz block rendering | ~80 |
| tableComponent | Interactive table component | ~200 |
| mediaPlayerComponent | Audio/video playback | ~80 |
| audioWaveformPlayer | Audio waveform visualization | ~100 |
| pdfViewerComponent | PDF document viewer | ~80 |
| autocompleteNode | Autocomplete suggestions | ~40 |
| fileMetadataComponent | File metadata display | ~720 |

---

### `editor.editors`
**Path**: `public/locales/{lang}/editor.editors.json`  
**Count**: 10 sections (~2,200 lines)

Dedicated editing interfaces for specific content types:

| Section | Description | Lines |
|---------|-------------|-------|
| answerEditor | Answer configuration editor | ~120 |
| customAnswerEditor | Custom answer exercise editor | ~520 |
| meaningAssociationEditor | Vocabulary association editor | ~260 |
| questionEditor | Question configuration | ~80 |
| quizEditor | Quiz block editor | ~280 |
| playlistEditor | Audio/video playlist editor | ~135 |
| imageMaskEditor | Image masking tool | ~120 |
| imageResizer | Image resizing interface | ~80 |
| metadataEditor | File metadata editor | ~260 |
| freeSoloCreateOptionDialog | Add new dictionary word dialog | ~100 |

---

### `editor.recording`
**Path**: `public/locales/{lang}/editor.recording.json`  
**Count**: 4 sections (~1,100 lines)

Audio and visual recording features:

| Section | Description | Lines |
|---------|-------------|-------|
| recordingStudio | Basic recording interface | ~120 |
| recordingStudio3 | Advanced multi-track studio | ~720 |
| recordingStudioEnhanced | Enhanced audio processing | ~200 |
| sketchPad | Drawing/sketch tool | ~60 |

---

### `editor.files`
**Path**: `public/locales/{lang}/editor.files.json`  
**Count**: 4 sections (~2,300 lines)

File and document management:

| Section | Description | Lines |
|---------|-------------|-------|
| fileManager | File browser and manager | ~160 |
| fileManager2 | Enhanced file manager with tabs | ~1,000 |
| documentUploader | PDF/document upload interface | ~480 |
| enhancedGenerators | AI image/audio generation | ~160 |

---

### `editor.embedding`
**Path**: `public/locales/{lang}/editor.embedding.json`  
**Count**: 4 sections (~470 lines)

AI embedding features for semantic search:

| Section | Description | Lines |
|---------|-------------|-------|
| unitEmbedding | Unit content embedding | ~150 |
| unitEmbeddingComponents | Embedding UI components | ~150 |
| wordEmbedding | Word embedding generation | ~100 |
| wordEmbeddingIntegration | Embedding integration utilities | ~70 |

---

### `editor.ui`
**Path**: `public/locales/{lang}/editor.ui.json`  
**Count**: 6 sections (~1,000 lines)

User interface layout and navigation components:

| Section | Description | Lines |
|---------|-------------|-------|
| toolbar | Generic toolbar utilities | ~300 |
| mainToolbar | Main application toolbar | ~60 |
| tabsVerticalLeft | Left vertical tabs | ~144 |
| tabsVerticalRight | Right vertical tabs | ~343 |
| verticalTabsRo | Read-only vertical tabs | ~80 |
| tableOfContents | Document table of contents | ~80 |

---

### `editor.exercises`
**Path**: `public/locales/{lang}/editor.exercises.json`  
**Count**: 5 sections (~800 lines)

Learning activities and assignment configuration:

| Section | Description | Lines |
|---------|-------------|-------|
| blocks | Exercise block types | ~80 |
| questionBlock | Question exercise blocks | ~120 |
| meaningAssociationExercise | Vocabulary matching exercise | ~20 |
| vocabularyReview | Vocabulary study interface | ~90 |
| assignmentConfiguration | Due dates and timer settings | ~290 |

---

### `editor.dialogs`
**Path**: `public/locales/{lang}/editor.dialogs.json`  
**Count**: 3 sections (~300 lines)

Modal dialogs and popups:

| Section | Description | Lines |
|---------|-------------|-------|
| insertLayoutDialog | Layout insertion dialog | ~40 |
| unifiedGenerateModal | AI content generation modal | ~200 |
| blockSuggestionMenu | AI block suggestions | ~115 |

---

## Quick Reference: Top-Level to Namespace Mapping

```
editor (root)
├── aiContentSuggestion
├── configurationManager
├── metadataField
├── placeholders
├── promptMethodSelector
├── questionsReview
├── staticWaveform
└── suggestedContent

editor.plugins
├── autoEmbedPlugin
├── floatingLinkEditorPlugin
├── imagesPlugin
├── tablePlugin
├── toolBarPlugin
├── toolBarRoPlugin
├── unitCompletedPlugin
└── wordBlockPlugin

editor.components
├── answerComponent
├── autocompleteNode
├── audioWaveformPlayer
├── customAnswerComponent
├── fileMetadataComponent
├── mediaPlayerComponent
├── pdfViewerComponent
├── quizComponent
└── tableComponent

editor.editors
├── answerEditor
├── customAnswerEditor
├── freeSoloCreateOptionDialog
├── imageMaskEditor
├── imageResizer
├── meaningAssociationEditor
├── metadataEditor
├── playlistEditor
├── questionEditor
└── quizEditor

editor.recording
├── recordingStudio
├── recordingStudio3
├── recordingStudioEnhanced
└── sketchPad

editor.files
├── documentUploader
├── enhancedGenerators
├── fileManager
└── fileManager2

editor.embedding
├── unitEmbedding
├── unitEmbeddingComponents
├── wordEmbedding
└── wordEmbeddingIntegration

editor.ui
├── mainToolbar
├── tableOfContents
├── tabsVerticalLeft
├── tabsVerticalRight
├── toolbar
└── verticalTabsRo

editor.exercises
├── assignmentConfiguration
├── blocks
├── meaningAssociationExercise
├── questionBlock
└── vocabularyReview

editor.dialogs
├── blockSuggestionMenu
├── insertLayoutDialog
└── unifiedGenerateModal
```

---

## Usage in Code

### Before (monolithic)
```javascript
const { t } = useTranslation('editor');
t('toolBarPlugin.bold');  // ❌ Hard to maintain, massive file
```

### After (modular)
```javascript
const { t } = useTranslation('editor.plugins');
t('toolBarPlugin.bold');  // ✅ Clear namespace, smaller file
```

### Backward Compatibility
Old translation keys automatically fallback to the root `editor` namespace during migration period.

---

## Translation Workflow

### For Translators
1. **Identify feature area** - Use this document to find the correct namespace file
2. **Edit specific file** - e.g., `editor.plugins.json` for toolbar translations
3. **Validate** - Check file for JSON errors before committing
4. **Submit** - Smaller files = faster review cycles

### For Developers
1. **Update component** - Change `useTranslation('editor')` → `useTranslation('editor.plugins')`
2. **Reference this doc** - Verify correct namespace for your component
3. **Add new keys** - Place in appropriate namespace file based on component type

---

## Statistics

| Namespace | Sections | Approx. Lines | % of Total |
|-----------|----------|---------------|------------|
| editor (root) | 8 | 1,000 | 10% |
| editor.plugins | 8 | 2,500 | 26% |
| editor.components | 9 | 1,800 | 19% |
| editor.editors | 10 | 2,200 | 23% |
| editor.recording | 4 | 1,100 | 11% |
| editor.files | 4 | 2,300 | 24% |
| editor.embedding | 4 | 470 | 5% |
| editor.ui | 6 | 1,000 | 10% |
| editor.exercises | 5 | 800 | 8% |
| editor.dialogs | 3 | 300 | 3% |
| **TOTAL** | **61** | **~9,570** | **100%** |

---

## Migration Status

- [x] Documentation created
- [ ] Namespace files created
- [ ] Content extracted from editor.json
- [ ] Component imports updated
- [ ] Testing completed
- [ ] Translations verified

---

## Maintenance

### Adding New Sections
1. Determine logical namespace based on component type
2. Add section to appropriate `editor.{namespace}.json` file
3. Update this README with section count and line estimate
4. Update component to use correct namespace in `useTranslation()`

### Renaming Sections
1. Update section name in namespace file
2. Update component code references
3. Create alias in root `editor.json` for backward compatibility (temporary)
4. Update this README

---

## Related Documentation

- [I18N Translation Status](../../docs/I18N_TRANSLATION_STATUS.md)
- [Component Versioning](../../docs/COMPONENT_VERSIONING_FEATURE_SPEC.md)
- [Copilot Instructions](../../.github/copilot-instructions.md)
