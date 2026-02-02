# Onboarding System - Tutorial & Quiz Modes

Comprehensive onboarding system with two learning modes: **Tutorial Mode** (guided demos) and **Quiz Mode** (hands-on practice).

## Overview

- **Tutorial Mode**: Interactive demos embedded in documentation next to instructions
- **Quiz Mode**: Full-page embedded stories where users complete actual tasks
- **Action Tracking**: Automatic detection of user actions (clicks, form submissions, etc.)
- **Task Completion**: Automated task marking based on completion criteria
- **Progress Persistence**: LocalStorage-based progress tracking
- **Mode Switcher**: Toggle between modes in the Onboarding panel

## Architecture

```
.storybook/
├── components/
│   ├── TutorialStep.tsx          # Tutorial mode component
│   ├── TutorialStep.css
│   ├── QuizMode.tsx              # Quiz mode component (NO progress UI)
│   ├── QuizMode.css
│   ├── OnboardingPanel.tsx       # GLOBAL PROGRESS TRACKING (sidebar widget)
│   └── OnboardingGuide.jsx       # Checklist-based guide
├── code/
│   ├── onboarding-events.ts      # Event emitter system
│   ├── onboarding-tasks.ts       # Task definitions
│   ├── action-tracker.ts         # Action tracking utilities
│   ├── route-map.ts              # App-to-Storybook route mapping
│   ├── task-completion.ts        # Auto-completion logic
│   └── useOnboarding.ts          # React hooks
└── preview.jsx                   # Global action tracking decorator

src/stories/
├── Onboarding.mdx                # Main onboarding documentation
└── LearningModes.stories.tsx     # Example stories
```

**Key Principle**: `OnboardingPanel` (sidebar widget) is the **single source of truth** for all progress tracking. TutorialStep and QuizMode emit events; OnboardingPanel displays progress globally.

## Usage

### Tutorial Mode

Embed interactive demos next to documentation sections:

```tsx
import TutorialStep from '@storybook-components/TutorialStep';
import { Button, TextField } from '@mui/material';

<TutorialStep
  stepId="instructor-create-unit"
  title="Create a Unit"
  description="Build your first learning module"
  demoComponent={
    <div>
      <TextField label="Unit Title" />
      <Button onClick={() => console.log('Created!')}>
        Create Unit
      </Button>
    </div>
  }
  quizStoryId="pages-units--default"
  completionMode="manual"
/>
```

**Props**:
- `stepId`: Unique ID matching task in onboarding-tasks.ts
- `title`: Step title shown to user
- `description`: What the user will learn
- `demoComponent`: Interactive React component to demo
- `quizStoryId`: Story ID to navigate to in quiz mode
- `completionMode`: `'manual'` (user clicks complete) or `'auto'` (completes on render)

### Quiz Mode

Directs users to the **Application Pages** section to practice with the actual app. **Progress tracked by OnboardingPanel sidebar widget.**

```tsx
import QuizMode from '@storybook-components/QuizMode';

export const QuizExample: StoryObj = {
  render: () => (
    <QuizMode
      taskId="instructor-create-unit"
      requiredActions={['onClick:create-button', 'onSubmit:unit-form']}
    />
  ),
  parameters: {
    layout: 'fullscreen',
  },
};
```

**Props**:
- `taskId`: Task ID to complete
- `requiredActions`: Array of actions that complete the task (optional - for auto-completion)
- `onComplete`: Callback when task completed

**What QuizMode Shows**:
- Task instructions card with steps
- **Task-specific navigation button** (navigates to relevant component story based on task ID)
- Alternative story links for additional practice options
- Hint pointing to sidebar for progress tracking
- Completion banner when done

**Where Users Practice**:
Users are directed to **specific component stories** based on their task:
- **Units task** → `📄 Pages → Units`, `Creating Lessons → Editor`
- **Sections task** → `📄 Pages → Sections`, `Components → Section Assigner`
- **Quiz task** → `Creating Lessons → Editor → Quiz Plugin`
- **Vocabulary task** → `Creating Lessons → Editor → Word Block Plugin`
- **AI task** → `Components → Chat Sidebar`, `Editor → AI Content Completion`
- **Keyboard shortcuts** → `Help → Keyboard Shortcuts Trainer`

Each task has a primary story link and optional alternative stories for different practice approaches.

See [INSTRUCTOR_QUIZ_MODE_NAVIGATION.md](../../docs/INSTRUCTOR_QUIZ_MODE_NAVIGATION.md) for complete task-to-story mapping.

**What QuizMode Does NOT Show**:
- ❌ Progress bars (sidebar handles this)
- ❌ N/M action counters (sidebar handles this)
- ❌ Embedded iframes (users navigate to actual stories)
- ❌ Floating progress trackers (sidebar handles this)

## Action Tracking

All Storybook action handlers automatically emit onboarding events:

```typescript
// preview.jsx automatically tracks these:
onClick, onChange, onSubmit, onClose, onOpen, 
onSelect, onDelete, onAdd, onRemove, onToggle,
onHover, onFocus, onBlur, onSave, onCancel, etc.
```

Actions are logged and can trigger task completion.

## Task Definitions

Add completion criteria to tasks in `onboarding-tasks.ts`:

