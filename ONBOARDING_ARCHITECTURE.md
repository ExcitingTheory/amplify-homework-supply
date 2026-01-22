# Onboarding System - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STORYBOOK UI                                 │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  OnboardingPanel.jsx (Right Sidebar)                       │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │ Persona Selection | Task List | Progress Bar        │   │   │
│  │  │                                                     │   │   │
│  │  │ [Instructor] [Learner] [Developer]                │   │   │
│  │  │                                                     │   │   │
│  │  │ ████████░░░░░░░░  28% Complete                     │   │   │
│  │  │                                                     │   │   │
│  │  │ ✓ Set Up Your First Class                          │   │   │
│  │  │ ✓ Create Your First Unit                           │   │   │
│  │  │ □ Add a Quiz Block                                 │   │   │
│  │  │ □ Add Vocabulary Words                             │   │   │
│  │  │                                                     │   │   │
│  │  │ [Reset Progress]                                   │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
└────────────────┬────────────────────────────────────────────────────┘
                 │ (Event Listener)
                 │
    ┌────────────▼───────────────┐
    │  OnboardingEventEmitter    │
    │  (Singleton Instance)      │
    │                            │
    │  • emit(event)             │
    │  • on(listener)            │
    │  • isTaskCompleted()       │
    │  • getCompletionPercentage │
    │  • localStorage persistence│
    └────────────┬────────────────┘
                 │ (Subscribes)
                 │
    ┌────────────────────────────────────────────────────┐
    │                 COMPONENTS                         │
    │                                                    │
    │  ┌─────────────────────┐   ┌─────────────────────┐│
    │  │  useCompleteTask    │   │  useTrackTask       ││
    │  │  (Auto-Detection)   │   │  (Manual Tracking)  ││
    │  │                     │   │                     ││
    │  │ useEffect(() => {   │   │ startTask()         ││
    │  │   emitter.emit(     │   │ completeTask()      ││
    │  │   'task-completed'  │   │ skipTask()          ││
    │  │ })                  │   │                     ││
    │  │                     │   │                     ││
    │  │ Pages/Components    │   │ Form Handlers       ││
    │  └─────────────────────┘   └─────────────────────┘│
    │                                                    │
    │  ┌──────────────────────────────────────────────┐ │
    │  │  useOnboardingStatus (Query API)             │ │
    │  │  • persona                                   │ │
    │  │  • isCompleted(taskId)                       │ │
    │  │  • getCompletionPercentage()                 │ │
    │  │  • reset()                                   │ │
    │  └──────────────────────────────────────────────┘ │
    │                                                    │
    └────────────────────────────────────────────────────┘
                 │
                 │ (Emit Events)
                 │
    ┌────────────▼───────────────────────────────────┐
    │  Event Payload                                 │
    │  {                                             │
    │    type: 'task-completed',                     │
    │    taskId: 'instructor-setup-class',           │
    │    persona: 'instructor',                      │
    │    timestamp: 1674123456789,                   │
    │    metadata: { ... }                           │
    │  }                                             │
    └────────────┬───────────────────────────────────┘
                 │
    ┌────────────▼──────────────────────────────┐
    │  localStorage                             │
    │  Key: storybook_onboarding_progress       │
    │                                           │
    │  {                                        │
    │    completedTasks: [                      │
    │      ['instructor:task-id', event]        │
    │    ],                                     │
    │    currentPersona: 'instructor',          │
    │    timestamp: 1674123456789               │
    │  }                                        │
    └──────────────────────────────────────────┘
```

## Data Flow Diagram

```
User Interaction → Hook Detection → Event Emission → Panel Update → UI Change
                                                        │
                                                        └──→ localStorage
                                                        
Page Reload → Load from localStorage → Restore State → Panel Display
```

## Component Integration Points

```
┌─────────────────────────────────────────┐
│  Page / Component / Story                │
└────────────┬────────────────────────────┘
             │
             ├──→ useCompleteTask()      (Auto-detect when mounted)
             │    - No manual action needed
             │    - Best for page loads
             │
             ├──→ useTrackTask()         (Manual tracking)
             │    - startTask() on form start
             │    - completeTask() on submit
             │    - Best for workflows
             │
             └──→ getOnboardingEmitter() (Direct emission)
                  - Custom events
                  - Advanced scenarios
```

## Three Persona Task Paths

```
INSTRUCTOR TASKS (7)
    │
    ├─→ Getting Started (1)
    │   └─→ Set Up Your First Class
    │
    ├─→ Content Creation (3)
    │   ├─→ Create Your First Unit
    │   ├─→ Add a Quiz Block
    │   └─→ Add Vocabulary Words
    │
    ├─→ Content Management (1)
    │   └─→ (Vocabulary/Assignments)
    │
    ├─→ Assignments (1)
    │   └─→ Assign Work to Students
    │
    ├─→ Assessment (1)
    │   └─→ View Student Grades
    │
    └─→ AI Tools (1)
        └─→ Use AI to Generate Content

LEARNER TASKS (6)
    │
    ├─→ Getting Started (1)
    │   └─→ Join Your First Class
    │
    ├─→ Coursework (2)
    │   ├─→ View Your Assignments
    │   └─→ Complete an Assignment
    │
    ├─→ Progress (1)
    │   └─→ Review Your Feedback
    │
    ├─→ Practice (1)
    │   └─→ Practice Vocabulary
    │
    └─→ Learning Support (1)
        └─→ Get Help from AI Assistant

DEVELOPER TASKS (8)
    │
    ├─→ Onboarding (2)
    │   ├─→ Explore Component Documentation
    │   └─→ Set Up Development Environment
    │
    ├─→ Architecture (2)
    │   ├─→ Understand the Editor System
    │   └─→ Learn DataStore Patterns
    │
    ├─→ AI Features (1)
    │   └─→ Review AI Integration
    │
    ├─→ Codebase (1)
    │   └─→ Explore Project Structure
    │
    └─→ Development (2)
        ├─→ Run Tests and Linting
        └─→ Customize Storybook Setup
```

## Event Lifecycle

```
1. USER ACTION
   └─→ Component mounts
       OR Form submitted
       OR Manual button click

2. HOOK EXECUTION
   └─→ useCompleteTask / useTrackTask
       OR getOnboardingEmitter().emit()

3. EVENT EMISSION
   └─→ OnboardingEventEmitter.emit(event)
       └─→ Broadcast to all listeners

4. UI UPDATE
   └─→ OnboardingPanel listener receives event
       └─→ Update task checkbox state
       └─→ Recalculate progress percentage
       └─→ Re-render panel

5. PERSISTENCE
   └─→ Event stored in OnboardingEventEmitter.completedTasks
       └─→ Saved to localStorage

6. ON RELOAD
   └─→ localStorage loaded
       └─→ State restored
       └─→ Panel displays previous progress
```

## File Organization

```
.storybook/
│
├── code/
│   ├── myOnboarding/
│   │   ├── preset.js                    # Addon entry
│   │   ├── manager.tsx                  # Register panel
│   │   ├── preview.tsx                  # Config
│   │   ├── index.js                     # Export
│   │   └── README.md                    # Docs
│   │
│   ├── onboarding-events.ts             # Event system
│   │   └── getOnboardingEmitter()
│   │   └── Types: OnboardingEvent, UserPersona
│   │
│   ├── onboarding-tasks.ts              # Task definitions
│   │   └── ONBOARDING_TASKS array (21 tasks)
│   │   └── Helper functions
│   │
│   ├── useOnboarding.ts                 # React hooks
│   │   ├── useCompleteTask()
│   │   ├── useTrackTask()
│   │   └── useOnboardingStatus()
│   │
│   └── index.ts                         # Type exports
│
└── components/
    ├── OnboardingPanel.jsx              # UI component
    └── OnboardingPanel.css              # Styling

src/stories/
└── OnboardingExamples.stories.tsx       # Example stories

docs/
└── ONBOARDING_SYSTEM.md                 # Full docs

Root/
├── ONBOARDING_SETUP_GUIDE.md            # Quick start
└── ONBOARDING_IMPLEMENTATION_SUMMARY.md # This summary
```

## Integration Example

```
┌─────────────────────────────────────────────────┐
│  pages/sections.js (Instructor Page)             │
│                                                 │
│  import { useCompleteTask } from '...'         │
│                                                 │
│  export default function SectionsPage() {      │
│    // Auto-mark task as complete when loaded   │
│    useCompleteTask('instructor-setup-class',   │
│                    'instructor');              │
│                                                 │
│    return <SectionsList />;                    │
│  }                                              │
└─────────────────┬───────────────────────────────┘
                  │
                  └──→ Component mounts
                      │
                      └──→ useCompleteTask hook fires
                          │
                          └──→ emitter.emit('task-completed')
                              │
                              └──→ OnboardingPanel receives event
                                  │
                                  └──→ Updates UI
                                      └──→ Saves to localStorage
```

## Real-time Event Monitoring

```
Browser Console: (for development)

import { getOnboardingEmitter } from '.storybook/code/onboarding-events'

const emitter = getOnboardingEmitter();

emitter.on((event) => {
  console.log('[Onboarding Event]', {
    type: event.type,
    taskId: event.taskId,
    persona: event.persona,
    timestamp: new Date(event.timestamp).toLocaleTimeString(),
    metadata: event.metadata
  });
});

// Output:
// [Onboarding Event] {
//   type: 'persona-selected',
//   taskId: 'persona-selection',
//   persona: 'instructor',
//   timestamp: '12:34:56 PM',
//   metadata: undefined
// }
// 
// [Onboarding Event] {
//   type: 'task-completed',
//   taskId: 'instructor-setup-class',
//   persona: 'instructor',
//   timestamp: '12:34:59 PM',
//   metadata: { autoDetected: true }
// }
```

## Addon Registration Flow

```
┌─────────────────────────────────────────┐
│  .storybook/main.ts                      │
│                                         │
│  addons: [                              │
│    './code/myOnboarding/preset.js'      │
│  ]                                       │
└──────────────┬──────────────────────────┘
               │
               └──→ Load preset.js
                   │
                   └──→ Export manager config
                       │
                       └──→ manager.tsx
                           │
                           └──→ addons.register()
                               │
                               └──→ addons.add('panel')
                                   │
                                   └──→ Render OnboardingPanel
                                       │
                                       └──→ Show in right sidebar
```

---

**Last Updated**: January 22, 2026  
**Diagram Format**: ASCII Art  
**Scope**: Complete Architecture Overview
