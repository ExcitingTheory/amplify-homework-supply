# Custom Onboarding System

This document describes the custom Storybook onboarding system for Homework Supply, which tracks task completion across three user personas: **Instructors**, **Learners**, and **Developers**.

## Overview

The onboarding system provides:

- **Persona-based task tracking** - Separate onboarding journeys for each user role
- **Event emission** - Components can emit events to track when users complete tasks
- **Progress persistence** - Completion data stored in localStorage
- **Interactive UI panel** - Right-side panel in Storybook showing tasks and progress
- **Automatic detection** - React hooks to auto-detect when users reach certain screens
- **Customizable tasks** - 20+ predefined tasks with instructions and time estimates

## Three Personas

### 1. Instructor
Educators and content creators who build courses and manage students.

**Sample Tasks:**
- Set Up Your First Class
- Create Your First Unit
- Add a Quiz Block
- Add Vocabulary Words
- Assign Work to Students
- View Student Grades
- Use AI to Generate Content

### 2. Learner
Students who join classes, view assignments, and submit work.

**Sample Tasks:**
- Join Your First Class
- View Your Assignments
- Complete an Assignment
- Review Your Feedback
- Practice Vocabulary
- Get Help from AI Assistant

### 3. Developer
Developers who need to understand the codebase and set up their environment.

**Sample Tasks:**
- Explore Component Documentation
- Understand the Editor System
- Learn DataStore Patterns
- Review AI Integration
- Set Up Development Environment
- Explore Project Structure
- Run Tests and Linting
- Customize Storybook Setup

## Event System

The event system is built on a pub/sub pattern in `[.storybook/code/onboarding-events.ts](.storybook/code/onboarding-events.ts)`.

### Event Types

```typescript
type OnboardingEvent = {
  type: 'task-started' | 'task-completed' | 'task-skipped' | 'persona-selected';
  taskId: string;
  persona: 'instructor' | 'learner' | 'developer';
  timestamp: number;
  metadata?: Record<string, any>;
};
```

### Emitting Events

Components can emit events using the event emitter:

```typescript
import { getOnboardingEmitter } from '../code/onboarding-events';

const emitter = getOnboardingEmitter();

// Emit a completion event
emitter.emit({
  type: 'task-completed',
  taskId: 'instructor-setup-class',
  persona: 'instructor',
  timestamp: Date.now(),
  metadata: { method: 'manual_form_submission' },
});

// Subscribe to events
const unsubscribe = emitter.on((event) => {
  console.log('Event received:', event);
});

// Unsubscribe when done
unsubscribe();
```

## React Hooks

Three custom hooks are provided for integration with React components:

### useCompleteTask

Automatically mark a task as complete when a component mounts.

```typescript
import { useCompleteTask } from '../code/useOnboarding';

export const SetupClassScreen = () => {
  // Automatically mark task as complete when this component loads
  useCompleteTask('instructor-setup-class', 'instructor');

  return <div>Setup Class Form...</div>;
};
```

**Parameters:**
- `taskId` (string) - ID of the task
- `persona` (UserPersona, optional) - Specific persona (uses current if not provided)
- `condition` (boolean, optional) - Conditional flag to control when task is marked complete

### useTrackTask

Manually track task progress with start/complete/skip events.

```typescript
import { useTrackTask } from '../code/useOnboarding';

export const CreateUnitScreen = () => {
  const { startTask, completeTask, skipTask } = useTrackTask(
    'instructor-create-unit',
    'instructor'
  );

  const handleFormStart = () => startTask();
  const handleFormSubmit = () => {
    completeTask({ method: 'form_submission', unitCount: 1 });
  };
  const handleCancel = () => skipTask('User cancelled form');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleFormSubmit();
      }}
    >
      <button onClick={handleFormStart}>Start</button>
      <button onClick={handleCancel}>Cancel</button>
    </form>
  );
};
```

**Returns:**
- `startTask()` - Emit a task-started event
- `completeTask(metadata?)` - Emit a task-completed event
- `skipTask(reason?)` - Emit a task-skipped event

### useOnboardingStatus

Get current onboarding status and progress.

```typescript
import { useOnboardingStatus } from '../code/useOnboarding';
import { ONBOARDING_TASKS } from '../code/onboarding-tasks';

export const ProgressDashboard = () => {
  const status = useOnboardingStatus();

  return (
    <div>
      <p>Current Role: {status.persona}</p>
      <p>Completion: {status.getCompletionPercentage(ONBOARDING_TASKS)}%</p>
      <button onClick={status.reset}>Reset Progress</button>
    </div>
  );
};
```

**Returns:**
- `persona: UserPersona | null` - Current selected persona
- `isCompleted(taskId)` - Check if a task is complete
- `getCompletionPercentage(allTasks)` - Get completion percentage
- `reset()` - Clear all onboarding data

## Adding Tasks

Define new tasks in [.storybook/code/onboarding-tasks.ts](.storybook/code/onboarding-tasks.ts):

```typescript
import { OnboardingTask, UserPersona } from './onboarding-events';

const myNewTask: OnboardingTask = {
  id: 'instructor-advanced-grading',
  title: 'Set Up Advanced Grading',
  description: 'Configure custom rubrics for assessment',
  instructions: [
    'Step 1: ...',
    'Step 2: ...',
    'Step 3: ...',
  ],
  persona: 'instructor',
  category: 'Assessment',
  order: 8,
  estimatedTime: 300, // seconds
};

// Add to ONBOARDING_TASKS array
```

### Task Properties