```typescript
{
  id: 'instructor-create-unit',
  title: 'Create Your First Unit',
  description: 'Build interactive learning content',
  instructions: [
    'Go to the Units page',
    'Click "Create New Unit"',
    'Enter a title',
    'Save your unit',
  ],
  persona: 'instructor',
  category: 'Content Creation',
  order: 2,
  estimatedTime: 600,
  
  // NEW: Completion criteria for auto-detection
  completionCriteria: {
    storyId: 'pages-units--default',
    requiredActions: ['onClick:create-unit-button'],
  },
}
```

## Mode Switcher

Users can toggle between Tutorial and Quiz modes in the Onboarding panel:

1. Open Onboarding panel (bottom of screen)
2. Select a persona (Instructor/Learner/Developer)
3. Click "Tutorial" or "Quiz" chip to switch modes
4. **In Tutorial mode**: See guided demos embedded in documentation
5. **In Quiz mode**: Click on tasks to navigate to interactive component stories for hands-on practice

**Quiz Mode Instructions** (shown in panel when active):
> 🎯 Quiz Mode Active  
> Click on tasks below to navigate to interactive component stories. Each task will direct you to the specific Storybook story where you can practice. Complete actions to track progress automatically.

The panel checkboxes are **illustrative only** - they update automatically when you complete actions in the app. You cannot manually check/uncheck them.

**Task-Specific Navigation**:
Each task in Quiz Mode has:
- **Primary story link**: Main component/page for practicing the task
- **Alternative links** (optional): Additional stories for different practice approaches

Example: "Create Your First Unit" task provides:
- Primary: `📄 Pages → Units`
- Alternatives: `Creating Lessons → Editor`, `Unit Detail`

See [INSTRUCTOR_QUIZ_MODE_NAVIGATION.md](../../docs/INSTRUCTOR_QUIZ_MODE_NAVIGATION.md) for the complete navigation guide.

## Route Mapping

Links in stories automatically navigate within Storybook:

```typescript
// route-map.ts
{
  route: '/untis',
  storyId: 'pages-units--default',
  title: 'Units Page',
}
```

Clicking a Next.js Link navigates to the corresponding story instead of throwing errors.

## Event Flow
sidebar widget listens for event
   ↓
7. Sidebar updates:
   - Progress bar (X%)
   - Task checkbox (✓)
   - Completion percentage
   ↓
8. LocalStorage persists completion state
```

**Important**: Progress is ONLY shown in the OnboardingPanel sidebar widget. Individual components (TutorialStep, QuizMode) emit events but do NOT display global progress.↓
2. Action handler wrapped by createTrackableActions()
   ↓
3. Emits 'action-performed' event with metadata
   ↓
4. task-completion.ts checks if action satisfies criteria
   ↓
5. If yes, emits 'task-completed' event
   ↓
6. OnboardingPanel updates progress bar
   ↓
7. LocalStorage persists completion state
```

## Hooks

```typescript
import { useCompleteTask, useTrackTask, useOnboardingStatus } from '@storybook-code/useOnboarding';

// Auto-complete when component mounts
useCompleteTask('task-id', 'instructor');

// Manual tracking
const { startTask, completeTask, skipTask } = useTrackTask('task-id');

// Get status
const { persona, isCompleted, getCompletionPercentage } = useOnboardingStatus();
```

## Examples

See `src/stories/LearningModes.stories.tsx` for complete examples:

- **TutorialModeExample**: Single tutorial step with demo
- **QuizModeExample**: Full quiz mode with action tracking
- **MultipleTutorialSteps**: Chained workflow (create section → unit → assignment)
- **AutoCompleteTutorial**: Step that completes on view

## Testing

1. Start Storybook: `npm run storybook`
2. Navigate to "Onboarding/Learning Modes"
3. Try the example stories
4. Open Onboarding panel and select a persona
5. Complete steps and verify:
   - Progress bar updates
   - Tasks marked complete
   - LocalStorage persisted
   - Mode switcher works

## Advanced: Custom Completion Logic

For complex multi-step flows:

```typescript
import { trackActionsAsTaskComplete } from '@storybook-code/action-tracker';

// Task completes when ALL actions performed
trackActionsAsTaskComplete(
  ['onClick:create', 'onChange:title', 'onSubmit:form'],
  'instructor-create-unit'
);
```

## Troubleshooting

**Task not completing**:
- Check `completionCriteria` in onboarding-tasks.ts
- Verify `requiredActions` match action names
- Open DevTools console - look for `[Action Tracker]` logs
- Ensure persona selected in Onboarding panel

**Tutorial component not rendering**:
- Import TutorialStep from `@storybook-components/TutorialStep`
- Check webpack alias in `.storybook/main.ts`
- Verify stepId matches task ID

**Quiz mode not tracking**:
- Ensure story has trackable actions in args
- Check iframe can communicate with parent (same origin)
- Verify `requiredActions` array is correct

## Future Enhancements

- [ ] Sequence-based completion (actions must occur in order)
- [ ] Time-based completion (spend N seconds on page)
- [ ] Multi-story workflows (navigate through multiple pages)
- [ ] Achievement system with badges
- [ ] Leaderboard for completion speed
- [ ] Export progress as certificate

---

**Version**: 1.0.0  
**Author**: ExcitingTheory  
**License**: MIT
