# i18n Translation Implementation - Parallel Delegation Plan

**Created**: 2026-01-27  
**Strategy**: Namespace-based parallel delegation to multiple subagents  
**Total Workload**: 625 translatable strings across 90+ files

## Delegation Strategy

Divide work by namespace and file groups to avoid merge conflicts. Each subagent works independently on their assigned files.

---

## Agent Assignments

### 🤖 Agent 1: Pages Namespace - Basic Pages (PRIORITY: HIGH)
**Namespace**: `pages` (already created)  
**Files**: 9 page files  
**Estimated Strings**: ~169 strings  
**Estimated Time**: 2-3 hours

#### Files to Translate:
1. ✅ `pages/grades.js` - **DONE** (7 strings)
2. ⏭️ `pages/index.js` - 28 strings (HIGH PRIORITY - main dashboard)
3. `pages/units.js` - 17 strings
4. `pages/sections.js` - 7 strings
5. `pages/section/[id].js` - 31 strings
6. `pages/profile.js` - 20 strings
7. `pages/unit/[id].js` - 1 string
8. `pages/workbook/[id].js` - 4 strings
9. `pages/privacy.js` - 54 strings

#### Instructions:
```bash
# 1. Import useTranslation in each file
import { useTranslation } from 'react-i18next';

# 2. Add hook at component start
const { t } = useTranslation('pages');

# 3. Replace strings with t() calls
# Example: "Grades" → {t('grades.title')}

# 4. Reference: public/locales/en/pages.json for key names

# 5. After EACH file, run:
git diff pages/[filename].js
# Verify changes look correct

# 6. Update I18N_TRANSLATION_STATUS.md after each file
```

---

### 🤖 Agent 2: Components Namespace - Chat & AI Components
**Namespace**: `components` (already created)  
**Files**: ~15 files  
**Estimated Strings**: ~100 strings  
**Estimated Time**: 2-3 hours

#### Files to Translate:
1. `src/Copyright.js` - 2 strings
2. `src/ProTip.js` - 3 strings
3. `src/components/AIFeedbackWidget.tsx` - 7 strings
4. `src/components/ChatSidebar.js` - 52 strings ⚠️ COMPLEX
5. `src/components/ChatSidebar/ContentPreview.tsx` - 5 strings
6. `src/components/ChatSidebar/LexicalMessageRenderer.jsx` - 1 string
7. `src/components/ChatSidebar/SearchResults.js` - 10 strings
8. `src/components/ChatSidebar/ToolCallPreview.tsx` - 5 strings
9. `src/components/ChatSidebar/VirtualizedMessageList.jsx` - 6 strings
10. `src/components/DictionaryEditor2.js` - 5 strings

#### Instructions:
```bash
# 1. Import useTranslation
import { useTranslation } from 'react-i18next';

# 2. Add hook
const { t } = useTranslation('components');

# 3. Replace strings
# Example: "Helpful" → {t('aiFeedbackWidget.helpful')}

# 4. Reference: public/locales/en/components.json

# 5. For ChatSidebar.js - verify message.parts structure first:
git log --oneline -- src/components/ChatSidebar.js
git show HEAD:src/components/ChatSidebar.js | grep -A 5 "message.parts"
```

---

### 🤖 Agent 3: Components Namespace - Editor3 Core Components
**Namespace**: `components`  
**Files**: ~20 Editor3 component files  
**Estimated Strings**: ~150 strings  
**Estimated Time**: 3-4 hours

