# Spotlight Overlay Guide

**A guided tour system for the onboarding process**

## Overview

The Spotlight Overlay component creates an interactive guided tour experience with:
- **Semi-transparent overlay** (scrim) that dims non-focused content
- **Spotlight effect** that highlights specific UI elements
- **Contextual tooltips** with step-by-step instructions
- **Navigation controls** for user-paced learning
- **Two modes**: Tutorial (detailed guidance) and Quiz (self-assessment)

## Architecture

### Components

1. **`SpotlightOverlay`** ([.storybook/components/SpotlightOverlay.tsx](.storybook/components/SpotlightOverlay.tsx))
   - Core component that renders the overlay and tooltip
   - Handles positioning, animations, and user interactions
   - Integrates with Storybook preview iframe

2. **`OnboardingPanel`** ([.storybook/components/OnboardingPanel.tsx](.storybook/components/OnboardingPanel.tsx))
   - Integration point for onboarding tasks
   - Generates spotlight steps from task definitions
   - Manages spotlight state and navigation

3. **Task Definitions** ([.storybook/code/onboarding-tasks.ts](.storybook/code/onboarding-tasks.ts))
   - Defines onboarding tasks with completion criteria
   - Includes story IDs for navigation
   - Step-by-step instructions for tutorial mode

## How It Works

### User Flow

1. **User selects a persona** (Instructor, Learner, Developer)
2. **User clicks on a task** in the OnboardingPanel
3. **Spotlight opens** with introduction step
4. **System navigates** to the relevant story (if available)
5. **User completes steps** using Next/Skip buttons
6. **Task is marked complete** upon finishing

### Tutorial vs Quiz Mode

#### Tutorial Mode (📖)
- **Full instructions**: Detailed step-by-step guidance
- **Educational**: Teaches users how to use features
- **Examples visible**: Shows documentation and examples
- **Completion**: User marks when ready

**Example:**
```typescript
{
  id: 'create-unit',
  title: 'Create Your First Unit',
  description: 'Build interactive learning content',
  actions: [
    'Navigate to Units page',
    'Click "Create New Unit"',
    'Enter a title',
    'Add content in the editor',
    'Save your unit'
  ]
}
```

#### Quiz Mode (🎯)
- **Minimal guidance**: Brief reminders only
- **Self-assessment**: Tests user knowledge
- **Interactive demos**: Navigates to working examples
- **Challenge**: User completes task independently

**Example:**
```typescript
{
  id: 'create-unit',
  title: 'Create Your First Unit',
  description: 'Try creating a unit on your own'
  // No detailed actions in quiz mode
}
```

## Spotlight Steps

### Step Structure

```typescript
interface SpotlightStep {
  id: string;                    // Unique step identifier
  title: string;                 // Step headline
  description: string;           // Explanation text
  targetSelector?: string;       // CSS selector for highlighted element
  targetPosition?: {             // Manual positioning (alternative to selector)
    top: number;
    left: number;
    width: number;
    height: number;
  };
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  actions?: string[];            // Step-by-step instructions (tutorial mode)
  isLast?: boolean;              // Indicates final step
}
```

### Automatic Step Generation

The `OnboardingPanel` generates steps automatically from tasks:

1. **Introduction Step**: Shows task title, description, and instructions
2. **Navigation Step**: Transitions to the relevant Storybook story
3. **Completion Step**: Confirms task completion

```typescript
const generateSpotlightSteps = (task: OnboardingTaskWithCriteria): SpotlightStep[] => {
  const steps: SpotlightStep[] = [];

  // Step 1: Introduction
  steps.push({
    id: `${task.id}-intro`,
    title: task.title,
    description: task.description,
    tooltipPosition: 'center',
    actions: mode === 'tutorial' ? task.instructions : undefined,
  });

  // Step 2: Navigation (if story exists)
  if (task.completionCriteria?.storyId) {
    steps.push({
      id: `${task.id}-navigate`,
      title: mode === 'tutorial' ? 'View Documentation' : 'Try It Out',
      description: 'Navigate to the interactive demo...',
      tooltipPosition: 'center',
    });
  }

  // Step 3: Completion
  steps.push({
    id: `${task.id}-complete`,
    title: 'Task Complete!',
    description: 'Great job!...',
    tooltipPosition: 'center',
    isLast: true,
  });

  return steps;
};
```

## Element Targeting

### CSS Selectors

Target elements in the main window or Storybook iframe:

```typescript
{
  targetSelector: '#create-button',
  tooltipPosition: 'right'
}
```

The component automatically detects if the element is in the Storybook preview iframe and adjusts positioning accordingly.

### Manual Positioning

For elements without selectors:

```typescript
{
  targetPosition: {
    top: 200,
    left: 300,
    width: 200,
    height: 100,
  },
  tooltipPosition: 'center'
}
```

### Center Screen (No Target)

For introductory or completion steps:

