# Adding a Component to Storybook Onboarding

This guide explains how to register a new component (or page) as an onboarding task so users are guided through it in both **Tutorial** and **Quiz** modes, with automatic progress tracking.

## Architecture Overview

```
onboarding-tasks.ts          ← Task definitions (what to learn)
onboarding-events.ts         ← Event emitter singleton (state + persistence)
task-completion.ts            ← Auto-completion detector (matches actions to tasks)
action-tracker.ts             ← Wraps Storybook actions with tracking
spotlight-configs.ts          ← Step-by-step spotlight overlays per task
OnboardingPanel.tsx           ← UI panel (mode toggle, task list, progress)
manager.tsx                   ← Storybook addon registration + story-change detection
preview.jsx                   ← Global decorator that wires action tracking
```

### Data Flow

```
User clicks button in a story
  → preview.jsx decorator wraps the action handler
  → action-tracker.ts emits { type: 'action-performed', actionName, storyId }
  → task-completion.ts listener picks up the event
  → Checks current mode (tutorial/quiz) from emitter
  → Picks tutorialStoryId or quizStoryId from task's completionCriteria
  → If storyId AND actionName match → emits task-completed
  → OnboardingPanel + sidebar widget update reactively
  → Progress persisted to localStorage
```

## Step-by-Step: Add a New Onboarding Task

### 1. Define the Task in `onboarding-tasks.ts`

Open `.storybook/code/onboarding-tasks.ts` and add an entry to the `ONBOARDING_TASKS` array under the appropriate persona section.

```typescript
{
  id: 'instructor-record-audio',                    // Unique ID: {persona}-{verb}-{noun}
  title: 'Record Audio for a Lesson',                // Short display title
  description: 'Use the Recording Studio to create dialogue audio',
  instructions: [                                    // Tutorial mode step-by-step
    'Open the Recording Studio component',
    'Click "Add Speaker" to create a character',
    'Type dialogue text in the input field',
    'Click the microphone icon to generate audio',
    'Press play to preview',
    'Save when satisfied',
  ],
  persona: 'instructor',                             // 'instructor' | 'learner' | 'developer' | 'translator' | 'all'
  category: 'Content Creation',                      // Groups tasks in the panel UI
  order: 9,                                          // Sort order within persona
  estimatedTime: 480,                                // Seconds (shown as "~8 min")
  completionCriteria: {
    tutorialStoryId: '🎙️-recording-studio-recording-studio--coffee-shop-dialogue',
    quizStoryId: '📄-pages-application-pages--unit-detail',
    requiredActions: ['onClick', 'onSave'],          // OR logic — any one triggers completion
  },
},
```

#### Field Reference

| Field                | Required | Description                                                   |
| -------------------- | -------- | ------------------------------------------------------------- |
| `id`                 | Yes      | Unique string. Convention: `{persona}-{verb}-{noun}`          |
| `title`              | Yes      | Shown in the task card                                        |
| `description`        | Yes      | Subtitle text                                                 |
| `instructions`       | Yes      | Array of steps shown in Tutorial mode's expanded card         |
| `persona`            | Yes      | Which persona sees this task. Use `'all'` for universal tasks |
| `category`           | Yes      | Grouping label (e.g., "Getting Started", "Content Creation")  |
| `order`              | Yes      | Integer sort position within the persona                      |
| `estimatedTime`      | Yes      | Seconds. Displayed as `~N min`                                |
| `completionCriteria` | No       | Omit for manual-only tasks                                    |

#### Completion Criteria Options

```typescript
completionCriteria: {
  // Mode-specific story IDs (preferred)
  tutorialStoryId?: string;   // Story shown in Tutorial mode
  quizStoryId?: string;       // Story shown in Quiz mode
  storyId?: string;           // Legacy fallback for both modes

  // Action matching (OR logic — any single match completes the task)
  requiredActions?: string[];  // e.g., ['onClick', 'onCreate', 'onSave']

  // Sequence matching (AND logic — all actions must occur in order)
  requiredSequence?: string[]; // e.g., ['onClick', 'onSubmit']

  // Custom function (runs on each action event)
  customCheck?: () => boolean;
}
```

