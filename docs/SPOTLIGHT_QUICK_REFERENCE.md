# Spotlight Overlay Quick Reference

Quick guide for using the Spotlight Overlay in the onboarding system.

## Basic Usage

### 1. Click a Task

In the OnboardingPanel, click any task to launch the spotlight tour.

### 2. Follow the Steps

- **Read** the title and description
- **Review** step-by-step instructions (tutorial mode)
- **Navigate** to the relevant story (automatically)
- **Complete** the task or **Skip** to try later

### 3. Mark Complete

Click "Complete" when finished to mark the task as done.

## Modes

### 📖 Tutorial Mode
**Detailed guidance**
- Full step-by-step instructions
- Documentation examples
- Educational content
- Best for first-time users

### 🎯 Quiz Mode
**Self-assessment**
- Minimal hints
- Interactive challenges
- Test your knowledge
- Best for practice

Switch modes in OnboardingPanel header.

## Navigation Controls

| Button | Action |
|--------|--------|
| **Next** | Move to next step |
| **Skip** | Close and try later |
| **Complete** | Finish and mark task done |
| **✕** (Close) | Exit spotlight |

## Keyboard Shortcuts

- **Tab** - Navigate buttons
- **Enter/Space** - Activate button
- **Escape** - Close spotlight

## Visual Guide

```
┌─────────────────────────────────────────┐
│  Semi-transparent Overlay (60% black)   │
│                                         │
│    ┌──────────────────┐                │
│    │                  │  ← Spotlight   │
│    │  Highlighted     │    (clear)     │
│    │  Element         │                │
│    └──────────────────┘                │
│            ↓                            │
│    ┌──────────────────┐                │
│    │   Tooltip with   │  ← Instructions│
│    │   Instructions   │                │
│    │  [Skip] [Next]   │  ← Controls   │
│    └──────────────────┘                │
│                                         │
└─────────────────────────────────────────┘
```

## Color Coding

- **Green border** (#4CAF50) - Tutorial mode
- **Blue border** (#2196F3) - Quiz mode
- **Pulsing glow** - Attention indicator

## Tips

✅ **Do:**
- Follow instructions in order
- Complete each step before moving on
- Use Quiz mode to test yourself
- Re-run tours if needed

❌ **Don't:**
- Skip ahead without reading
- Close spotlight accidentally
- Rush through tutorial mode

## Troubleshooting

**Spotlight not appearing?**
- Check if task is already complete
- Refresh the page
- Select a persona first

**Element not highlighted?**
- The target might not be on current screen
- Story might need to load
- Try clicking "Next" to navigate

**Can't find the button to click?**
- Look for the pulsing green/blue border
- Check inside the highlighted area
- Review the instructions in the tooltip

## For Developers

### Add a New Task with Spotlight

```typescript
// In .storybook/code/onboarding-tasks.ts
{
  id: 'my-task',
  title: 'Do Something Cool',
  description: 'Learn this feature',
  instructions: [
    'Step 1...',
    'Step 2...',
    'Step 3...',
  ],
  completionCriteria: {
    storyId: 'components-mycomponent--default',
  },
}
```

### Custom Spotlight Steps

```typescript
const steps: SpotlightStep[] = [
  {
    id: 'intro',
    title: 'Welcome',
    description: 'Let\'s get started',
    tooltipPosition: 'center',
  },
  {
    id: 'action',
    targetSelector: '#my-button',
    title: 'Click Here',
    description: 'Click this button',
    tooltipPosition: 'right',
  },
];
```

## Related Docs

- [Full Spotlight Guide](SPOTLIGHT_OVERLAY_GUIDE.md)
- [Onboarding System](ONBOARDING_SYSTEM.md)
- [Onboarding Tasks](.storybook/code/onboarding-tasks.ts)
