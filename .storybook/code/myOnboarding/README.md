# Custom Onboarding Addon

A custom Storybook addon for Homework Supply that tracks user onboarding progress across three personas: Instructors, Learners, and Developers.

## Files

- **preset.js** - Main addon preset entry point
- **manager.tsx** - Storybook UI (right panel)
- **preview.tsx** - Preview configuration
- **index.js** - Module export

## Related Files

- [onboarding-events.ts](../onboarding-events.ts) - Event emitter and types
- [onboarding-tasks.ts](../onboarding-tasks.ts) - Task definitions
- [useOnboarding.ts](../useOnboarding.ts) - React hooks
- [OnboardingPanel.jsx](../../components/OnboardingPanel.jsx) - UI component
- [ONBOARDING_SYSTEM.md](../../../docs/ONBOARDING_SYSTEM.md) - Full documentation

## Quick Start

### For Users

1. Open Storybook
2. Look for "Onboarding" panel on the right side
3. Select your role (Instructor, Learner, or Developer)
4. Complete tasks as you explore the platform

### For Developers

Add event tracking to your components:

```typescript
import { useCompleteTask } from '../code/useOnboarding';

export const MyComponent = () => {
  // Auto-mark task as complete when component loads
  useCompleteTask('task-id', 'instructor');

  return <div>Content</div>;
};
```

Or emit custom events:

```typescript
import { getOnboardingEmitter } from '../code/onboarding-events';

const emitter = getOnboardingEmitter();
emitter.emit({
  type: 'task-completed',
  taskId: 'my-task',
  persona: 'instructor',
  timestamp: Date.now(),
});
```

## Architecture

```
[User selects persona] 
       ↓
[Onboarding Panel]
       ↓
[Persona-specific tasks shown]
       ↓
[Components emit events]
       ↓
[Progress tracked & persisted]
       ↓
[localStorage updated]
```

## Event Flow

1. **Persona Selection**: User selects role in OnboardingPanel
2. **Event Emission**: Components/hooks emit events via `getOnboardingEmitter()`
3. **Event Handling**: Emitter broadcasts to all listeners
4. **Progress Update**: Panel listens for events and updates UI
5. **Persistence**: Completion data stored in localStorage
6. **Reload**: On page refresh, data is restored from localStorage

## Data Structure

### Event Object
```typescript
{
  type: 'task-completed' | 'task-started' | 'task-skipped' | 'persona-selected',
  taskId: string,
  persona: 'instructor' | 'learner' | 'developer',
  timestamp: number,
  metadata?: Record<string, any>
}
```

### localStorage Key
```
storybook_onboarding_progress
```

## Task Categories

### Instructor Tasks
- Getting Started (1)
- Content Creation (3)
- Content Management (1)
- Assignments (1)
- Assessment (1)
- AI Tools (1)

### Learner Tasks
- Getting Started (1)
- Coursework (2)
- Progress (1)
- Practice (1)
- Learning Support (1)

### Developer Tasks
- Onboarding (2)
- Architecture (2)
- AI Features (1)
- Codebase (1)
- Development (2)

## Testing the Onboarding System

### Manual Testing
1. Open Storybook
2. Navigate to "Onboarding/Task Completion Examples" stories
3. Test each example:
   - Auto-detect task completion
   - Manual task tracking
   - Display onboarding status
   - Event emission monitoring

### Testing in Components
```typescript
import { useCompleteTask } from '../code/useOnboarding';

export const TestComponent = () => {
  useCompleteTask('instructor-setup-class', 'instructor');
  return <div>Test</div>;
};
```

Then:
1. Open Storybook
2. Select "Instructor" persona in Onboarding panel
3. Navigate to TestComponent story
4. Verify task appears as completed

## Debugging

Monitor all events in the browser console:

```typescript
import { getOnboardingEmitter } from '../code/onboarding-events';

const emitter = getOnboardingEmitter();
emitter.on((event) => console.log('[Onboarding]', event));
```

Or use the "Event Emission Example" story to see events in real-time.

## localStorage API

```typescript
import { getOnboardingEmitter } from '../code/onboarding-events';

const emitter = getOnboardingEmitter();

// Get current persona
emitter.getPersona(); // 'instructor' | 'learner' | 'developer' | null

// Check if task is complete
emitter.isTaskCompleted('task-id', 'instructor'); // true | false

// Get completion percentage
emitter.getCompletionPercentage('instructor', ONBOARDING_TASKS); // 0-100

// Get all completed tasks for persona
emitter.getCompletedTasks('instructor'); // OnboardingEvent[]

// Reset all data
emitter.reset();
```

## Contributing

### Adding a New Task

1. Add task to `ONBOARDING_TASKS` array in [onboarding-tasks.ts](../onboarding-tasks.ts)
2. Use unique `id` (format: `persona-action-topic`)
3. Set appropriate `persona` ('instructor' | 'learner' | 'developer')
4. Organize by `category`
5. Include clear `instructions`

### Adding Task Detection

1. Import `useCompleteTask` or `useTrackTask` hook
2. Add to component that represents the task goal
3. Pass unique `taskId` and `persona`
4. Test in Storybook with Onboarding panel open

## References

- [Full Documentation](../../../docs/ONBOARDING_SYSTEM.md)
- [Example Stories](../../../src/stories/OnboardingExamples.stories.tsx)
- [Onboarding Page](../../../src/stories/Onboarding.mdx)
