# Onboarding Stories Audit

Audit of Storybook onboarding tasks defined in:
- [`.storybook/code/onboarding-tasks.ts`](../.storybook/code/onboarding-tasks.ts) — task definitions with `instructions[]` and `completionCriteria`
- [`.storybook/code/spotlight-configs.ts`](../.storybook/code/spotlight-configs.ts) — spotlight step definitions with `tutorialSteps[]`, `quizSteps[]`, and `targetSelector` CSS selectors

---

## 1. Instruction-to-Spotlight-Step Ratio Mismatches

Each task has an `instructions[]` array (shown in the sidebar) and a `tutorialSteps[]` array (drives the spotlight overlay). When these counts diverge, the guided walkthrough doesn't track the listed instructions 1:1.

### Instructor Tasks

| Task ID | Instructions | Tutorial Steps | Delta |
|---|---|---|---|
| `instructor-setup-class` | 6 | 6 | ✅ Match |
| `instructor-create-unit` | 6 | 7 | **+1** (extra toolbar + save steps without matching instructions) |
| `instructor-add-quiz` | 7 | 6 | **-1** |
| `instructor-create-vocabulary` | 7 | 6 | **-1** |
| `instructor-create-assignment` | 7 | 7 | ✅ Match |
| `instructor-view-grades` | 6 | 5 | **-1** |
| `instructor-use-ai-assistant` | 7 | 6 | **-1** |
| `instructor-learn-shortcuts` | 9 | 6 | **-3** |

### Learner Tasks

| Task ID | Instructions | Tutorial Steps | Delta |
|---|---|---|---|
| `learner-join-class` | 6 | 6 | ✅ Match |
| `learner-view-assignments` | 5 | 5 | ✅ Match |
| `learner-complete-assignment` | 7 | 3 | **-4** |
| `learner-review-feedback` | 6 | 5 | **-1** |
| `learner-practice-vocabulary` | 6 | 5 | **-1** |
| `learner-use-chat-help` | 6 | 5 | **-1** |
| `learner-learn-shortcuts` | 7 | 3 | **-4** |

### Developer Tasks

Developer tasks are documentation-reading oriented and mostly lack `completionCriteria` entirely, so the mismatch is by design — they have no interactive spotlight walkthroughs to compare against.

### Summary

**10 out of 15 interactive tasks** have mismatched ratios. Worst offenders:
- `learner-complete-assignment` (7 instructions, 3 steps → **-4**)
- `learner-learn-shortcuts` (7 instructions, 3 steps → **-4**)
- `instructor-learn-shortcuts` (9 instructions, 6 steps → **-3**)

---

## 2. Tasks Without Event Emission (Manual "Complete" Button Only)

Quiz mode for every task ends with a `verify` step ("Mark this task complete" / "Did you complete it?"). The following tasks **also lack `requiredActions`**, meaning they have **no event-based completion path** and rely entirely on the manual button:

### Developer Tasks (All 8 — No `completionCriteria` at All)

| Task ID | Completion Method |
|---|---|
| `developer-explore-components` | Manual button only |
| `developer-understand-editor` | Manual button only |
| `developer-explore-datastore` | Manual button only |
| `developer-understand-ai-integration` | Manual button only |
| `developer-setup-dev-environment` | Manual button only |
| `developer-explore-file-structure` | Manual button only |
| `developer-run-tests` | Manual button only |
| `developer-customize-storybook` | Manual button only |

### Secret/Hidden Tasks (localStorage `customCheck` Only)

| Task ID | Completion Method |
|---|---|
| `secret-keyboard-master` | `customCheck` reads `localStorage` — no `requiredActions` |
| `secret-speed-demon` | `customCheck` reads `localStorage` — no `requiredActions` |
| `secret-achievement-hunter` | `customCheck` reads `localStorage` — no `requiredActions` |

---

## 3. Missing or Incorrect `data-tour` Reference Attributes

**18 `data-tour` selectors** referenced in `spotlight-configs.ts` do not exist in any component source file.

### Wrong Value (1)

