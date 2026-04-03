# Storybook Mock Data Remediation Plan

Audit date: 2026-04-02  
Audited: 67 story files across `src/`, `.storybook/`

## Executive Summary

Multiple story files have broken mock data wiring that causes different story variants to render identically. The most critical issue is a **JavaScript duplicate key bug** in `ChatSidebar.stories.jsx` that silently discards `initializeMockData: false` from 13 stories, allowing the global mock initializer to overwrite custom chat data.

### Git History Findings

Git forensics identified **three commits** that introduced or worsened the issues:

| Commit    | Message                          | What Happened                                                                                                                                                                                         |
| --------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `f80ce9b` | "repair tests"                   | Added `parameters: { initializeMockData: false }` to 13 ChatSidebar stories **without checking** that each already had a `parameters: { docs: {...} }` block — creating duplicate keys in every story |
| `4d91b78` | "Better use of context in tests" | **Stripped all SectionContext decorators** from SectionAssigner.stories.jsx — removed the default sections mock AND the `NoSections` empty-state decorator, making Default and NoSections identical   |
| `dbd54cf` | "bugs"                           | Deleted 2 RecordingStudio3 stories (`GuidedTutorial`, `ScriptEditorDemo`), 5 EditorComponents image stories, and 1 AnswerPlugin.audio-drawing `FeatureDocumentation` story                            |

The MeaningAssociation `*Completed` variants were **never properly wired** — they've been placeholder stubs since the original `77650f9` ("editor stories") commit.

---

## 🔴 CRITICAL — Fix 1: ChatSidebar.stories.jsx Duplicate `parameters` Keys

**File**: `src/components/ChatSidebar.stories.jsx`  
**Impact**: 13 of 14 stories render with generic mock data instead of their unique chat conversations  
**Root cause**: JavaScript object literal duplicate key — the second `parameters:` key silently overwrites the first

### The Bug

Every story except `GettingStarted` has **two `parameters` keys** in the same object literal:

```js
export const TranslationHelper = {
  // ...
  parameters: {                        // ← FIRST: sets initializeMockData: false
    initializeMockData: false,
  },
  decorators: [
    (Story) => {
      seedMockAssistantChats([...]);   // Seeds unique chat data
      return <Story />;
    }
  ],
  parameters: {                        // ← SECOND: overwrites the first!
    docs: {
      description: {
        story: '...',
      },
    },
  },
  render: () => (
    <TabProvider>
      <ChatSidebar />
    </TabProvider>
  ),
};
```

Per JS spec, the second `parameters` wins. The `initializeMockData: false` flag is lost, so `.storybook/preview.jsx` runs `initializeMockData()` + `initializeGen2MockData()` globally, which overwrites the custom `seedMockAssistantChats()` data injected by each decorator.

### Affected Stories (13)

| Export                        | What it should show                        | What it actually shows    |
| ----------------------------- | ------------------------------------------ | ------------------------- |
| `TranslationHelper`           | Japanese greeting translation conversation | Generic/default mock data |
| `ContentCreation`             | Lesson plan creation dialogue              | Generic/default mock data |
| `WithFileAttachments`         | PDF upload + analysis options              | Generic/default mock data |
| `QuizGenerator`               | Quiz creation with tool call preview       | Generic/default mock data |
| `AnswerBlockGenerator`        | Answer block creation tool call            | Generic/default mock data |
| `MeaningAssociationGenerator` | Meaning association creation tool call     | Generic/default mock data |
| `CustomAnswerGenerator`       | Custom answer creation tool call           | Generic/default mock data |
| `GrammarExplainer`            | Grammar explanation conversation           | Generic/default mock data |
| `ConversationHistory`         | Multi-turn conversation history            | Generic/default mock data |
| `ToolCallSearch`              | Search tool call with results              | Generic/default mock data |
| `ToolCallCreateUnit`          | Create unit tool call                      | Generic/default mock data |
| `ToolCallGenerateContent`     | Generate content multi-tool call           | Generic/default mock data |
| `ToolCallMultiStep`           | Multi-step tool workflow                   | Generic/default mock data |

### Fix

Merge the two `parameters` blocks into one for each affected story:

```js
export const TranslationHelper = {
  // ...
  decorators: [...],
  parameters: {
    initializeMockData: false,           // ← preserved
    docs: {
      description: {
        story: '...',
      },
    },
  },
  render: () => (
    <TabProvider>
      <ChatSidebar />
    </TabProvider>
  ),
};
```

