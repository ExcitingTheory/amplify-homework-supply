# Spotlight Overlay - Visual Cheat Sheet

## Component Architecture

```
┌───────────────────────────────────────────────────────────┐
│                     SPOTLIGHT SYSTEM                       │
├───────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────┐         ┌──────────────────┐        │
│  │ OnboardingPanel │────────▶│ SpotlightOverlay │        │
│  │                 │         │                  │        │
│  │ • Task List     │         │ • Overlay        │        │
│  │ • Mode Toggle   │         │ • Spotlight      │        │
│  │ • Click Handler │         │ • Tooltip        │        │
│  └─────────────────┘         │ • Navigation     │        │
│         │                    └──────────────────┘        │
│         │                             │                   │
│         ▼                             ▼                   │
│  ┌─────────────────┐         ┌──────────────────┐        │
│  │ Task Definition │         │  Event Emitter   │        │
│  │                 │         │                  │        │
│  │ • ID            │         │ • task-completed │        │
│  │ • Title         │         │ • task-skipped   │        │
│  │ • Instructions  │         │ • localStorage   │        │
│  │ • Story ID      │         └──────────────────┘        │
│  └─────────────────┘                                      │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

## User Journey Map

```
START
  │
  ├─▶ 1. Open OnboardingPanel
  │      (Right sidebar in Storybook)
  │
  ├─▶ 2. Select Persona
  │      [Instructor] [Learner] [Developer]
  │
  ├─▶ 3. Choose Mode
  │      📖 Tutorial  OR  🎯 Quiz
  │
  ├─▶ 4. Click Task
  │      "Set Up Your First Class"
  │      
  │      ┌─────────────────────────────┐
  │      │    SPOTLIGHT OPENS          │
  │      │                             │
  │      │  Step 1: Introduction       │
  │      │  ├─ Task overview           │
  │      │  ├─ Instructions (tutorial) │
  │      │  └─ [Skip] [Next]           │
  │      │                             │
  │      │  Step 2: Navigation         │
  │      │  ├─ Auto-navigate to story  │
  │      │  ├─ Highlight UI element    │
  │      │  └─ [Skip] [Next]           │
  │      │                             │
  │      │  Step 3: Completion         │
  │      │  ├─ Congratulations         │
  │      │  └─ [Skip] [Complete]       │
  │      └─────────────────────────────┘
  │
  ├─▶ 5. Task Marked Complete ✓
  │      (Saved to localStorage)
  │
  └─▶ 6. Repeat for Next Task
```

## Spotlight Overlay Anatomy

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  FULL SCREEN OVERLAY (z-index: 9999)            │
│  Background: rgba(0, 0, 0, 0.6)                 │
│                                                  │
│  ┌──────────────────────────────┐               │
│  │                              │               │
│  │    SVG MASK                  │               │
│  │    ┌────────────────┐        │               │
│  │    │  SPOTLIGHT     │        │               │
│  │    │  (transparent) │        │               │
│  │    │                │        │               │
│  │    │  [Element ID]  │        │               │
│  │    │                │        │               │
│  │    └────────────────┘        │               │
│  │         ↓                    │               │
│  │    ┏━━━━━━━━━━━━━┓          │               │
│  │    ┃  TOOLTIP    ┃          │               │
│  │    ┃             ┃          │               │
│  │    ┃ • Title     ┃          │               │
│  │    ┃ • Desc      ┃          │               │
│  │    ┃ • Actions   ┃          │               │
│  │    ┃             ┃          │               │
│  │    ┃ [Skip][Next]┃          │               │
│  │    ┗━━━━━━━━━━━━━┛          │               │
│  └──────────────────────────────┘               │
│                                                  │
│  ANIMATED BORDER: Pulsing glow                  │
│  Color: #4CAF50 (tutorial) | #2196F3 (quiz)     │
│                                                  │
└──────────────────────────────────────────────────┘
```

## Mode Comparison

