# ARIA Label Localization Plan

## Background

ARIA attributes fall into two categories for localization:

- **`role`** — Never localize. Roles like `"button"`, `"dialog"`, `"navigation"` are spec-defined tokens consumed programmatically by assistive technologies.
- **`aria-label`** — Always localize. Screen readers announce this text to users, so it must be in the user's language.
- **`aria-labelledby` / `aria-describedby`** — Reference element IDs. The referenced element's visible content should already be localized.

## Current State

| Metric                                               | Count                                                            |
| ---------------------------------------------------- | ---------------------------------------------------------------- |
| Total hardcoded `aria-label` instances (active code) | **34**                                                           |
| Already localized via `t()`                          | **~50**                                                          |
| Files needing changes                                | **13**                                                           |
| Files already using `useTranslation`                 | 8 of 13                                                          |
| Files needing `useTranslation` added                 | 5                                                                |
| New i18n keys required                               | **0** (all reuse existing keys)                                  |
| Dead code removed from scope                         | `src/menu.jsx` — unused MUI demo (9 hardcoded labels, 0 imports) |

---

## Implementation Plan

All 34 instances map to existing i18n keys. No new locale file entries are needed.

### Group 1 — Files that already have `useTranslation` (8 files, 25 instances)

These only need the `aria-label` string swapped to a `t()` call.

#### [`src/components/MainToolbar.jsx`](../src/components/MainToolbar.jsx) — 5 instances

| Line | Old Value               | Replacement                                                  | Namespace          |
| ---- | ----------------------- | ------------------------------------------------------------ | ------------------ |
| 101  | `"Settings"`            | `t('common.settings', { ns: 'common' })`                     | `common`           |
| 169  | `"Help"`                | `t('common.help', { ns: 'common' })`                         | `common`           |
| 213  | `"Account"`             | `t('navigation.profile', { ns: 'common' })`                  | `common`           |
| 379  | `"menu"`                | `t('mainToolbar.menuAttribute', { ns: 'editor.authoring' })` | `editor.authoring` |
| 395  | `"Add User to Section"` | `t('mainToolbar.addToSection.title', { ns: 'common' })`      | `common`           |

#### [`src/components/ChatSidebar.jsx`](../src/components/ChatSidebar.jsx) — 1 instance

| Line | Old Value | Replacement                           | Namespace |
| ---- | --------- | ------------------------------------- | --------- |
| 2344 | `"Send"`  | `t('actions.send', { ns: 'common' })` | `common`  |

#### [`src/components/SortableAnswers.jsx`](../src/components/SortableAnswers.jsx) — 1 instance

| Line | Old Value  | Replacement                             | Namespace |
| ---- | ---------- | --------------------------------------- | --------- |
| 119  | `"delete"` | `t('actions.delete', { ns: 'common' })` | `common`  |

#### [`src/components/QuestionsReview2.tsx`](../src/components/QuestionsReview2.tsx) — 2 instances

| Line | Old Value | Replacement                     | Namespace    |
| ---- | --------- | ------------------------------- | ------------ |
| 342  | `"audio"` | `t('questionsReview.hasAudio')` | `components` |
| 347  | `"image"` | `t('questionsReview.hasImage')` | `components` |

#### [`src/components/Editor3/components/AudioWaveformPlayer.jsx`](../src/components/Editor3/components/AudioWaveformPlayer.jsx) — 1 instance

| Line | Old Value          | Replacement                                                 | Namespace |
| ---- | ------------------ | ----------------------------------------------------------- | --------- |
| 918  | `"Audio progress"` | `t('answerComponent.inputMethods.audio', { ns: 'editor' })` | `editor`  |

#### [`src/components/Editor3/components/FileManager2.jsx`](../src/components/Editor3/components/FileManager2.jsx) — 4 instances