- **id** - Unique identifier (used for event tracking)
- **title** - Short task name displayed in UI
- **description** - One-line summary
- **instructions** - Step-by-step instructions
- **persona** - 'instructor' | 'learner' | 'developer' | 'all'
- **category** - Group for organizing tasks (e.g., "Getting Started", "Content Creation")
- **order** - Display order within category
- **estimatedTime** - Time estimate in seconds

## Integration Points

### In Next.js Pages

```typescript
// pages/sections.js
import { useCompleteTask } from '../.storybook/code/useOnboarding';

export default function SectionsPage() {
  // Auto-detect when instructor views sections
  useCompleteTask('instructor-setup-class', 'instructor');

  return <SectionsList />;
}
```

### In Components

```typescript
// src/components/CreateUnitForm.jsx
import { useTrackTask } from '../.storybook/code/useOnboarding';

export function CreateUnitForm() {
  const { startTask, completeTask } = useTrackTask('instructor-create-unit');

  const handleSubmit = async (formData) => {
    startTask();
    try {
      await saveUnit(formData);
      completeTask({ unitName: formData.title });
    } catch (error) {
      // Handle error
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### In Stories

```typescript
// src/components/SectionManager.stories.tsx
import { useCompleteTask } from '../.storybook/code/useOnboarding';

export const InstructorWorkflow: StoryObj = {
  render: () => {
    useCompleteTask('instructor-setup-class', 'instructor');
    return <SectionManager />;
  },
};
```

## Accessing Event Data

Events are persistent in localStorage under the key `storybook_onboarding_progress`:

```typescript
// Access raw data
const data = JSON.parse(
  localStorage.getItem('storybook_onboarding_progress') || '{}'
);

// Programmatic access
import { getOnboardingEmitter } from '../code/onboarding-events';

const emitter = getOnboardingEmitter();
const instructor = emitter.getCompletedTasks('instructor');
const completionPercent = emitter.getCompletionPercentage('instructor', ONBOARDING_TASKS);
```

## UI Components

### OnboardingPanel

The main UI component (located in [.storybook/components/OnboardingPanel.jsx](.storybook/components/OnboardingPanel.jsx)) appears as a right panel in Storybook and displays:

- **Persona selector** - Choose role
- **Progress bar** - Visual completion percentage
- **Task list** - Organized by category with checkboxes
- **Quick stats** - Completed vs remaining tasks
- **Reset button** - Clear all progress

### Panel Behavior

1. **First load**: Shows persona selection screen
2. **Persona selected**: Shows tasks organized by category
3. **Tasks completed**: UI reflects completion with checkbox
4. **Progress tracked**: localStorage automatically updated
5. **Panel follows state**: UI updates in real-time as events are emitted

## Example Usage Flow

### For an Instructor

1. Opens Storybook
2. Onboarding panel prompts for role selection
3. Selects "Instructor" persona
4. Panel shows 7 instructor tasks
5. User navigates to "Sections" page
6. `useCompleteTask` hook automatically marks first task complete
7. Panel shows "1/7 tasks completed - 14%"
8. User creates a section via form
9. Component emits `task-completed` event
10. Panel updates to "2/7 tasks completed - 28%"
11. Progress persists in localStorage
12. On refresh, progress is restored

### For a Developer

1. Reads "Technical Overview" page
2. Panel auto-marks "Explore Component Documentation" task
3. Navigates through code examples
4. Visits Editor stories
5. Panel auto-marks "Understand Editor System" task
6. Completes additional tasks manually or via auto-detection
7. Achieves 100% onboarding completion
8. Sees celebration/completion message

## Event Monitoring

To monitor all onboarding events in development:

```typescript
import { getOnboardingEmitter } from '../code/onboarding-events';

const emitter = getOnboardingEmitter();

emitter.on((event) => {
  console.log('[Onboarding Event]', {
    type: event.type,
    task: event.taskId,
    persona: event.persona,
    time: new Date(event.timestamp).toLocaleTimeString(),
    metadata: event.metadata,
  });
});
```

Or view the "Onboarding/Task Completion Examples" → "Event Emission Example" story in Storybook for a live event monitor.

## localStorage Schema

```json
{
  "storybook_onboarding_progress": {
    "completedTasks": [
      ["instructor:instructor-setup-class", { "type": "task-completed", ... }],
      ["instructor:instructor-create-unit", { "type": "task-completed", ... }]
    ],
    "currentPersona": "instructor",
    "timestamp": 1674123456789
  }
}
```

## Testing

### Manual Testing

1. Open Storybook
2. Select a persona in the Onboarding panel
3. Check tasks appear
4. Click checkboxes and verify localStorage updates
5. Refresh and verify progress persists
6. Click "Reset Progress" and verify data clears

### Automated Testing

```typescript
import { getOnboardingEmitter, getOnboardingEmitter } from '../code/onboarding-events';

describe('Onboarding System', () => {
  it('emits events correctly', () => {
    const emitter = getOnboardingEmitter();
    const events: any[] = [];

    const unsubscribe = emitter.on((e) => events.push(e));

    emitter.setPersona('instructor');
    emitter.emit({
      type: 'task-completed',
      taskId: 'test-task',
      persona: 'instructor',
      timestamp: Date.now(),
    });

    expect(events.length).toBe(2); // persona-selected + task-completed
    expect(emitter.isTaskCompleted('test-task', 'instructor')).toBe(true);

    unsubscribe();
    emitter.reset();
  });
});
```

## Future Enhancements

- [ ] Analytics dashboard to view user journey data
- [ ] Guided tour overlays on actual UI
- [ ] Timed reminders for incomplete tasks
- [ ] Achievements/badges for milestones
- [ ] Export event logs for user research
- [ ] A/B testing different task orderings
- [ ] Conditional task branching based on user choices