| Feature              | 📖 Tutorial Mode        | 🎯 Quiz Mode         |
|---------------------|-------------------------|---------------------|
| **Color**           | Green (#4CAF50)         | Blue (#2196F3)      |
| **Instructions**    | ✅ Full steps shown     | ❌ Hidden           |
| **Hints**           | Detailed guidance       | Brief reminder      |
| **Navigation**      | Documentation stories   | Interactive demos   |
| **Purpose**         | Learn the feature       | Test knowledge      |
| **Audience**        | First-time users        | Returning users     |
| **Completion**      | After understanding     | After completing    |

## Tooltip Positions

```
         [top]
            ↑
            │
    [left] ←┼→ [right]
            │
            ↓
        [bottom]

     [center]
  (no target element)
```

**Auto-fallback:**
- If `right` → off-screen, flip to `left`
- If `bottom` → off-screen, flip to `top`
- Always constrained to viewport

## Element Targeting

### Method 1: CSS Selector
```typescript
{
  targetSelector: '#create-button',
  tooltipPosition: 'right'
}
```

### Method 2: Manual Position
```typescript
{
  targetPosition: {
    top: 200,
    left: 300,
    width: 200,
    height: 100
  },
  tooltipPosition: 'bottom'
}
```

### Method 3: Center Screen
```typescript
{
  // No targetSelector or targetPosition
  tooltipPosition: 'center'
}
```

## Event Flow

```
User Action          System Response         Result
──────────          ────────────────        ──────

[Click Task]   →    Generate Steps     →    Spotlight Opens
                    Set State
                    
[Click Next]   →    Navigate Story     →    Story Loads
                    Update Step Index       Element Highlighted
                    
[Click Complete] → Emit Event         →    Task Marked ✓
                    Close Spotlight         localStorage Updated
                    
[Click Skip]   →    Emit Skip Event    →    Spotlight Closes
                    Close Spotlight         Task Remains Incomplete
```

## Data Flow

```
┌──────────────┐
│ Task Click   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│ generateSpotlightSteps() │
├──────────────────────────┤
│ • Read task.instructions │
│ • Read task.storyId      │
│ • Generate 3 steps       │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────┐
│ Open Spotlight   │
├──────────────────┤
│ steps: [...]     │
│ currentStep: 0   │
│ isOpen: true     │
└──────┬───────────┘
       │
       ▼
┌─────────────────────┐
│ User Navigation     │
├─────────────────────┤
│ Next → step++       │
│ Skip → close        │
│ Complete → emit     │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Event Emission      │
├─────────────────────┤
│ type: completed     │
│ taskId: "..."       │
│ metadata: {...}     │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ localStorage Update │
├─────────────────────┤
│ completedTasks: [...│
│ progress: 42%       │
└─────────────────────┘
```

## Quick Code Reference

### Task Definition
```typescript
{
  id: 'my-task',
  title: 'Learn Feature',
  instructions: ['Step 1', 'Step 2'],
  completionCriteria: {
    storyId: 'components-x--story'
  }
}
```

### Component Target
```tsx
<Button id="my-button">Click</Button>
```

### That's it! Spotlight auto-generates the rest.

## File Locations

```
📁 Project Root
├── 📁 .storybook/
│   └── 📁 components/
│       ├── 📄 SpotlightOverlay.tsx          ← Core component
│       ├── 📄 SpotlightOverlay.stories.tsx  ← Examples
│       └── 📄 OnboardingPanel.tsx           ← Integration
│
├── 📁 docs/
│   ├── 📄 SPOTLIGHT_README.md               ← Quick start
│   ├── 📄 SPOTLIGHT_QUICK_REFERENCE.md      ← Cheat sheet
│   ├── 📄 SPOTLIGHT_OVERLAY_GUIDE.md        ← Full guide
│   ├── 📄 SPOTLIGHT_IMPLEMENTATION_SUMMARY  ← What's built
│   └── 📄 SPOTLIGHT_VISUAL_CHEAT_SHEET.md   ← This file!
│
└── 📁 src/
    └── 📁 stories/
        └── 📄 OnboardingExamples.stories.tsx ← Demo
```

## Testing Checklist

```
✅ Visual
   ├─ [ ] Overlay dims background
   ├─ [ ] Spotlight highlights element
   ├─ [ ] Border pulses smoothly
   └─ [ ] Tooltip positions correctly

✅ Interaction
   ├─ [ ] Next button advances step
   ├─ [ ] Skip button closes spotlight
   ├─ [ ] Complete marks task done
   └─ [ ] Close button exits

✅ Navigation
   ├─ [ ] Auto-navigates to story
   ├─ [ ] Works in Storybook iframe
   └─ [ ] Smooth transitions

✅ Responsive
   ├─ [ ] Works on mobile
   ├─ [ ] Tooltips stay in viewport
   └─ [ ] Handles resize/scroll

✅ Accessibility
   ├─ [ ] Keyboard navigation
   ├─ [ ] ARIA labels
   └─ [ ] Screen reader friendly
```

## Color Palette

```css
/* Tutorial Mode */
--tutorial-primary: #4CAF50;    /* Green */
--tutorial-hover:   #45a049;    /* Dark green */
--tutorial-shadow:  rgba(76, 175, 80, 0.4);

/* Quiz Mode */
--quiz-primary:     #2196F3;    /* Blue */
--quiz-hover:       #1976D2;    /* Dark blue */
--quiz-shadow:      rgba(33, 150, 243, 0.4);

/* Overlay */
--overlay-bg:       rgba(0, 0, 0, 0.6);
--spotlight-border: 3px solid;
--spotlight-radius: 8px;
```

## Animation Keyframes

```css
@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(color, 0.2),
                0 0 20px rgba(color, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(color, 0.1),
                0 0 30px rgba(color, 0.6);
  }
}

duration: 2s
timing: ease-in-out
iteration: infinite
```

## State Machine

```
         ┌─────────┐
    ┌───▶│ CLOSED  │◀────┐
    │    └────┬────┘     │
    │         │          │
    │    [Click Task]    │
    │         │          │
    │         ▼          │
    │    ┌─────────┐    │
    │    │  INTRO  │    │
    │    └────┬────┘    │
    │         │          │
    │    [Click Next]   │
    │         │          │
    │         ▼          │
    │    ┌──────────┐   │
    │    │ NAVIGATE │   │
    │    └────┬─────┘   │
    │         │          │
    │    [Click Next]   │
    │         │          │
    │         ▼          │
    │    ┌──────────┐   │
    │    │ COMPLETE │   │
    │    └────┬─────┘   │
    │         │          │
    │   [Click Done]    │
    │         │          │
    └─────────┘          │
                         │
    [Skip/Close at any time]
```

## Pro Tips

💡 **For Users:**
- Use Tutorial mode first time
- Use Quiz mode to practice
- Don't skip too quickly
- Review instructions carefully

💡 **For Developers:**
- Add semantic IDs to components
- Test selectors in DevTools
- Use meaningful task titles
- Provide clear instructions

💡 **For Designers:**
- Green = educational
- Blue = assessment
- Keep tooltips concise
- Ensure high contrast

---

**Need more info?** Check the [full documentation](SPOTLIGHT_README.md)!