```typescript
{
  // No targetSelector or targetPosition
  tooltipPosition: 'center'
}
```

## Tooltip Positioning

The tooltip automatically positions itself relative to the highlighted element:

- **`right`**: To the right of the element (default)
- **`left`**: To the left of the element
- **`top`**: Above the element
- **`bottom`**: Below the element
- **`center`**: Center of the screen (for intro/completion steps)

The component includes fallback logic to keep tooltips in viewport:
- If `right` position goes off-screen, it flips to `left`
- If `bottom` position goes off-screen, it flips to `top`
- Tooltips are constrained to viewport with 10px padding

## Styling and Animation

### Overlay (Scrim)

```css
/* Semi-transparent black overlay */
fill: rgba(0, 0, 0, 0.6);  /* 60% opacity */
```

### Spotlight Effect

Uses SVG masking for clean cutout:

```xml
<mask id="spotlight-mask">
  <rect fill="white" />      <!-- Visible area -->
  <rect fill="black" />      <!-- Transparent area (spotlight) -->
</mask>
```

### Highlight Border

Animated border with pulsing glow:

```css
border: 3px solid #4CAF50;    /* Green for tutorial */
border: 3px solid #2196F3;    /* Blue for quiz */
box-shadow: 0 0 20px rgba(76, 175, 80, 0.4);
animation: pulse 2s ease-in-out infinite;
```

### Color Scheme

| Mode     | Primary Color | Use Case |
|----------|---------------|----------|
| Tutorial | `#4CAF50` (Green) | Borders, buttons, highlights |
| Quiz     | `#2196F3` (Blue)  | Borders, buttons, highlights |

## Integration with Onboarding System

### Event Tracking

The spotlight emits events through the onboarding event system:

```typescript
// Task completed via spotlight
emitter.emit({
  type: 'task-completed',
  taskId: activeTask.id,
  persona: selectedPersona,
  timestamp: Date.now(),
  metadata: { 
    completedViaSpotlight: true, 
    mode: 'tutorial' | 'quiz' 
  },
});

// Task skipped
emitter.emit({
  type: 'task-skipped',
  taskId: activeTask.id,
  persona: selectedPersona,
  timestamp: Date.now(),
  metadata: { skippedFromSpotlight: true },
});
```

### Task Click Handler

When a user clicks a task in the OnboardingPanel:

```typescript
const handleTaskClick = (task: OnboardingTaskWithCriteria) => {
  // Generate steps from task
  const steps = generateSpotlightSteps(task);
  
  // Open spotlight
  setSpotlightSteps(steps);
  setSpotlightCurrentStep(0);
  setSpotlightOpen(true);
};
```

### Story Navigation

The spotlight automatically navigates to Storybook stories:

```typescript
const handleNavigateToStory = (storyId: string) => {
  if (api?.selectStory) {
    api.selectStory(storyId);  // Use Storybook API
  } else {
    window.parent.location.href = `/?path=/story/${storyId}`;
  }
};
```

## Adding New Tasks with Spotlight

### Step 1: Define Task with Story ID

```typescript
// In .storybook/code/onboarding-tasks.ts
{
  id: 'my-new-task',
  title: 'Learn Feature X',
  description: 'Discover how to use Feature X',
  instructions: [
    'Step 1: Open the feature panel',
    'Step 2: Configure settings',
    'Step 3: Save your changes',
  ],
  persona: 'instructor',
  category: 'Getting Started',
  order: 5,
  estimatedTime: 300,
  completionCriteria: {
    storyId: 'components-featurex--default',  // Story to navigate to
    requiredActions: ['onClick', 'onSave'],
  },
}
```

### Step 2: Add Target Selectors to Story

```tsx
// In your component story
export const Default: StoryObj = {
  render: () => (
    <Box>
      <Button id="feature-x-button">  {/* Add ID for targeting */}
        Open Feature X
      </Button>
      <FeatureXPanel id="feature-x-panel" />
    </Box>
  ),
};
```

### Step 3: Create Custom Spotlight Steps (Optional)

For more control, generate custom spotlight steps:

```typescript
const customSteps: SpotlightStep[] = [
  {
    id: 'intro',
    title: 'Welcome to Feature X',
    description: 'Let\'s explore this powerful feature',
    tooltipPosition: 'center',
  },
  {
    id: 'open-panel',
    targetSelector: '#feature-x-button',
    title: 'Click to Open',
    description: 'Click this button to access Feature X',
    tooltipPosition: 'bottom',
    actions: ['Locate the button', 'Click it'],
  },
  {
    id: 'configure',
    targetSelector: '#feature-x-panel',
    title: 'Configure Settings',
    description: 'Adjust your preferences here',
    tooltipPosition: 'right',
    actions: ['Review options', 'Make selections', 'Save changes'],
  },
  {
    id: 'complete',
    title: 'All Done!',
    description: 'You\'ve mastered Feature X',
    tooltipPosition: 'center',
    isLast: true,
  },
];
```