| Selector Used | Task | Correct Value | File |
|---|---|---|---|
| `dictionary-editor` | `instructor-create-vocabulary` | `dictionary` | `src/components/DictionaryEditor2.jsx` |

### Missing From Source (14)

| Selector | Used By Task(s) |
|---|---|
| `audio-upload` | `instructor-create-vocabulary` |
| `grades-tab` | `instructor-view-grades` |
| `grades-list` | `instructor-view-grades` |
| `grade-detail` | `instructor-view-grades` |
| `chat-button` | `instructor-use-ai-assistant`, `learner-use-chat-help` |
| `chat-sidebar` | `instructor-use-ai-assistant` |
| `ai-message` | `instructor-use-ai-assistant`, `learner-use-chat-help` |
| `insert-button` | `instructor-use-ai-assistant` |
| `help-menu` | `instructor-learn-shortcuts` |
| `shortcuts-page` | `instructor-learn-shortcuts` |
| `shortcuts-demo` | `instructor-learn-shortcuts` |
| `my-grades` | `learner-review-feedback` |
| `word-card` | `learner-practice-vocabulary` |
| `play-audio` | `learner-practice-vocabulary` |

### Storybook Manager Frame Targets (3)

These target Storybook's own UI, which cannot be addressed via `data-tour` in component source. They require Storybook addon/decorator injection instead.

| Selector | Used By Task |
|---|---|
| `storybook-sidebar` | `developer-explore-components` |
| `tech-overview` | `developer-explore-components` |
| `docs-tab` / `canvas-tab` | `developer-explore-components` |
| `editor-stories` | `developer-understand-editor` |

### Existing `data-tour` Attributes (Reference)

These selectors from spotlight-configs.ts **do** have matching attributes in source:

| Selector | File(s) |
|---|---|
| `sections-page` | `pages/sections.jsx` |
| `create-section-button` | `pages/sections.jsx` |
| `section-form` | `pages/sections.jsx` |
| `join-code` | `pages/sections.jsx`, `pages/section/[id].jsx` |
| `section-card` | `pages/sections.jsx`, `pages/section/[id].jsx` |
| `units-page` | `pages/units.jsx` |
| `create-unit-button` | `pages/units.jsx` |
| `assignments-section` | `pages/section/[id].jsx` |
| `assignment-card` | `pages/section/[id].jsx` |
| `grade-card` | `pages/index.jsx` |
| `due-date-picker` | `src/components/SectionAssigner.jsx`, `AssignmentConfiguration.jsx` |
| `unit-selector` | `src/components/SectionAssigner.jsx`, `AssignmentConfiguration.jsx` |
| `create-assignment-button` | `src/components/SectionAssigner.jsx`, `AssignmentConfiguration.jsx` |
| `assignment-settings` | `AssignmentConfiguration.jsx` |
| `correct-checkbox` | `src/components/SortableAnswers.jsx` |
| `dictionary` | `src/components/DictionaryEditor2.jsx` |
| `add-word-button` | `src/components/DictionaryEditor2.jsx` |
| `word-form` | `src/components/DictionaryEditor2.jsx` |
| `chat-input` | `src/components/ChatSidebar.jsx` |
| `join-section-button` | `src/components/MainToolbar.jsx` |
| `join-section-dialog` | `src/components/MainToolbar.jsx` |
| `join-code-input` | `src/components/MainToolbar.jsx` |
| `workbook` | `src/components/Editor3/Workbook.tsx` |
| `editor` | `src/components/Editor3/index.tsx` |
| `quiz-block` | `QuizEditor.jsx`, `QuizComponent.jsx` |
| `quiz-answers` | `QuizComponent.jsx` |
| `correct-answers` | `GradeHistory.jsx` |

---

## 4. Tasks Mismatched to Their Linked Story Page

These tasks link to a Storybook story that doesn't match the persona's intent or the task's instructions.

### `learner-practice-vocabulary`

- **Problem**: `tutorialStoryId` → `📁-managing-content-vocabulary-review--default`
- **Why it's wrong**: VocabularyReview2 is an **instructor content management** component. Learners should see a read-only vocabulary practice view, not the editing/managing interface.
- **Suggested fix**: Create a learner-facing vocabulary practice story, or link to the workbook's vocabulary section.