Repeat for all 13 stories listed above.

---

## 🔴 CRITICAL — Fix 2: SectionAssigner.stories.jsx — Decorators Stripped

**File**: `src/components/SectionAssigner.stories.jsx`  
**Impact**: All stories lost their `SectionContext` mock data; `Default` and `NoSections` render identically  
**Root cause**: Commit `4d91b78` ("Better use of context in tests") deleted both the file-level decorator AND the `NoSections` per-story decorator

### What Was Removed (commit `4d91b78`)

The file originally had (from commit `ac594c3`):

1. A **file-level decorator** providing `SectionContext.Provider` with 2 mock sections + 1 mock assignment
2. A **per-story decorator** on `NoSections` providing `SectionContext.Provider` with `sections: []`

Both were deleted, leaving all three stories with identical args and no context data.

### Fix

Restore the decorators from commit `ac594c3`. The original code was:

```js
import SectionContext from "../context/sectionContext";

export default {
  // ...
  decorators: [
    (Story) => {
      const mockSections = [
        {
          id: "section-1",
          name: "Period 1 - French 101",
          description: "Morning class, 9:00 AM",
          learner: "student-123",
          owner: "teacher-1",
        },
        {
          id: "section-2",
          name: "Period 2 - French 101",
          description: "Afternoon class, 2:00 PM",
          learner: "student-456",
          owner: "teacher-1",
        },
      ];
      const mockSectionMap = {
        "section-1": mockSections[0],
        "section-2": mockSections[1],
      };
      const mockAssignments = [
        {
          id: "assignment-1",
          unitID: "unit-123",
          sectionID: "section-1",
          learner: "student-123",
          dueDate: "2025-12-25T10:00:00.000Z",
        },
      ];
      return (
        <SectionContext.Provider
          value={{
            sections: mockSections,
            sectionMap: mockSectionMap,
            assignments: mockAssignments,
          }}
        >
          <Story />
        </SectionContext.Provider>
      );
    },
  ],
};

export const NoSections = {
  // ...
  decorators: [
    (Story) => (
      <SectionContext.Provider
        value={{ sections: [], sectionMap: {}, assignments: [] }}
      >
        <Story />
      </SectionContext.Provider>
    ),
  ],
};
```

---

## 🟠 SERIOUS — Fix 3: MeaningAssociation `*Completed` Stories Show Fresh Exercises

**File**: `src/components/MeaningAssociationExercise/MeaningAssociation.stories.jsx`  
**Impact**: 3 "Completed" variants render identically to their active counterparts  
**Affected**: `EasyExerciseCompleted`, `HardExerciseCompleted`, `LearnExerciseCompleted`  
**Origin**: Never properly wired — placeholder stubs since original commit `77650f9`

### The Bug

The "Completed" variants differ from their base stories **only** by changing `nodeKey`:

```js
// EasyExercise
<Easy nodeKey="easy-1" wordIDs={['1', '2', '3', '4']} />

// EasyExerciseCompleted — only nodeKey differs, shows same fresh exercise
<Easy nodeKey="easy-2" wordIDs={['1', '2', '3', '4']} />
```

The shared `UnitContext` decorator sets `grade: { data: null }` for all stories, so none show completion state.

### Fix

The `*Completed` stories need a decorator override that provides grade data with `complete: true` answers for those word IDs. The mock `UnitContext` should include:

```js
grade: {
  data: JSON.stringify({
    "easy-2": {
      complete: true,
      accuracy: 100,
      // ... matched pairs data
    },
  });
}
```

**Action**:

1. Check how `Easy`, `Hard`, `Learn` components read grade data and determine completion state
2. Create per-story decorators for the 3 Completed variants that override the `UnitContext` `grade.data` field with pre-populated answers
3. If the component also checks `showUnitComplete`, set that to `true` as well

---

## 🟠 SERIOUS — Fix 4: TranslationMode `Default` ≡ `AuthNamespace`

**File**: `.storybook/TranslationMode.stories.tsx`  
**Impact**: Two stories render identically

### The Bug

```ts
export const Default: Story = {
  args: { namespace: "auth", storyName: "Translation Mode/Demo/Default" },
};

export const AuthNamespace: Story = {
  args: {
    namespace: "auth",
    storyName: "Translation Mode/Demo/Auth Namespace",
  },
};
```

