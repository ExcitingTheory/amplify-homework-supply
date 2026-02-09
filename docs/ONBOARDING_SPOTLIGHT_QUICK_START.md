# Spotlight Quick Start Guide

5-minute guide to adding spotlight tour support to your component.

## 1. Find Your Task

Check [ONBOARDING_SPOTLIGHT_TASK_REFERENCE.md](./ONBOARDING_SPOTLIGHT_TASK_REFERENCE.md) to see which tasks reference your component.

Example: If you're working on the Sections page, you'll find:
- `instructor-setup-class` (Create a section)
- `learner-join-class` (Join a section)

## 2. Add data-tour Attributes

Add `data-tour` attributes to the key interactive elements mentioned in the spotlight config.

```tsx
// Before
<Button onClick={handleCreate}>Create Section</Button>

// After
<Button
  data-tour="create-section-button"
  onClick={handleCreate}
>
  Create Section
</Button>
```

### Common Patterns

```tsx
// Page container
<div data-tour="sections-page">
  
  // Primary action button
  <Button data-tour="create-section-button">
    Create Section
  </Button>
  
  // Form
  <form data-tour="section-form">
    <TextField data-tour="section-name-input" />
    <Button data-tour="save-section-button" type="submit">
      Save
    </Button>
  </form>
  
  // Navigation tab
  <Tab data-tour="assignments-tab" label="Assignments" />
  
  // List container
  <div data-tour="assignments-list">
    {/* List items */}
  </div>
</div>
```

## 3. Test in Storybook

```bash
npm run storybook
```

1. Navigate to **OnboardingPanel** story
2. Select the appropriate persona (Instructor/Learner/Developer)
3. Click on the task that references your component
4. Watch the spotlight tour
5. Verify:
   - ✅ Correct elements are highlighted
   - ✅ Tooltips position correctly
   - ✅ Navigation works
   - ✅ Can complete the tour

## 4. Common Issues & Fixes

### ❌ Element Not Highlighting

**Problem**: Spotlight doesn't find the element

**Fix**: Verify attribute exists in DevTools
```html
<!-- Should see this in Inspector: -->
<button data-tour="create-section-button">Create Section</button>
```

### ❌ Tooltip Off-Screen

**Problem**: Tooltip appears outside viewport

**Fix**: Update spotlight config tooltip position
```typescript
// In .storybook/code/spotlight-configs.ts
{
  id: 'my-step',
  tooltipPosition: 'center', // Try 'top', 'bottom', 'left', 'right', or 'center'
}
```

### ❌ Multiple Elements Match

**Problem**: Generic selector matches wrong element

**Fix**: Make `data-tour` more specific
```tsx
// ❌ Too generic
<Button data-tour="button">

// ✅ Specific and clear
<Button data-tour="create-assignment-button">
```

## 5. Complete Checklist

Before submitting your PR:

- [ ] Added `data-tour` attributes to all elements in spotlight config
- [ ] Tested spotlight tour in OnboardingPanel
- [ ] Verified tooltips position correctly
- [ ] Tested in both Tutorial and Quiz modes
- [ ] Elements highlight with correct padding
- [ ] Navigation between steps works
- [ ] Can complete the tour successfully
- [ ] No console errors during tour

## Reference: All Required data-tour Attributes

### Your Component's Requirements

Check [ONBOARDING_SPOTLIGHT_TASK_REFERENCE.md](./ONBOARDING_SPOTLIGHT_TASK_REFERENCE.md) under your component's section for the exact list of required attributes.

### Example: Sections Page

```tsx
<div data-tour="sections-page">
  {/* Create button */}
  <Button data-tour="create-section-button">Create Section</Button>
  
  {/* Join button */}
  <Button data-tour="join-section-button">Join Section</Button>
  
  {/* Section card */}
  <Card data-tour="section-card">
    {/* Join code */}
    <Typography data-tour="join-code">{code}</Typography>
    
    {/* Tabs */}
    <Tab data-tour="assignments-tab" label="Assignments" />
    <Tab data-tour="grades-tab" label="Grades" />
  </Card>
  
  {/* Join dialog */}
  <Dialog>
    <TextField data-tour="join-code-input" />
    <Button data-tour="join-confirm">Join</Button>
  </Dialog>
</div>
```

## Need More Help?

- **Full Implementation Guide**: [ONBOARDING_SPOTLIGHT_IMPLEMENTATION.md](./ONBOARDING_SPOTLIGHT_IMPLEMENTATION.md)
- **Task Reference**: [ONBOARDING_SPOTLIGHT_TASK_REFERENCE.md](./ONBOARDING_SPOTLIGHT_TASK_REFERENCE.md)
- **Spotlight Component**: [ONBOARDING_SPOTLIGHT_COMPONENT.md](./ONBOARDING_SPOTLIGHT_COMPONENT.md)
- **Example Code**: `.storybook/components/OnboardingPanel.tsx`

## Quick Commands

```bash
# Start Storybook
npm run storybook

# Find which tasks use your component
grep -r "your-component-name" .storybook/code/spotlight-configs.ts

# Check current data-tour attributes in your component
grep -r "data-tour=" src/components/YourComponent.tsx
```

---

That's it! You're ready to add spotlight support. 🎯