**How matching works:** When a user performs an action on a story, `task-completion.ts` checks:

1. Is the current story the expected one for the active mode (`tutorialStoryId` or `quizStoryId`)?
2. Does the action name appear in `requiredActions`?
3. Both must be true for auto-completion.

### 2. Find Your Story IDs

Story IDs match the sidebar path in kebab-case. To find the exact ID:

1. Navigate to the story in Storybook
2. Look at the URL: `?path=/story/📚-creating-lessons-editor--empty-editor-custom-blocks`
3. The story ID is everything after `/story/`: `📚-creating-lessons-editor--empty-editor-custom-blocks`

**Tutorial stories** should be component-level stories with interactive examples.
**Quiz stories** should be page-level stories where users practice in context.

### 3. Add Spotlight Steps (Optional but Recommended)

Open `.storybook/code/spotlight-configs.ts` and add a `SpotlightConfig` entry to the `SPOTLIGHT_CONFIGURATIONS` array:

```typescript
{
  taskId: 'instructor-record-audio',
  tutorialSteps: [
    {
      id: 'instructor-record-audio-intro',
      title: 'Recording Studio',
      description: 'This is where you create audio for your lessons.',
      targetSelector: '[data-tour="recording-studio"]',  // Optional: highlight a DOM element
      tooltipPosition: 'bottom',
      actions: [
        'The Recording Studio lets you create dialogue audio',
        'You can use text-to-speech or record your own voice',
      ],
    },
    {
      id: 'instructor-record-audio-add-speaker',
      title: 'Add a Speaker',
      description: 'Use the Add Speaker option to create a character.',
      targetSelector: '[data-tour="add-speaker-button"]',
      tooltipPosition: 'right',
    },
    {
      id: 'instructor-record-audio-complete',
      title: 'Great Job!',
      description: 'You now know how to create audio. Your progress is saved automatically.',
      tooltipPosition: 'center',
      isLast: true,
    },
  ],
  quizSteps: [
    {
      id: 'instructor-record-audio-quiz-intro',
      title: 'Your Turn',
      description: 'Record a short dialogue on your own.',
      tooltipPosition: 'center',
    },
    {
      id: 'instructor-record-audio-quiz-complete',
      title: 'Done?',
      description: 'Your actions are tracked automatically. Move on when ready.',
      tooltipPosition: 'center',
      isLast: true,
    },
  ],
},
```

If you skip this step, default intro/complete steps are generated automatically by `getDefaultSteps()`.

#### Adding `data-tour` Attributes

For spotlight steps that highlight specific UI elements, add `data-tour` attributes to the component JSX:

```jsx
<Button data-tour="add-speaker-button" onClick={handleAddSpeaker}>
  Add Speaker
</Button>
```

### 4. Wire Action Tracking (Usually Automatic)

The global decorator in `preview.jsx` automatically wraps these Storybook action names with tracking:

```
onClick, onChange, onSubmit, onClose, onOpen, onSelect,
onDelete, onAdd, onRemove, onToggle, onHover, onFocus,
onBlur, onSave, onCancel, onEdit, onUpdate, onCreate
```

**If your component uses one of these as a prop**, it already works — no additional wiring needed.

**If your component has a custom action name** (e.g., `onRecord`), you have two options:

**Option A:** Map it to an existing tracked action in your story:

```typescript
export const Default: Story = {
  args: {
    onRecord: fn(), // Will show in Actions panel but won't auto-track
    onSave: fn(), // This one IS tracked — use for completion
  },
};
```

**Option B:** Add the custom action to the tracker. In `.storybook/code/action-tracker.ts`, add it to the `actionNames` array in `createTrackableActions()`:

```typescript
const actionNames = [
  "onClick",
  // ... existing actions ...
  "onRecord", // ← Add your custom action
];
```