| Line | Old Value     | Replacement                                                   | Namespace      |
| ---- | ------------- | ------------------------------------------------------------- | -------------- |
| 708  | `"File name"` | `t('fileMetadataComponent.filename', { ns: 'editor.files' })` | `editor.files` |
| 1265 | `"Generate"`  | `t('unifiedGenerateModal.generate', { ns: 'editor.ai' })`     | `editor.ai`    |
| 1456 | `"Generate"`  | `t('unifiedGenerateModal.generate', { ns: 'editor.ai' })`     | `editor.ai`    |
| 1650 | `"Generate"`  | `t('unifiedGenerateModal.generate', { ns: 'editor.ai' })`     | `editor.ai`    |

#### [`src/components/Editor3/components/TabsVerticalLeft.jsx`](../src/components/Editor3/components/TabsVerticalLeft.jsx) — 1 instance

| Line | Old Value                 | Replacement                                                            | Namespace          |
| ---- | ------------------------- | ---------------------------------------------------------------------- | ------------------ |
| 170  | `"Vertical tabs example"` | `t('tabsVerticalLeft.tabs.configuration', { ns: 'editor.authoring' })` | `editor.authoring` |

#### [`src/components/Editor3/components/TabsVerticalRight.jsx`](../src/components/Editor3/components/TabsVerticalRight.jsx) — 1 instance

| Line | Old Value                 | Replacement                                                    | Namespace          |
| ---- | ------------------------- | -------------------------------------------------------------- | ------------------ |
| 322  | `"Vertical tabs example"` | `t('tabsVerticalRight.gradesTab', { ns: 'editor.authoring' })` | `editor.authoring` |

#### [`src/components/Editor3/components/VerticalTabsRo.jsx`](../src/components/Editor3/components/VerticalTabsRo.jsx) — 1 instance

| Line | Old Value                 | Replacement                                        | Namespace  |
| ---- | ------------------------- | -------------------------------------------------- | ---------- |
| 158  | `"Vertical tabs example"` | `t('verticalTabsRo.settings', { ns: 'workbook' })` | `workbook` |

#### [`src/components/Editor3/nodes/CustomAnswerNode/CustomAnswerComponent.jsx`](../src/components/Editor3/nodes/CustomAnswerNode/CustomAnswerComponent.jsx) — 5 instances

| Line | Old Value                              | Replacement                                                  | Namespace   |
| ---- | -------------------------------------- | ------------------------------------------------------------ | ----------- |
| 208  | `"change input method"`                | `t('promptMethodSelector.inputButton', { ns: 'editor.ai' })` | `editor.ai` |
| 213  | `"text entry"`                         | `t('customAnswerComponent.text', { ns: 'editor' })`          | `editor`    |
| 219  | `"audio input"`                        | `t('customAnswerComponent.audio', { ns: 'editor' })`         | `editor`    |
| 224  | `"writing and drawing input"`          | `t('customAnswerComponent.writing', { ns: 'editor' })`       | `editor`    |
| 382  | `` `Answer text for question ${id}` `` | `t('customAnswerComponent.yourAnswer', { ns: 'editor' })`    | `editor`    |

#### [`src/components/Editor3/components/AnswerComponent.jsx`](../src/components/Editor3/components/AnswerComponent.jsx) — 1 instance

| Line | Old Value                               | Replacement                                               | Namespace |
| ---- | --------------------------------------- | --------------------------------------------------------- | --------- |
| 371  | `` `Answer text for question ${key}` `` | `t('customAnswerComponent.yourAnswer', { ns: 'editor' })` | `editor`  |

#### [`src/components/Editor3/plugins/ToolBarPlugin.jsx`](../src/components/Editor3/plugins/ToolBarPlugin.jsx) — 1 instance

| Line | Old Value       | Replacement                                                    | Namespace |
| ---- | --------------- | -------------------------------------------------------------- | --------- |
| 1180 | `"Long Answer"` | `t('customAnswerComponent.answerQuestions', { ns: 'editor' })` | `editor`  |

#### [`pages/section/[id].jsx`](../pages/section/[id].jsx) — 4 instances