### `learner-join-class`

- **Problem**: `tutorialStoryId` → `📚-creating-lessons-main-toolbar--full-toolbar`
- **Why it's wrong**: The MainToolbar is the **instructor's editing toolbar**. While it contains the join section dialog, showing the full instructor toolbar confuses the learner context. The task title is "Join Your First Class" but the story shows editor creation tools.
- **Suggested fix**: Create a learner-specific toolbar story or link to the Sections page story.

### `learner-review-feedback`

- **Problem**: `tutorialStoryId` → `📚-creating-lessons-workbook--workbook-with-content`
- **Why it's wrong**: The Workbook story shows active lesson content for completing work, not grade feedback. Task says "Review your accuracy score" and "Read instructor comments" but the linked story has no grade/feedback UI.
- **Suggested fix**: Link to a grade review story or the section detail page which has a grades tab.

### `instructor-create-vocabulary`

- **Problem**: `tutorialStoryId` → `📁-managing-content-vocabulary-review--default`
- **Why it's wrong**: Instructions say "Navigate to the Dictionary **Editor**" and "Add a new vocabulary word", but VocabularyReview is a **read-only review** component, not the DictionaryEditor2 where words are actually created.
- **Suggested fix**: Link to a DictionaryEditor2 story instead.

### `developer-explore-datastore`

- **Problem**: Instructions reference Gen 1 patterns
- **Why it's wrong**: References `"DATASTORE_OPTIMIZATION_CHANGES.md"` and `"DataStore.copyOf"` which are Amplify Gen 1 concepts. The project uses **Gen 2 Data Client** with `client.models.Model.observeQuery()`.
- **Suggested fix**: Update instructions to reference Gen 2 patterns, `amplify/data/resource.ts`, and context files using Data Client.

### `developer-understand-ai-integration`

- **Problem**: Instructions reference `pages/api/chat.js`
- **Why it's wrong**: The project's copilot-instructions.md explicitly states "**DO NOT USE** Next.js `/api` routes" — backend logic lives in Lambda functions under `amplify/functions/`.
- **Suggested fix**: Update to reference `amplify/functions/openai/` and the correct streaming implementation.

### `developer-keyboard-shortcuts-demo`

- **Problem**: `tutorialStoryId` → `📚-creating-lessons-editor--empty-editor-text-formatting`
- **Why it's wrong**: This is a blank editor story with basic text formatting. The task title is "Learn Keyboard Shortcuts" and instructions say "Watch the automated demonstration" — but the linked story has no keyboard shortcut demo functionality.
- **Suggested fix**: Link to `help-keyboard-shortcut-trainer--default` which is the actual trainer.

---

## 5. Story ID Verification

All 16 unique `tutorialStoryId` / `quizStoryId` values in `onboarding-tasks.ts` were verified against actual story files. **All 16 resolve to existing stories** — no broken story ID references.

| Story ID | Source File |
|---|---|
| `📄-pages-application-pages--sections` | `src/stories/pages.stories.tsx` |
| `📄-pages-application-pages--units` | `src/stories/pages.stories.tsx` |
| `📄-pages-application-pages--unit-detail` | `src/stories/pages.stories.tsx` |
| `📄-pages-application-pages--section-detail` | `src/stories/pages.stories.tsx` |
| `📄-pages-application-pages--workbook` | `src/stories/pages.stories.tsx` |
| `📚-creating-lessons-editor--empty-editor-custom-blocks` | `src/components/Editor3/Editor.stories.jsx` |
| `📚-creating-lessons-editor--empty-editor-text-formatting` | `src/components/Editor3/Editor.stories.jsx` |
| `📚-creating-lessons-workbook--workbook-with-content` | `src/components/Editor3/Workbook.stories.jsx` |
| `📚-creating-lessons-main-toolbar--full-toolbar` | `src/components/MainToolbar.stories.jsx` |
| `📁-managing-content-vocabulary-review--default` | `src/components/VocabularyReview2.stories.tsx` |
| `🧩-components-section-assigner--default` | `src/components/SectionAssigner.stories.jsx` |
| `💬-ai-assistant-chat-sidebar--getting-started` | `src/components/ChatSidebar.stories.jsx` |
| `help-keyboard-shortcut-trainer--default` | `src/stories/KeyboardShortcutTrainer.stories.tsx` |
| `translation-mode-demo--default` | `.storybook/TranslationMode.stories.tsx` |
| `translation-mode-demo--editor-namespace` | `.storybook/TranslationMode.stories.tsx` |
| `translation-mode-demo--auth-namespace` | `.storybook/TranslationMode.stories.tsx` |

