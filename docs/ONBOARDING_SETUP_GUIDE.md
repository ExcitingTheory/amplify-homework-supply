# Custom Onboarding System - Quick Setup Guide

## What's New

A complete custom onboarding system for Storybook has been created that tracks user progress across three personas: **Instructors**, **Learners**, and **Developers**.

## Key Features

✅ **Three Personas**: Separate onboarding journeys for different user roles
✅ **Event System**: Components emit events when tasks are completed
✅ **Progress Tracking**: Tasks are marked complete and progress is persisted
✅ **Interactive Panel**: Right-side panel in Storybook shows tasks and progress
✅ **React Hooks**: Easy integration with components
✅ **Auto-Detection**: Hooks automatically detect when users reach task screens
✅ **Local Storage**: Progress is saved and restored across sessions

## Files Created

### Core System
- `.storybook/code/onboarding-events.ts` - Event emitter and singleton instance
- `.storybook/code/onboarding-tasks.ts` - 20+ predefined tasks for all personas
- `.storybook/code/useOnboarding.ts` - React hooks for task tracking

### Addon Files
- `.storybook/code/myOnboarding/preset.js` - Addon entry point
- `.storybook/code/myOnboarding/manager.tsx` - Storybook UI registration
- `.storybook/code/myOnboarding/preview.tsx` - Preview configuration
- `.storybook/code/myOnboarding/index.js` - Module export
- `.storybook/code/myOnboarding/README.md` - Addon documentation

### UI Components
- `.storybook/components/OnboardingPanel.jsx` - Right-side panel component
- `.storybook/components/OnboardingPanel.css` - Panel styling

### Documentation & Examples
- `docs/ONBOARDING_SYSTEM.md` - Complete documentation with examples
- `src/stories/OnboardingExamples.stories.tsx` - Story examples showing usage

## Quick Start

### Using in a Component

```typescript
import { useCompleteTask } from '../.storybook/code/useOnboarding';

export const SetupClassPage = () => {
  // Auto-mark task as complete when this component loads
  useCompleteTask('instructor-setup-class', 'instructor');

  return <div>Setup Form...</div>;
};
```

### Using Event Emitter Directly

```typescript
import { getOnboardingEmitter } from '../.storybook/code/onboarding-events';

const emitter = getOnboardingEmitter();

// Emit completion event
emitter.emit({
  type: 'task-completed',
  taskId: 'instructor-create-unit',
  persona: 'instructor',
  timestamp: Date.now(),
});

// Listen for events
const unsubscribe = emitter.on((event) => {
  console.log('Task completed:', event.taskId);
});
```

## How It Works

1. **User opens Storybook** → Onboarding panel appears on the right
2. **User selects a persona** (Instructor, Learner, or Developer)
3. **Panel shows tasks for that role** organized by category
4. **Components emit events** when tasks are completed
5. **Progress updates in real-time** as checkmarks appear
6. **Data persists** in localStorage - refreshing keeps progress

## Task Count by Persona

- **Instructor**: 7 tasks (Setting up classes, creating content, grading)
- **Learner**: 6 tasks (Joining class, completing assignments, reviewing feedback)
- **Developer**: 8 tasks (Understanding architecture, setup, running tests)

## Integration

### In Stories
```typescript
// src/components/MyComponent.stories.tsx
import { useCompleteTask } from '../.storybook/code/useOnboarding';

export const InstructorFlow: StoryObj = {
  render: () => {
    useCompleteTask('instructor-setup-class', 'instructor');
    return <MyComponent />;
  },
};
```

## Available React Hooks

### useCompleteTask
Auto-detect task completion when component mounts.

```typescript
useCompleteTask(taskId, persona?, condition?)
```

### useTrackTask
Manually track task progress with callbacks.

```typescript
const { startTask, completeTask, skipTask } = useTrackTask(taskId, persona?);
```

### useOnboardingStatus
Get current onboarding status.

```typescript
const { persona, isCompleted, getCompletionPercentage, reset } = useOnboardingStatus();
```

## Testing the System

### View Example Stories
1. Open Storybook
2. Navigate to **"Onboarding/Task Completion Examples"**
3. View examples:
   - Auto-detect task completion
   - Manual task tracking
   - Display onboarding status
   - Event emission monitoring

### Manual Testing
1. Open Storybook
2. Right-side panel shows "Onboarding"
3. Select "Instructor" persona
4. See 7 instructor tasks listed
5. Check/uncheck tasks to mark complete
6. View progress bar update
7. Refresh page - progress persists
8. Click "Reset Progress" to clear data

## Customizing Tasks

Add new tasks in `.storybook/code/onboarding-tasks.ts`:

```typescript
const newTask: OnboardingTask = {
  id: 'instructor-advanced-grading',
  title: 'Set Up Advanced Grading',
  description: 'Configure custom rubrics',
  instructions: ['Step 1', 'Step 2', 'Step 3'],
  persona: 'instructor',
  category: 'Assessment',
  order: 8,
  estimatedTime: 300,
};
```

## Event Monitoring

Monitor all events in the browser console:

```typescript
import { getOnboardingEmitter } from '../.storybook/code/onboarding-events';

getOnboardingEmitter().on((event) => {
  console.log('[Onboarding]', event.type, event.taskId, event.persona);
});
```

Or use the **Event Emission Example** story for a live event monitor UI.

## localStorage Schema

Data is stored under key: `storybook_onboarding_progress`

```json
{
  "completedTasks": [
    ["instructor:task-id", { event data }]
  ],
  "currentPersona": "instructor",
  "timestamp": 1674123456789
}
```

## Documentation

- **Full Docs**: [docs/ONBOARDING_SYSTEM.md](../../docs/ONBOARDING_SYSTEM.md)
- **Addon Info**: [.storybook/code/myOnboarding/README.md](.storybook/code/myOnboarding/README.md)
- **Examples**: [src/stories/OnboardingExamples.stories.tsx](../../src/stories/OnboardingExamples.stories.tsx)

## What's Next?

To fully leverage the system:

1. **Add task detection to pages** - Use `useCompleteTask` hook in page components
2. **Add task detection to components** - Use `useTrackTask` hook in form submissions
3. **Test with actual users** - Monitor events to see which tasks users complete
4. **Iterate on task descriptions** - Update based on user feedback
5. **Create analytics dashboard** - Export event data for analysis

## Troubleshooting

### Panel not showing?
- Verify `.storybook/main.ts` has addon registered:
  ```js
  addons: [
    path.resolve(__dirname, './code/myOnboarding/preset.js')
  ]
  ```
- Restart Storybook with `npm run storybook`

### Tasks not being marked complete?
- Check console for errors
- Verify `useCompleteTask` or `useTrackTask` is imported correctly
- Ensure taskId exists in `ONBOARDING_TASKS`
- Check browser localStorage for `storybook_onboarding_progress`

### Progress not persisting?
- Check if localStorage is enabled in browser
- Look for errors in browser console
- Try "Reset Progress" and start again

## Support

For questions or issues, refer to:
1. Full documentation in `docs/ONBOARDING_SYSTEM.md`
2. Example stories in `src/stories/OnboardingExamples.stories.tsx`
3. Addon README in `.storybook/code/myOnboarding/README.md`