| Line | Old Value          | Replacement                                       | Namespace |
| ---- | ------------------ | ------------------------------------------------- | --------- |
| 1111 | `"simple table"`   | `t('sectionDetail.students', { ns: 'pages' })`    | `pages`   |
| 1138 | `"delete"`         | `t('actions.delete', { ns: 'common' })`           | `common`  |
| 1287 | `"student grades"` | `t('sectionDetail.gradebook', { ns: 'pages' })`   | `pages`   |
| 1365 | `"simple table"`   | `t('sectionDetail.assignments', { ns: 'pages' })` | `pages`   |

### Group 2 — Files that need `useTranslation` added (5 files, 5 instances)

These need `import { useTranslation } from 'next-i18next'` and a `const { t } = useTranslation(...)` call added before the `aria-label` swap.

#### [`src/components/QuestionBlock.jsx`](../src/components/QuestionBlock.jsx) — 1 instance

| Line | Old Value  | Replacement                             | Namespace to Load |
| ---- | ---------- | --------------------------------------- | ----------------- |
| 83   | `"delete"` | `t('actions.delete', { ns: 'common' })` | `common`          |

#### [`src/components/MeaningAssociationExercise/index.jsx`](../src/components/MeaningAssociationExercise/index.jsx) — 1 instance

| Line | Old Value                                     | Replacement                            | Namespace to Load |
| ---- | --------------------------------------------- | -------------------------------------- | ----------------- |
| 270  | `"scrollable tabs of different difficulties"` | `t('common.filter', { ns: 'common' })` | `common`          |

#### [`src/components/DebugPanel/DebugPanel.tsx`](../src/components/DebugPanel/DebugPanel.tsx) — 1 instance

| Line | Old Value             | Replacement                            | Namespace to Load |
| ---- | --------------------- | -------------------------------------- | ----------------- |
| 227  | `"Close debug panel"` | `t('actions.close', { ns: 'common' })` | `common`          |

#### [`src/components/Editor3/index.tsx`](../src/components/Editor3/index.tsx) — 1 instance

| Line | Old Value               | Replacement                           | Namespace to Load |
| ---- | ----------------------- | ------------------------------------- | ----------------- |
| 556  | `"Main editor content"` | `t('actions.edit', { ns: 'common' })` | `common`          |

#### [`src/components/Editor3/Workbook.tsx`](../src/components/Editor3/Workbook.tsx) — 1 instance

| Line | Old Value            | Replacement                                  | Namespace to Load |
| ---- | -------------------- | -------------------------------------------- | ----------------- |
| 233  | `"Workbook content"` | `t('navigation.workbook', { ns: 'common' })` | `common`          |

#### [`src/components/Editor3/components/ImageComponent.jsx`](../src/components/Editor3/components/ImageComponent.jsx) — 1 instance

| Line | Old Value         | Replacement                                     | Namespace to Load |
| ---- | ----------------- | ----------------------------------------------- | ----------------- |
| 325  | `"Image caption"` | `t('svgPreview.caption', { ns: 'components' })` | `components`      |

---

## Dead Code: `src/menu.jsx`

This file is a copy-pasted MUI AppBar demo template. It exports `PrimarySearchAppBar` which has **zero imports or usages** anywhere in the codebase. It contained 9 hardcoded `aria-label` values including obviously placeholder text (`"show 4 new mails"`, `"show 17 new notifications"` with hardcoded badge counts).

**Recommendation:** Delete `src/menu.jsx`.

---

## Verification Steps

After implementation:

1. Run `grep -rn 'aria-label="' src/ pages/ --include='*.jsx' --include='*.tsx' | grep -v node_modules | grep -v '.stories.' | grep -v 'aria-labelledby'` — should return zero results (all converted to `aria-label={t(...)}`)
2. Run Storybook (`npm run storybook`) and verify no rendering errors
3. Spot-check a non-English locale to confirm screen reader text changes
4. Run existing Cypress tests to ensure no accessibility regressions

## Notes

- `aria-labelledby` and `aria-describedby` attributes are **not** affected — they reference element IDs, and the referenced elements already contain localized visible text.
- The `'aria-label'` object property syntax (used in `inputProps`) in TabsVerticalLeft/Right and VerticalTabsRo uses a numeric index, not user-facing text — no localization needed for those.
- No changes to `role` attributes — these are spec-defined English tokens and must never be localized.