Both use `namespace: 'auth'` — the `storyName` difference only affects metadata.

### Fix Options

**Option A** — Make `Default` use a different namespace (e.g., `'common'`) or no namespace:

```ts
export const Default: Story = {
  args: { namespace: "common", storyName: "Translation Mode/Demo/Default" },
};
```

**Option B** — Remove `Default` and rename `AuthNamespace` as the primary story (since the component docs already serve as a default).

**Option C** — If there's no `'common'` namespace, remove the duplicate `Default` story since `AuthNamespace` already covers it.

---

## 🟡 MINOR — Fix 5: KeyboardShortcutTrainer `Default` ≡ `InDocumentation`

**File**: `src/stories/KeyboardShortcutTrainer.stories.tsx`  
**Impact**: Two stories render identically — `InDocumentation` only adds docs text

### The Bug

```ts
export const Default: Story = {}; // No configuration

export const InDocumentation: Story = {
  parameters: {
    docs: { description: { story: "..." } }, // Only adds docs description
  },
};
```

Both render the same `KeyboardShortcutTrainer` with no visual difference.

### Fix Options

**Option A** — Give `InDocumentation` a wrapper that simulates the documentation page embedding context (different container, padding, background, etc.)

**Option B** — Remove `InDocumentation` since it provides no visual differentiation (the `Mobile` variant is the only meaningful alternative already).

---

## 🟡 MINOR — Fix 6: VocabularyReview2 Commented-Out Mock Helpers

**File**: `src/components/VocabularyReview2.stories.tsx`  
**Impact**: Unused code — no stories are currently broken, but richer mock data is disabled

### What Was Disabled

Starting around line 135, a large block is commented out:

- `createMockVocabulary(count, options)` — generates configurable vocabulary arrays
- `createMockParsedContent(vocabItems)` — creates mock parsed content with summaries and objectives
- `createMockDocument()` — creates mock document metadata

These contain rich Japanese photosynthesis vocabulary data that is NOT available through the current `createVocabularyLoader()` helper.

### Assessment

The current stories (`Default`, `WithSearchHighlight`, `LargeList`, `AlreadyImported`, etc.) function correctly using `createVocabularyLoader()`. The commented-out helpers may have been from a previous iteration.

### Fix

**Option A** — Delete the commented-out code if `createVocabularyLoader` covers all needed scenarios (clean up dead code).

**Option B** — Uncomment and use for additional stories that test richer data scenarios (summaries, objectives, longer vocab lists with the photosynthesis theme).

---

## 🟡 MINOR — Fix 7: AutocompletePlugin Stories Lack Visible Differentiation

**File**: `src/components/Editor3/plugins/AutocompletePlugin.stories.jsx`  
**Impact**: Both stories require user interaction to see any difference

### The Bug

```js
export const EditableEmpty = {
  render: () => <EditableTemplate editorState={null} />,
};

export const EditableWithInstructions = {
  render: () => <EditableTemplate editorState={sampleAutocompleteState} />,
};
```

`EditableWithInstructions` pre-fills text explaining how autocomplete works, but no autocomplete suggestions are visible until the user types. The two stories look nearly identical in static rendering (empty editor vs. editor with explanation text).

### Fix

Add a `play` function to `EditableWithInstructions` that types a partial word to trigger visible autocomplete suggestions, or add a third story `WithActiveSuggestion` that uses `play` to demonstrate the feature.

---

## Summary Checklist

| #   | Priority    | File                                  | Fix                                                | Effort                             |
| --- | ----------- | ------------------------------------- | -------------------------------------------------- | ---------------------------------- |
| 1   | 🔴 CRITICAL | `ChatSidebar.stories.jsx`             | Merge duplicate `parameters` keys in 13 stories    | Medium — mechanical but 13 stories |
| 2   | 🔴 CRITICAL | `SectionAssigner.stories.jsx`         | Restore SectionContext decorators (from `ac594c3`) | Small — code exists in git history |
| 3   | 🟠 SERIOUS  | `MeaningAssociation.stories.jsx`      | Add grade data decorators for 3 Completed variants | Medium — need to check component   |
| 4   | 🟠 SERIOUS  | `TranslationMode.stories.tsx`         | Differentiate `Default` from `AuthNamespace`       | Small                              |
| 5   | 🟡 MINOR    | `KeyboardShortcutTrainer.stories.tsx` | Differentiate or remove `InDocumentation`          | Small                              |
| 6   | 🟡 MINOR    | `VocabularyReview2.stories.tsx`       | Clean up or reuse commented-out mock helpers       | Small                              |
| 7   | 🟡 MINOR    | `AutocompletePlugin.stories.jsx`      | Add play function to show active suggestions       | Small                              |