#### Files to Translate:
1. `src/components/Editor3/components/AnswerComponent.js` - 18 strings
2. `src/components/Editor3/components/AnswerEditor.js` - 6 strings
3. `src/components/Editor3/components/AssignmentConfiguration.js` - 13 strings
4. `src/components/Editor3/components/AudioWaveformPlayer.js` - 1 string
5. `src/components/Editor3/components/AutocompleteNode.js` - 2 strings
6. `src/components/Editor3/components/BlockSuggestionMenu.js` - 6 strings
7. `src/components/Editor3/components/ConfigurationManager.js` - 8 strings
8. `src/components/Editor3/components/DocumentUploader.js` - 11 strings
9. `src/components/Editor3/components/EnhancedGenerators.js` - 4 strings
10. `src/components/Editor3/components/FileManager2.js` - 71+ strings ⚠️ LARGEST FILE
11. `src/components/Editor3/components/FreeSoloCreateOptionDialog.js` - 4 strings
12. `src/components/Editor3/components/ImageMaskEditor.js` - 5 strings
13. `src/components/Editor3/components/ImageResizer.js` - 1 string
14. `src/components/Editor3/components/InsertLayoutDialog.js` - 2 strings
15. `src/components/Editor3/components/MeaningAssociationEditor.js` - 6 strings
16. `src/components/Editor3/components/MediaPlayerComponent.js` - 2 strings
17. `src/components/Editor3/components/MetadataEditor.tsx` - 16 strings
18. `src/components/Editor3/components/MetadataField.jsx` - 1 string
19. `src/components/Editor3/components/PdfViewerComponent.js` - 2 strings
20. `src/components/Editor3/components/PlaylistEditor.js` - 4 strings

#### Instructions:
```bash
# Same as Agent 2, but focus on Editor3 components
# Reference: public/locales/en/components.json

# For FileManager2.js (71+ strings):
# - Work incrementally, test after every 10 strings
# - Watch for state management and DataStore patterns
```

---

### 🤖 Agent 4: Components Namespace - Editor3 Plugins & Nodes
**Namespace**: `components`  
**Files**: ~25 plugin/node files  
**Estimated Strings**: ~120 strings  
**Estimated Time**: 2-3 hours

#### Files to Translate:
1. `src/components/Editor3/components/PromptMethodSelector.js` - 8 strings
2. `src/components/Editor3/components/QuizComponent.js` - 1 string
3. `src/components/Editor3/components/QuizEditor.js` - 4 strings
4. `src/components/Editor3/components/SketchPad.js` - 3 strings
5. `src/components/Editor3/components/StaticWaveform.js` - 1 string
6. `src/components/Editor3/components/SuggestedContent.js` - 4 strings
7. `src/components/Editor3/components/TableComponent.js` - 15 strings
8. `src/components/Editor3/components/TableOfContents.js` - 2 strings
9. `src/components/Editor3/components/TabsVerticalLeft.js` - 7 strings
10. `src/components/Editor3/components/TabsVerticalRight.js` - 14 strings
11. `src/components/Editor3/components/UnifiedGenerateModal.js` - 13 strings
12. `src/components/Editor3/components/VerticalTabsRo.js` - 7 strings
13. `src/components/Editor3/nodes/CustomAnswerNode/CustomAnswerComponent.js` - 14 strings
14. `src/components/Editor3/nodes/CustomAnswerNode/CustomAnswerEditor.js` - 5 strings
15. `src/components/Editor3/nodes/FileMetadataNode/FileMetadataComponent.js` - 21 strings
16. `src/components/Editor3/plugins/AutoEmbedPlugin.js` - 1 string
17. `src/components/Editor3/plugins/ImagesPlugin.js` - 8 strings
18. `src/components/Editor3/plugins/TablePlugin.js` - 5 strings
19. `src/components/Editor3/plugins/ToolBarPlugin.js` - 26 strings
20. `src/components/Editor3/plugins/ToolBarRoPlugin.js` - 2 strings
21. `src/components/Editor3/plugins/UnitCompletedPlugin.js` - 3 strings
22. `src/components/Editor3/plugins/WordBlockPlugin.js` - 2 strings

---

### 🤖 Agent 5: Components Namespace - Remaining Components
**Namespace**: `components`  
**Files**: ~15 miscellaneous component files  
**Estimated Strings**: ~85 strings  
**Estimated Time**: 2 hours

