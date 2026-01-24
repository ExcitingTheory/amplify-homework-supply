# How to Access the Onboarding Panel

## Quick Start

1. **Start Storybook**:
   ```bash
   npm run storybook
   ```

2. **Find the Onboarding Panel**:
   - The panel appears as a **bottom/right addon panel** in Storybook
   - Look for tabs at the bottom of the screen: `Controls` | `Actions` | **`Onboarding`**
   - Click the **"Onboarding"** tab to open the panel

## Visual Location

```
┌─────────────────────────────────────────────────────────┐
│  Storybook Header                                       │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  Story       │  Story Preview                           │
│  Sidebar     │                                          │
│              │                                          │
│              ├──────────────────────────────────────────┤
│              │ [Controls] [Actions] [Onboarding] ◄── HERE
│              │                                          │
│              │  Panel content shows here                │
└──────────────┴──────────────────────────────────────────┘
```

## Selecting a Persona

Once the panel is open:

1. **First Time**: You'll see 3 persona options:
   - 👤 **Instructor** - Create and manage lessons
   - 🎓 **Learner** - Take classes and complete assignments
   - 💻 **Developer** - Build components and features

2. **Click a persona card** to start onboarding

3. **View tasks** organized by category with progress tracking

4. **Change persona** anytime by clicking the "Change" button

## If Panel Doesn't Show

### Check Addon Registration

The panel is registered in `.storybook/main.ts`:

```typescript
"addons": [
  // ... other addons
  './.storybook/code/myOnboarding/preset.js'  // ← Must be present
]
```

### Verify Browser Console

Open browser DevTools (F12) and check for errors. You should see:
```
[Storybook] Custom onboarding addon loaded
```

### Toggle Panel Visibility

- Press `A` key to toggle addon panel on/off
- Click the **show/hide panel** icon (usually bottom-right corner)
- Try refreshing the page

## Programmatic Access (For Stories)

```typescript
import { useOnboardingStatus } from '../../.storybook/code/useOnboarding';

function YourComponent() {
  const { persona, isCompleted, getCompletionPercentage } = useOnboardingStatus();
  
  if (!persona) {
    return (
      <Alert severity="warning">
        No persona selected. Please select a persona in the Onboarding panel first.
      </Alert>
    );
  }
  
  return <div>Current role: {persona}</div>;
}
```

## Troubleshooting

### "No persona selected" Warning

This appears when:
1. The panel hasn't been opened yet
2. No persona has been clicked in the panel
3. LocalStorage was cleared

**Solution**: Open the Onboarding panel and click a persona card.

### Panel Not Visible

1. Check if addon panel is expanded (look for expand icon)
2. Try keyboard shortcut: `A` to toggle panels
3. Restart Storybook: `Ctrl+C` then `npm run storybook`
4. Clear browser cache and reload

### Panel Shows but No Tasks

1. Verify persona is selected (should show at top of panel)
2. Check browser console for errors
3. Tasks are defined in `.storybook/code/onboarding-tasks.ts`

## Related Files

- **Panel Component**: [.storybook/components/OnboardingPanel.tsx](.storybook/components/OnboardingPanel.tsx)
- **Manager Registration**: [.storybook/code/myOnboarding/manager.tsx](.storybook/code/myOnboarding/manager.tsx)
- **Task Definitions**: [.storybook/code/onboarding-tasks.ts](.storybook/code/onboarding-tasks.ts)
- **Hook Usage**: [.storybook/code/useOnboarding.ts](.storybook/code/useOnboarding.ts)