---

## 🟠 SERIOUS — Deleted Stories to Restore

Commit `dbd54cf` ("bugs") deleted functional stories. These should be evaluated for restoration:

### RecordingStudio3.stories.jsx — 2 stories deleted

| Story              | What it demonstrated                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| `GuidedTutorial`   | Step-by-step tutorial walkthrough with `TutorialBanner` component, progress tracking across 5 steps |
| `ScriptEditorDemo` | Lexical-based screenplay editor with undo/redo, update logging, and formatted guide                 |

Both used `TutorialBanner` and `KeyboardShortcuts` imports that were also removed. Check if those components still exist before restoring.

**Restore from**: `git show dbd54cf^:src/components/RecordingStudio3.stories.jsx`

### EditorComponents.stories.jsx — 5 image stories deleted

| Story             | What it showed               |
| ----------------- | ---------------------------- |
| `ImageAbstract`   | Abstract art image rendering |
| `ImageRhinoceros` | Wildlife photo rendering     |
| `ImageNamibia`    | Landscape photo rendering    |
| `ImagePattern`    | Pattern/texture rendering    |
| `ImageCormorant`  | Bird photo rendering         |

These were individual image showcase variants. May have been removed because they used large embedded images.

**Restore from**: `git show dbd54cf^:src/components/Editor3/components/EditorComponents.stories.jsx`

### AnswerPlugin.audio-drawing.stories.jsx — 1 documentation story deleted

| Story                  | What it showed                                                                   |
| ---------------------- | -------------------------------------------------------------------------------- |
| `FeatureDocumentation` | Rich documentation/showcase component explaining audio & drawing answer features |

This was a `FeatureShowcase` component with detailed feature descriptions. Low priority to restore.

---

## Git History Timeline

For reference, the key commits affecting story quality in chronological order:

```
77650f9 editor stories          — MeaningAssociation *Completed variants created as stubs (never wired)
ac594c3 Storybook               — SectionAssigner stories created WITH proper SectionContext decorators
4d91b78 Better use of context   — SectionAssigner decorators STRIPPED (Default + NoSections now identical)
dbd54cf bugs                    — 8 stories DELETED (RecordingStudio3, EditorComponents, AnswerPlugin)
3dd4317 consolidate             — Imports changed from @storybook/test → vitest (later reverted)
f80ce9b repair tests            — initializeMockData: false ADDED to ChatSidebar BUT as duplicate keys
386b5f3 bug squashing           — Imports changed back to storybook/test (correct)
```

---

### Stories NOT Affected (Verified Working)

The following story files were verified to have properly differentiated variants:

- `Workbook.stories.jsx` — 5 stories with unique loaders
- `Editor.stories.jsx` — 9 stories with unique loaders/content
- `RecordingStudio3.stories.jsx` — 7 stories with different mock scripts
- `QuestionsReview2.stories.tsx` — 13 stories with different loaders
- `ModerationPanel.stories.jsx` — 8 stories with different mock items
- `ModerationBadge.stories.jsx` — 8 stories with different args
- `MainToolbar.stories.jsx` — 5 stories with different components
- `PdfThumbnail.stories.tsx` — 11 stories with different args
- `QuestionBlock.stories.jsx` — 3 stories with different args
- `PermissionErrorOverlay.stories.jsx` — 6 stories with different args
- `ContentPreview.stories.tsx` — 8 stories with different args
- `SearchResults.stories.jsx` — 14 stories with different args
- `ToolCallPreview.stories.tsx` — 8 stories with different args
- `VirtualizedMessageList.stories.jsx` — 9 stories with different args
- `AudioWaveformPlayer.stories.jsx` — 11 stories with different args
- `EditorComponents.stories.jsx` — 12 stories with different content
- `SpotlightOverlay.stories.tsx` — 5 stories with different args
- All Editor3 plugin stories (LayoutPlugin, QuizPlugin, AnswerPlugin, etc.) — properly differentiated
- `DebugPanel/` stories — all properly differentiated with different args
- `AIFeedbackWidget.stories.jsx` — 6 stories with different args
