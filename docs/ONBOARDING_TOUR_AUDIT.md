# Onboarding Tour Audit — Instructions vs. Implementation

Audit date: 2026-09-05

Scope: `.storybook/code/onboarding-tasks.ts`, `.storybook/code/spotlight-configs.ts`,
`.storybook/code/task-completion.ts`, `.storybook/code/route-map.ts`,
`.storybook/components/OnboardingPanel.tsx`, `.storybook/components/SpotlightOverlay.tsx`,
`.storybook/components/QuizMode.tsx`.

Every finding below was verified against the actual source (grep'd `data-tour` attributes,
read the referenced line ranges) — this is not a blind restatement of a search summary.

---

## 1. Uncompletable tasks (real `data-tour` mismatch)

### 1.1 `instructor-create-vocabulary` — completionSequence references the wrong page's element
- [onboarding-tasks.ts](../.storybook/code/onboarding-tasks.ts#L100-L120)
- `tutorialStoryId`: Dictionary Editor story. `quizStoryId`: Unit Detail page.
- `completionSequence: ["add-word-button", "word-form", "word-card"]`
- `add-word-button` and `word-form` exist in [DictionaryEditor2.jsx](../src/components/DictionaryEditor2.jsx#L1977-L2061) ✅
- `word-card` does **not** exist in DictionaryEditor2.jsx or the unit-detail page — it only exists in [VocabularyReview2.tsx](../src/components/VocabularyReview2.tsx#L246), a page never loaded by this task in either mode.
- **Result: this task cannot be completed in tutorial or quiz mode.** The 3rd step of the sequence never fires.
- **Fix**: either add `data-tour="word-card"` to the word list item rendered inside DictionaryEditor2.jsx, or change the sequence to a 2-item one ending at `word-form` submission.

### 1.2 `learner-practice-vocabulary` — same `word-card` element, wrong quiz page
- [onboarding-tasks.ts](../.storybook/code/onboarding-tasks.ts) (`quizStoryId` = unit-detail page)
- `completionSequence: ["word-card"]`, but `word-card` only exists on the Vocabulary Review page, not unit-detail.
- **Result: uncompletable in quiz mode.** Tutorial mode works because `tutorialStoryId` is the Vocabulary Review story.
- **Fix**: quiz mode's destination story for this task should be the Vocabulary Review story, not unit-detail — or add the completion element to unit-detail.

---

## 2. Completion criteria doesn't match the described task (semantic mismatch)

### 2.1 `learner-review-feedback` uses the assignments sequence, not a grades sequence
- [onboarding-tasks.ts](../.storybook/code/onboarding-tasks.ts) instructions talk about opening grades/feedback and reviewing correct answers.
- `completionSequence: ["assignments-section", "assignment-card"]` — **identical** to `learner-view-assignments`'s sequence.
- **Result**: the task is marked complete the moment the user opens any assignment card, without ever touching a grade or feedback view. The instructions promise a workflow the completion logic doesn't check for.
- **Fix**: add a real `data-tour` on the grade/feedback view (e.g. `grade-detail`, referenced elsewhere in spotlight-configs.ts as a step id) and use it as the final sequence item.

### 2.2 `instructor-create-assignment` — completionSequence is shorter than the guided steps
- [onboarding-tasks.ts](../.storybook/code/onboarding-tasks.ts) instructions: select unit → set due date → configure settings → confirm visible (4 steps).
- `completionSequence: ["unit-selector", "create-assignment-button"]` — only 2 steps; skips due-date and settings entirely even though spotlight-configs.ts has dedicated `due-date` and `settings` steps for this task.
- **Result**: task completes as soon as the user selects a unit and clicks Create, regardless of whether they touched the due date or settings steps the tour walked them through.
- **Fix**: either drop the due-date/settings tour steps (they don't gate anything) or extend the sequence to require those data-tour elements too.

---

## 3. Spotlight `targetSelector` can never match

### 3.1 `instructor-add-quiz` quiz-block step — wrong selector family
- [spotlight-configs.ts](../.storybook/code/spotlight-configs.ts) targets `'[class*="QuizNode"], [class*="quiz-node"], [class*="quiz-block"]'`.
- The real element ([QuizComponent.jsx](../src/components/Editor3/components/QuizComponent.jsx#L130)) has `data-tour="quiz-block"` and CSS class `Editor-question` — **not** any class containing "QuizNode"/"quiz-node"/"quiz-block". "QuizNode" is the Lexical node class name, not a DOM class.
- The `[class*="quiz-block"]` alternative also won't match since there is no such CSS class (only the data-tour attribute matches, and it isn't listed in the selector).
- **Result**: this step's spotlight can never highlight the actual quiz block; it will sit in the "waiting for element" state forever.
- **Fix**: change the selector to `'[data-tour="quiz-block"]'`.

### 3.2 `instructor-setup-class` join-code step — dead fallback selector
- [spotlight-configs.ts](../.storybook/code/spotlight-configs.ts) targets `'[data-tour="join-code"], [class*="joinCode"]'`.
- The real element ([SectionsClient.jsx](../app/[locale]/sections/SectionsClient.jsx#L588)) has no class containing "joinCode" — only the `data-tour="join-code"` attribute.
- **Result**: works today only because the first half of the selector matches; the `[class*="joinCode"]` half is dead code that implies a robustness that doesn't exist.
- **Fix**: drop the dead fallback (`'[data-tour="join-code"]'` alone is sufficient and accurate).

---

## 4. `interactable: true` steps that can never receive a qualifying click

Recall the click-advance rule in SpotlightOverlay: for `interactable` steps, only `button`/`[role="button"]`/`[type="submit"]` clicks advance the tour — clicks on `input`/`textarea`/`select` are explicitly ignored.

### 4.1 `learner-use-chat-help` → `chat-input` step
- targetSelector includes `textarea, input[placeholder*="message"]` with `interactable: true`.
- A user typing/clicking in the textarea will never trigger the advance — the click handler explicitly filters out form fields for interactable steps, and there is no button in this selector to click instead.
- **Result: tour stalls on this step** unless the user happens to also click the (separate) send button, which is not part of the targetSelector so its click doesn't fire the listener at all.
- **Fix**: target the send button (or add a `data-tour` on it), not the textarea, if the intent is "type and send."

### 4.2 `instructor-create-assignment` → `due-date` step
- targetSelector includes `input[type="date"], input[type="datetime-local"]` with `interactable: true`.
- Same issue — clicking/focusing a date input never advances the step.
- **Fix**: remove `interactable: true` (a plain click on the input should be allowed to advance, there's no risk of a stray "submit" here), or retarget to a "confirm date" affordance if one exists.

### 4.3 `instructor-use-ai-assistant` → `chat-sidebar` step
- targetSelector is the whole `[data-tour="chat-sidebar"]` container with `interactable: true`.
- Unlike 4.1/4.2 this one is intentional-looking (don't advance on every stray click inside the sidebar) but there's no button inside the tracked selector for the user to actually press to advance — so this also stalls unless the user clicks something incidental that also happens to be a `<button>` inside that container.
- **Fix**: confirm there's a specific action button inside the sidebar meant to trigger advancement, and note it explicitly (e.g. via a comment or narrower selector), otherwise drop `interactable`.

---

## 5. Copy that assumed Storybook UI context inside app-focused tasks

### 5.1 `instructor-add-quiz` — first two steps teach Storybook mechanics, not the app
- [spotlight-configs.ts](../.storybook/code/spotlight-configs.ts) opens with "Welcome to Storybook" (sidebar) and "Toolbar & Preview" steps before getting to the actual quiz-block instructions.
- Every task in this system currently starts with these same two generic Storybook-orientation steps (this is a repeated pattern across ~20 tasks, not unique to this one) — flagged here because it's most jarring on tasks whose instructions are 100% app-workflow focused (open unit → insert → configure quiz).
- **Not necessarily wrong** (first-time users may need Storybook orientation once), but it repeats on every single task rather than being shown once. Consider gating the two Storybook-orientation steps behind a "seen it before" flag instead of repeating them per-task.

### 5.2 Quiz mode's `normalizeQuizSteps` keeps the Storybook-orientation steps
- [spotlight-configs.ts](../.storybook/code/spotlight-configs.ts) `normalizeQuizSteps` picks `steps.filter(...)[0]` as the one step to keep, after filtering out steps matching `/did you complete|mark complete|complete if|verify|successfully created\?/i`.
- The Storybook-orientation steps ("Welcome to Storybook", "Toolbar & Preview") don't match that filter, so if they happen to be `steps[0]`/`nonVerify[0]`, quiz mode's single displayed step could end up being generic Storybook orientation instead of the actual task instruction.
- **Fix**: filter should also exclude steps whose `id` starts with `storybook-` before picking the "primary" step, so quiz mode always shows the actual task-relevant instruction.

---

## 6. Skip / Back buttons (explicitly called out — now fixed)

### 6.1 "Skip" label didn't match its behavior
- `handleSpotlightSkip` in OnboardingPanel.tsx closes the entire spotlight overlay and emits a `task-skipped` event — i.e. it abandons the whole task, not just the current step. There is no "skip this one step" affordance anywhere.
- **Fix applied**: renamed the button to **"Skip Task"** in [SpotlightOverlay.tsx](../.storybook/components/SpotlightOverlay.tsx) so the label matches the actual behavior.

### 6.2 "Back" button was decoupled from real completion progress
- Real task-completion tracking (`domSequenceProgress` in [task-completion.ts](../.storybook/code/task-completion.ts#L171-L229)) advances purely from real clicks on `data-tour` elements in the app, independent of which spotlight step is currently displayed. It is **not** reset or affected by the spotlight's Back button.
- This means Back does not "undo" anything real — it only redisplays an earlier step's tooltip copy while the actual completion sequence has already moved ahead. That's not a functional deadlock (the earlier subagent-drafted version of this audit over-stated it as one), but it is confusing: the tour can show "Step 1: click X" again after the user already did X and the system is waiting for "Y".
- Since forward advancement is now driven entirely by real clicks on target elements (no manual "Next" for target-based steps, per the current design), there's no meaningful action for "Back" to perform — going back can't re-trigger the real action, and re-reading an already-completed step's instructions has no value.
- **Fix applied**: removed the Back button entirely from SpotlightOverlay, OnboardingPanel's `handleSpotlightBack`, and the `onBack` prop.

---

## 7. Story ID naming inconsistencies

- [route-map.ts](../.storybook/code/route-map.ts) and most of spotlight-configs.ts use emoji-prefixed story IDs (e.g. `📄-pages-application-pages--sections`).
- [QuizMode.tsx](../.storybook/components/QuizMode.tsx) `TASK_NAVIGATION` mixes emoji-prefixed IDs with plain ones (e.g. `help-keyboard-shortcut-trainer--default`), and at least one entry (`instructor-learn-shortcuts` / `learner-learn-shortcuts`) points to a different story ID than the `tutorialStoryId` used for the same task in `onboarding-tasks.ts` (`🏠-getting-started-keyboard-shortcuts--default`).
- **Result**: depending on which code path drives navigation (OnboardingPanel's spotlight-driven flow vs. QuizMode's direct links), the user can land on two different stories for what's nominally the same task.
- **Fix**: pick one canonical story ID per task and reference it from both files (ideally source both from `onboarding-tasks.ts`'s `completionCriteria` instead of duplicating IDs in QuizMode.tsx).

---

## Summary table

| # | Task(s) | Category | Severity |
|---|---------|----------|----------|
| 1.1 | instructor-create-vocabulary | Uncompletable — wrong data-tour target | Critical |
| 1.2 | learner-practice-vocabulary | Uncompletable in quiz mode | Critical |
| 2.1 | learner-review-feedback | Completes on wrong action | High |
| 2.2 | instructor-create-assignment | Completes before guided steps finish | Medium |
| 3.1 | instructor-add-quiz | Spotlight can never find target | High |
| 3.2 | instructor-setup-class | Dead fallback selector | Low |
| 4.1 | learner-use-chat-help | Tour stalls on interactable form field | High |
| 4.2 | instructor-create-assignment | Tour stalls on interactable form field | High |
| 4.3 | instructor-use-ai-assistant | Tour may stall on interactable container | Medium |
| 5.1 | all tutorial tasks | Repeated Storybook-orientation steps | Low (UX) |
| 5.2 | all quiz tasks | Quiz mode may show orientation copy instead of task instruction | Medium |
| 6.1 | all tasks | Skip label mismatch | Fixed |
| 6.2 | all tasks | Back button decoupled from real progress | Fixed (removed) |
| 7 | *-learn-shortcuts, secret-* | Inconsistent story IDs across QuizMode/spotlight-configs | Medium |

## Recommended next actions (not yet implemented)
1. Fix the two uncompletable tasks (1.1, 1.2) — either add the missing `data-tour` attribute or repoint the sequence/story.
2. Fix `learner-review-feedback`'s completion sequence (2.1) to require an actual grade/feedback view.
3. Fix the `quiz-block` selector (3.1) and drop the dead `joinCode` fallback (3.2).
4. Remove `interactable: true` (or retarget selectors) on the three stalling steps (4.1–4.3).
5. Exclude `storybook-`-prefixed steps from `normalizeQuizSteps`'s "primary step" selection (5.2).
6. Consolidate story IDs so QuizMode.tsx and spotlight-configs.ts never diverge for the same task (7).

---

## Implementation update (2026-09-05)

All MISSING items from the plan-implementation audit were implemented and verified against source:

- **1.1 / 1.2** Added `data-tour="word-card"` to `WordRowComponent`'s root element in [DictionaryEditor2.jsx](../src/components/DictionaryEditor2.jsx). Since `Unit Detail`'s Dictionary tab renders the same `DictionaryEditor2` component ([TabsVerticalLeft.jsx](../src/components/Editor3/components/TabsVerticalLeft.jsx#L282)), this fixes both tasks in both tutorial and quiz mode without needing a story remap.
- **2.1** `learner-review-feedback`'s completion sequence changed from the duplicate-of-`learner-view-assignments` sequence to `["grades-tab", "grade-detail"]`. Also discovered and fixed a **previously unflagged bug**: the tutorial spotlight steps themselves targeted `[data-tour="my-grades"]` and `[data-tour="grade-card"]`, neither of which exist anywhere in the codebase — retargeted to the real `grades-tab` / `grade-detail` attributes from [GradeHistory.jsx](../src/components/Editor3/components/GradeHistory.jsx).
- **2.2** `instructor-create-assignment`'s completion sequence was both incomplete *and* in the wrong order (`unit-selector` before `create-assignment-button`, but the dialog opens via the button first). Corrected to `["create-assignment-button", "unit-selector", "due-date-picker", "assignment-settings"]`, matching the actual tour order and all 4 described instructions.
- **3.1** `quiz-block` selector fixed to `'[data-tour="quiz-block"]'`.
- **3.2** Dead `[class*="joinCode"]` fallback removed.
- **4.1** `chat-input` step (in `learner-use-chat-help`) retargeted to the message Send button. Added `data-tour="chat-send"` to the real send `<Button>` in [ChatSidebar.jsx](../src/components/ChatSidebar.jsx) (it only had `data-testid` before). Completion sequence updated from `["chat-input"]` to `["chat-send"]` since clicking into the input didn't prove a question was actually sent.
- **4.2** `due-date` step: removed `interactable: true` (no risk of a stray submit on a date input).
- **4.3** `chat-sidebar` step (in `instructor-use-ai-assistant`) had the same issue as 4.1 — retargeted to `chat-send`, same completion-sequence fix applied.
- **5.2 — corrected, not a real bug.** Re-verified before implementing: `normalizeQuizSteps` receives each task's own hand-written `quizSteps` array (e.g. `challenge`/`verify`), **not** the `tutorialSteps` array that contains the `storybook-*` orientation steps. Those two arrays are never mixed, so there was no actual leak. No code change made; the original finding is withdrawn.
- **7** Replaced the entire hand-maintained `TASK_NAVIGATION` map in [QuizMode.tsx](../.storybook/components/QuizMode.tsx) (which used a stale, different Storybook category taxonomy — `📚-creating-lessons-*`, `🧩-components-*` — for nearly every entry) with a computed URL sourced directly from each task's own `completionCriteria` (`quizStoryId`/`tutorialStoryId`/`storyId`) via the already-imported `findTaskById`. This permanently prevents this file from drifting out of sync with `onboarding-tasks.ts` again. The "alternatives" links (which had no equivalent source of truth) were dropped rather than left stale.

Also fixed while implementing 4.1/4.3 (not separately itemized before): `learner-use-chat-help` and `instructor-use-ai-assistant` both had `completionSequence: ["chat-input"]`, which only required focusing/clicking the input field, not sending a message — updated to `["chat-send"]` for both.

