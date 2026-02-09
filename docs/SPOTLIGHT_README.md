# Spotlight Overlay - README

> Interactive guided tours for the onboarding system

## 🎯 Quick Start

### For Users

1. **Open Storybook**: `npm run storybook`
2. **Open Onboarding Panel**: Click panel icon in right sidebar
3. **Select Persona**: Choose Instructor, Learner, or Developer
4. **Click a Task**: Launch the spotlight tour
5. **Follow Steps**: Use Next/Skip/Complete buttons

### For Developers

```typescript
// 1. Define a task with story ID
{
  id: 'my-task',
  title: 'Learn Feature X',
  instructions: ['Step 1...', 'Step 2...'],
  completionCriteria: {
    storyId: 'components-featurex--default',
  },
}

// 2. Add ID to your component
<Button id="feature-button">Click Me</Button>

// 3. Task automatically gets spotlight!
```

## 📚 Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [Quick Reference](SPOTLIGHT_QUICK_REFERENCE.md) | Fast lookup guide | Users & Developers |
| [Full Guide](SPOTLIGHT_OVERLAY_GUIDE.md) | Complete technical docs | Developers |
| [Implementation Summary](SPOTLIGHT_IMPLEMENTATION_SUMMARY.md) | What was built | Team & Stakeholders |
| [Onboarding System](ONBOARDING_SYSTEM.md) | Overall system docs | Developers |

## 🎨 Features

- ✅ **Semi-transparent overlay** - Dims non-focused content
- ✅ **Spotlight effect** - Highlights target UI elements
- ✅ **Contextual tooltips** - Step-by-step instructions
- ✅ **Navigation controls** - Next, Skip, Complete buttons
- ✅ **Tutorial mode** (📖) - Detailed guidance
- ✅ **Quiz mode** (🎯) - Self-assessment
- ✅ **Auto-navigation** - Links to Storybook stories
- ✅ **Event tracking** - Analytics integration
- ✅ **Responsive** - Works on all screen sizes
- ✅ **Accessible** - Keyboard navigation, ARIA labels

## 🛠️ Components

```
.storybook/components/
├── SpotlightOverlay.tsx         # Core component
├── SpotlightOverlay.stories.tsx # Examples
└── OnboardingPanel.tsx          # Integration

docs/
├── SPOTLIGHT_OVERLAY_GUIDE.md          # Technical guide
├── SPOTLIGHT_QUICK_REFERENCE.md        # Quick reference
├── SPOTLIGHT_IMPLEMENTATION_SUMMARY.md # What was built
└── ONBOARDING_SYSTEM.md                # System overview
```

## 🎨 Visual Design

### Tutorial Mode (📖)
- **Color**: Green (`#4CAF50`)
- **Purpose**: Educational
- **Content**: Full instructions
- **Audience**: First-time users

### Quiz Mode (🎯)
- **Color**: Blue (`#2196F3`)
- **Purpose**: Assessment
- **Content**: Minimal hints
- **Audience**: Testing knowledge

### Overlay
```
┌────────────────────────────────┐
│  Dimmed Background (60% dark)  │
│                                │
│    ┌───────────────┐           │
│    │  Highlighted  │ ← Spotlight
│    │   Element     │   (clear)  
│    └───────────────┘           │
│           ↓                    │
│    ┌──────────────┐            │
│    │  Tooltip +   │ ← Instructions
│    │  Controls    │            │
│    └──────────────┘            │
└────────────────────────────────┘
```

## 🔗 Integration

### With Onboarding System
- Uses existing event emitter
- Updates task completion
- Persists to localStorage
- Respects persona selection

### With Storybook
- Navigates to stories
- Works in preview iframe
- Portal-based rendering

## 📝 Example Usage

### Basic Task with Spotlight

```typescript
// In onboarding-tasks.ts
{
  id: 'create-unit',
  title: 'Create Your First Unit',
  description: 'Build interactive learning content',
  instructions: [
    'Navigate to Units page',
    'Click "Create New Unit"',
    'Enter a title and description',
    'Use the editor to add content',
    'Save your unit',
  ],
  persona: 'instructor',
  category: 'Getting Started',
  order: 2,
  estimatedTime: 600,
  completionCriteria: {
    storyId: 'pages-units--default',
    requiredActions: ['onCreate', 'onSave'],
  },
}
```

### Component with Target ID

```tsx
// In your component story
export const Default: StoryObj = {
  render: () => (
    <Box>
      <Typography variant="h6">Units Page</Typography>
      <Button 
        id="create-unit-button"  // ID for spotlight targeting
        variant="contained"
      >
        Create New Unit
      </Button>
    </Box>
  ),
};
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Tab** | Navigate buttons |
| **Enter** | Activate button |
| **Escape** | Close spotlight |

## 🧪 Testing

### Manual Test
```bash
npm run storybook
# → Open "Onboarding/Spotlight Overlay"
# → Try each example story
# → Verify overlay, tooltip, navigation
```

### Integration Test
```bash
# → Open OnboardingPanel
# → Select persona
# → Click task
# → Verify spotlight appears
# → Complete task
# → Verify task marked complete
```

## 🐛 Troubleshooting

**Spotlight not appearing?**
- Task already complete?
- Persona selected?
- Browser console errors?

**Element not highlighted?**
- Check selector: `#my-button`
- Element in iframe?
- Element exists on page?

**Tooltip off-screen?**
- Try different `tooltipPosition`
- Check viewport size
- Use `center` position

## 📊 Metrics to Track

- Task completion rate
- Average time per task
- Skip rate
- User feedback
- Mode preference (tutorial vs quiz)

## 🚀 Next Steps

1. **Add more tasks** with spotlight targeting
2. **Gather user feedback** on UX
3. **Track analytics** on completion rates
4. **Iterate on design** based on data
5. **Expand to Next.js app** (beyond Storybook)

## 🙋 Support

- **Quick Questions**: [Quick Reference](SPOTLIGHT_QUICK_REFERENCE.md)
- **Technical Details**: [Full Guide](SPOTLIGHT_OVERLAY_GUIDE.md)
- **Implementation**: [Summary](SPOTLIGHT_IMPLEMENTATION_SUMMARY.md)
- **System Overview**: [Onboarding System](ONBOARDING_SYSTEM.md)
- **Examples**: Storybook → "Onboarding/Spotlight Overlay"
- **Issues**: File in repository

## 📦 Dependencies

```json
{
  "@mui/material": "^5.14.0",
  "@mui/icons-material": "^5.14.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0"
}
```

## ✅ Status

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: February 6, 2026  
**Tested**: Chrome, Firefox, Safari, Mobile

## 🎉 Success!

The Spotlight Overlay is fully implemented and ready to enhance your onboarding experience!

---

**Made with ❤️ for better user onboarding**