## Best Practices

### 1. Keep Steps Focused
- **One action per step** - Don't overwhelm users
- **Clear titles** - Use action verbs ("Create", "Configure", "Review")
- **Concise descriptions** - 1-2 sentences maximum

### 2. Logical Progression
- **Start general, get specific** - Intro → Feature → Details → Complete
- **Build on previous steps** - Each step should relate to the last
- **Provide context** - Explain why this step matters

### 3. Effective Targeting
- **Use semantic IDs** - `#create-button` not `#btn-1`
- **Test in iframe** - Verify selectors work in Storybook preview
- **Fallback gracefully** - Center tooltip if element not found

### 4. Mode-Appropriate Content
- **Tutorial**: Full instructions, explanations, examples
- **Quiz**: Minimal hints, challenge user, brief reminders

### 5. Visual Design
- **Adequate spotlight padding** - 8px around target element
- **Position tooltips wisely** - Avoid covering important UI
- **Use consistent colors** - Green for tutorial, blue for quiz

## Accessibility

### Keyboard Navigation
- **Tab**: Move through buttons in tooltip
- **Enter/Space**: Activate focused button
- **Escape**: Close spotlight (via ClickAwayListener)

### Screen Readers
All interactive elements have proper ARIA labels:

```tsx
<Button
  aria-label="Move to next step"
  endIcon={<ArrowForwardIcon />}
>
  Next
</Button>
```

### Focus Management
When spotlight opens:
1. Previous focus is preserved
2. Focus moves to tooltip
3. Focus is trapped within tooltip
4. On close, focus returns to trigger element

## Testing

### Manual Testing

1. **Open Storybook** and navigate to OnboardingPanel
2. **Select a persona** (e.g., Instructor)
3. **Click a task** to launch spotlight
4. **Verify**:
   - Overlay dims background
   - Target element is highlighted
   - Tooltip appears in correct position
   - Navigation buttons work
   - Story navigation works (if applicable)
5. **Complete or skip** the task
6. **Verify** task is marked complete in OnboardingPanel

### Automated Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import SpotlightOverlay from './SpotlightOverlay';

describe('SpotlightOverlay', () => {
  const mockSteps: SpotlightStep[] = [
    {
      id: 'step-1',
      title: 'Test Step',
      description: 'Test description',
      tooltipPosition: 'center',
      isLast: true,
    },
  ];

  it('renders when open', () => {
    render(
      <SpotlightOverlay
        steps={mockSteps}
        currentStepIndex={0}
        isOpen={true}
        onComplete={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('Test Step')).toBeInTheDocument();
  });

  it('calls onComplete when Complete button clicked', () => {
    const onComplete = jest.fn();
    render(
      <SpotlightOverlay
        steps={mockSteps}
        currentStepIndex={0}
        isOpen={true}
        onComplete={onComplete}
        onClose={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText('Complete'));
    expect(onComplete).toHaveBeenCalled();
  });
});
```

## Troubleshooting

### Spotlight Not Appearing
- **Check `isOpen` prop**: Must be `true`
- **Verify steps array**: Must have at least one step
- **Check z-index**: Spotlight uses `z-index: 9999`

### Target Element Not Highlighted
- **Verify selector**: Use browser DevTools to test selector
- **Check iframe**: Element might be in Storybook preview iframe
- **Add ID to element**: Ensure target has unique ID

### Tooltip Off-Screen
- **Adjust `tooltipPosition`**: Try different position
- **Check viewport size**: Tooltip might be too large
- **Use `center`**: For elements at screen edges

### Story Not Navigating
- **Verify story ID**: Must match exact story ID format
- **Check Storybook API**: Ensure `api` prop is passed
- **Console errors**: Look for navigation errors

## Examples

See the Storybook stories for live examples:
- [Spotlight Overlay Stories](.storybook/components/SpotlightOverlay.stories.tsx)
- Navigate to: `Onboarding/Spotlight Overlay` in Storybook

## Future Enhancements

- [ ] **Progress indicators** - Show step X of Y in spotlight
- [ ] **Branching logic** - Conditional steps based on user actions
- [ ] **Keyboard shortcuts** - Arrow keys for navigation
- [ ] **Custom animations** - Configurable entrance/exit effects
- [ ] **Multi-target highlighting** - Highlight multiple elements
- [ ] **Replay capability** - Allow users to replay tours
- [ ] **Analytics integration** - Track completion rates
- [ ] **Localization** - Multi-language support

## Related Components

- [OnboardingPanel](.storybook/components/OnboardingPanel.tsx) - Task list UI
- [OnboardingSystem](docs/ONBOARDING_SYSTEM.md) - Event tracking
- [OnboardingTasks](.storybook/code/onboarding-tasks.ts) - Task definitions

## Questions?

For questions or issues:
1. Check existing tasks in `onboarding-tasks.ts`
2. Review Storybook examples
3. Consult team documentation
4. Create an issue in the repository