#### Files to Translate:
1. `src/components/MainToolbar.js` - 8 strings
2. `src/components/MeaningAssociationExercise/*` - 4 strings (multiple files)
3. `src/components/ModerationBadge.js` - 3 strings
4. `src/components/ModerationPanel.js` - 6 strings
5. `src/components/QuestionBlock.js` - 5 strings
6. `src/components/QuestionEditor2.js` - 2 strings
7. `src/components/QuestionsReview2.tsx` - 17 strings
8. `src/components/RecordingStudio2.js` - 3 strings
9. `src/components/RecordingStudio3.jsx` - 16 strings
10. `src/components/RecordingStudio3/ScreenplayEditor.js` - 2 strings
11. `src/components/RecordingStudioEnhanced.js` - 10 strings
12. `src/components/SavedPdfThumbnail.tsx` - 2 strings
13. `src/components/SectionAssigner.js` - 6 strings
14. `src/components/SvgPreview.js` - 2 strings
15. `src/components/VocabularyReview2.tsx` - 17 strings
16. `src/components/authenticator.js` - 1 string
17. `src/components/embeddings/UnitEmbeddingComponents.js` - 4 strings
18. `src/components/embeddings/WordEmbeddingIntegration.js` - 4 strings

---

## Coordination Rules

### 🚨 Critical: Avoid Merge Conflicts

1. **Each agent works in their assigned files only**
2. **DO NOT modify files assigned to other agents**
3. **DO NOT modify shared files like:**
   - `I18N_TRANSLATION_TODOS.md` (read-only reference)
   - `package.json`
   - `tsconfig.json`

### ✅ Update Status Document

Each agent should update `docs/I18N_TRANSLATION_STATUS.md` after completing each file:

```markdown
### Pages (X/10 complete)
| File | Status |
|------|--------|
| pages/grades.js | ✅ Complete - Agent 1 |
| pages/index.js | ✅ Complete - Agent 1 |
```

### 🔄 Progress Tracking

Create a branch for each agent:
```bash
# Agent 1
git checkout -b i18n/pages-namespace

# Agent 2
git checkout -b i18n/components-chat

# Agent 3
git checkout -b i18n/components-editor3-core

# Agent 4
git checkout -b i18n/components-editor3-plugins

# Agent 5
git checkout -b i18n/components-misc
```

### 📝 Commit Convention

```bash
# After each file
git add [filename]
git commit -m "i18n: Add translations to [filename] (X strings)"

# Example
git commit -m "i18n: Add translations to pages/index.js (28 strings)"
```

---

## Quality Checklist (Each Agent)

After completing each file:

- [ ] Imported `useTranslation` from 'react-i18next'
- [ ] Added `const { t } = useTranslation('[namespace]');` hook
- [ ] Replaced all literal strings with `t('key')` calls
- [ ] Verified keys exist in namespace JSON file
- [ ] Ran `git diff` to review changes
- [ ] No CSS values or technical attributes translated
- [ ] Component still renders correctly (if possible to test)
- [ ] Updated status document

---

## Merge Strategy

After all agents complete:

1. **Agent 1** merges first (pages namespace)
2. **Agent 2-5** merge sequentially (components namespace - no conflicts expected)
3. **Final validation** - run full test suite
4. **Update main status** document with completion

---

## Timeline Estimate

- **Sequential**: ~15-20 hours
- **Parallel (5 agents)**: ~3-4 hours
- **Speedup**: ~5x faster

---

## Reference Files

- **Namespace JSON files**: `public/locales/en/pages.json`, `public/locales/en/components.json`
- **Original audit**: `I18N_TRANSLATION_TODOS.md`
- **Status tracker**: `docs/I18N_TRANSLATION_STATUS.md`
- **Workflow guide**: `.github/prompts/typescript-feature-workflow.prompt.md`
- **Example completed file**: `pages/grades.js` (see git diff)

---

## False Positives to Skip

**DO NOT translate these:**
- CSS values: `'success.main'`, `'info.main'`, `display="flex"`, `border="solid"`
- Technical attributes: `lang="en"`, `aria-*`, `data-*`
- Theme color strings
- Owner/identity placeholders in tests
- CSS filter values like `'grayscale(1)'`

Refer to `docs/I18N_TRANSLATION_STATUS.md` "False Positive Filter Results" section.

---

## Questions/Issues

If you encounter:
- **Ambiguous string**: Check context, ask in shared doc
- **Missing translation key**: Add to namespace JSON first
- **Complex component**: Break into smaller commits
- **Merge conflict**: Check with other agents before resolving

---

## Success Criteria

✅ All assigned files have translation tags  
✅ All t() calls reference valid keys in namespace JSON  
✅ No literal user-facing strings remain  
✅ Git history is clean with descriptive commits  
✅ Status document updated  
✅ No TypeScript errors introduced