Then also add it to the `parameters.actions.args` and the decorator in `preview.jsx`.

### 5. Add Route Mapping (For Page Stories)

If your task links to a page story that corresponds to a Next.js route, add the mapping in `.storybook/code/route-map.ts`:

```typescript
export const ROUTE_TO_STORY_MAP: Record<string, string> = {
  // ... existing routes ...
  "/recording-studio": "?path=/story/recording-audio-recording-studio--default",
};
```

This enables the mock Next.js router to intercept navigation links and redirect within Storybook.

## Tutorial vs Quiz Mode

| Aspect                 | Tutorial Mode                         | Quiz Mode                          |
| ---------------------- | ------------------------------------- | ---------------------------------- |
| **Purpose**            | Guided learning                       | Self-assessment                    |
| **Story used**         | `tutorialStoryId` (component-level)   | `quizStoryId` (page-level)         |
| **Instructions**       | Full step list shown in expanded card | Brief reminder only                |
| **Spotlight**          | Detailed steps with highlights        | Minimal intro/complete             |
| **Completion**         | Action on tutorial story              | Action on quiz story               |
| **Task-started event** | Emitted when story is navigated to    | Emitted when story is navigated to |

Both modes share the same `requiredActions` — only the story they must occur on differs.

## Testing Your Task

### Manual Testing

1. Run `npm run storybook`
2. Open the **Onboarding** panel tab at the bottom
3. Select a persona that includes your task
4. Toggle between Tutorial and Quiz mode
5. Click your task card — verify it navigates to the correct story
6. Perform the required action in the story
7. Confirm the task auto-completes (check appears, progress bar updates)
8. Click **Reset Progress** and try in the other mode

### Browser E2E

Onboarding browser tests live with the Playwright journeys. Add a test case there:

```typescript
it("should auto-complete instructor-record-audio task", () => {
  // Select instructor persona
  cy.get('[data-testid="onboarding-panel"]').within(() => {
    cy.contains("Instructor").click();
  });

  // Navigate to the tutorial story
  cy.visitStory("🎙️-recording-audio-recording-studio--coffee-shop-dialogue");

  // Perform the required action
  cy.contains("Add Speaker").click();

  // Verify task completed
  cy.get('[data-testid="onboarding-panel"]').within(() => {
    cy.contains("Record Audio for a Lesson")
      .closest('[data-testid="task-item"]')
      .find('input[type="checkbox"]')
      .should("be.checked");
  });
});
```

### Console Debugging

Open browser DevTools and watch for these log messages:

```
[Action Tracker] { action: 'onClick', story: '...', persona: 'instructor' }
[Task Completion] [tutorial] Action onClick on story X matches task instructor-record-audio
[Task Completion] Auto-completing task: instructor-record-audio (mode: tutorial)
```

If a task isn't completing, check:

- Is the story ID in the URL exactly matching `tutorialStoryId` / `quizStoryId`?
- Is the action name in `requiredActions`?
- Is a persona selected? (Actions are ignored without a persona.)
- Is the task already completed? (Won't fire twice.)

## File Quick Reference

| File                                        | What to Edit                                |
| ------------------------------------------- | ------------------------------------------- |
| `.storybook/code/onboarding-tasks.ts`       | Task definitions                            |
| `.storybook/code/spotlight-configs.ts`      | Spotlight guided steps                      |
| `.storybook/code/action-tracker.ts`         | Custom action names                         |
| `.storybook/code/route-map.ts`              | Next.js ↔ Storybook route links             |
| `.storybook/code/onboarding-events.ts`      | Emitter (rarely needs changes)              |
| `.storybook/code/task-completion.ts`        | Matching logic (rarely needs changes)       |
| `.storybook/components/OnboardingPanel.tsx` | Panel UI                                    |
| `.storybook/code/myOnboarding/manager.tsx`  | Addon registration + story-change detection |
| `preview.jsx`                               | Global decorator (action wrapping)          |