---

## Summary Statistics

| Category | Count |
|---|---|
| Tasks with mismatched instruction/step ratio | **10 / 15** interactive tasks |
| Tasks with no event emission (manual complete only) | **11** (8 developer + 3 secret) |
| Missing/incorrect `data-tour` selectors | **18** (1 wrong value, 14 missing, 3 Storybook manager targets) |
| Tasks linked to wrong/mismatched story | **7** |
| Broken story ID references | **0** |
| Storybook manager selectors (cross-frame issue) | **5** |

---

## 6. Storybook Manager Frame — Cross-Frame Spotlight Limitation

### The Problem

5 `data-tour` selectors target elements in Storybook's **manager frame** (the outer shell — sidebar, toolbar, docs/canvas tabs), not the **preview iframe** where components render:

| Selector | Target |
|---|---|
| `storybook-sidebar` | `#storybook-explorer-tree` (sidebar navigation) |
| `tech-overview` | A specific sidebar entry |
| `docs-tab` | The "Docs" tab button |
| `canvas-tab` | The "Canvas" tab button |
| `editor-stories` | A sidebar category |

These **cannot be addressed** by adding `data-tour` attributes in component JSX, because component code only renders inside the preview iframe. The browser enforces separate `document` trees for each frame, so the spotlight overlay (running in the preview iframe) cannot query the manager DOM.

### Why the Addon Can Solve This

The onboarding addon (`.storybook/code/myOnboarding/manager.tsx`) already runs in the **manager context** — it registers via `addons.register()` and has full `document` access to the manager frame. It already queries manager DOM directly (e.g., `document.querySelector('[data-side="bottom"]')`).

### Recommended Approach — Storybook Channel Events

Use Storybook's built-in **channel** (event bus bridging manager ↔ preview) so the spotlight overlay in the preview iframe can request the manager addon to highlight elements on its side:

```typescript
// In manager.tsx — listen for spotlight requests from preview iframe
api.getChannel().on('spotlight:highlight-manager', ({ selector, dataTour }) => {
  const el = document.querySelector(selector);
  if (el) {
    el.setAttribute('data-tour', dataTour);
    // Position a highlight overlay on the element in the manager frame
  }
});

api.getChannel().on('spotlight:clear-manager', () => {
  document.querySelectorAll('[data-tour]').forEach(el => {
    el.removeAttribute('data-tour');
  });
});
```

```typescript
// In SpotlightOverlay (preview iframe) — request manager highlighting
import { useChannel } from '@storybook/manager-api';

// When step has targetFrame: 'manager'
channel.emit('spotlight:highlight-manager', {
  selector: '#storybook-explorer-tree',
  dataTour: 'storybook-sidebar',
});
```

### Selector Mapping for Manager Elements

| `data-tour` value | Manager DOM selector |
|---|---|
| `storybook-sidebar` | `#storybook-explorer-tree` |
| `docs-tab` | `button[id$="-tab-docs"]` |
| `canvas-tab` | `button[id$="-tab-canvas"]` |
| `tech-overview` | `a[href*="tech-overview"], [data-item-id*="tech-overview"]` |
| `editor-stories` | `a[href*="editor"], [data-item-id*="editor"]` |

### Required Changes

1. Add `targetFrame?: 'manager' | 'preview'` to the `SpotlightStep` interface in `SpotlightOverlay.tsx`
2. Tag the 5 developer spotlight steps with `targetFrame: 'manager'`
3. Add channel event listeners in `manager.tsx`
4. Add channel emit logic in `SpotlightOverlay` when `targetFrame === 'manager'`
