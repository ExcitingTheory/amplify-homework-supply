# Onboarding Spotlight Implementation Guide

Complete guide for implementing spotlight tours across the application for all personas (Instructor, Learner, Developer).

## Overview

The spotlight system provides guided tours that highlight specific UI elements and walk users through tasks. Each onboarding task has configured spotlight steps that target specific elements using `data-tour` attributes.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ OnboardingPanel                                         │
│ - Displays tasks by persona                            │
│ - Triggers spotlight tours when task clicked           │
│ - Manages task completion tracking                     │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ├─ getSpotlightConfigFor Task(taskId, mode)
                  │  Returns configured steps for task
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ SpotlightOverlay                                        │
│ - Semi-transparent overlay (scrim)                      │
│ - Highlighted target element (spotlight)                │
│ - Positioned tooltip with content                       │
│ - Navigation (Next/Skip/Complete)                       │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ├─ Finds target elements using CSS selectors
                  │  - data-tour attributes (primary)
                  │  - Fallback selectors (has-text, role, etc.)
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ UI Components with data-tour attributes                 │
│ - Sections page, Editor, Chat, Dictionary, etc.        │
│ - Each interactive element has unique tour ID           │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Add data-tour Attributes to Your Component

```tsx
// Example: Create Section button
<Button
  data-tour="create-section-button"
  onClick={handleCreateSection}
>
  Create Section
</Button>

// Example: Editor toolbar
<div
  data-tour="editor-toolbar"
  className="toolbar"
>
  {/* Toolbar content */}
</div>

// Example: Form
<form data-tour="section-form">
  <TextField
    data-tour="section-name-input"
    label="Section Name"
  />
  <Button
    data-tour="save-section-button"
    type="submit"
  >
    Save
  </Button>
</form>
```

### 2. Reference in Spotlight Config

```typescript
// In .storybook/code/spotlight-configs.ts
{
  id: 'create-button',
  title: 'Create Section Button',
  description: 'Click this button to start creating a new class section.',
  target: '[data-tour="create-section-button"]',
  tooltipPosition: 'bottom',
  highlightPadding: 12,
  pulseTarget: true,
}
```

### 3. Test in Storybook

1. Open OnboardingPanel in Storybook
2. Select the appropriate persona
3. Click on the task
4. Verify spotlight highlights the correct element
5. Check tooltip positioning and content

## data-tour Attribute Guidelines

### Naming Conventions

**Format**: `{component}-{element}-{type}`

Examples:
- `sections-page` - Page container
- `create-section-button` - Primary action button
- `section-form` - Main form
- `section-name-input` - Specific form field
- `assignments-tab` - Navigation tab
- `grades-list` - List container
- `grade-detail` - Detail view

### Where to Add data-tour

#### ✅ DO add to:
- **Page containers**: `<div data-tour="sections-page">`
- **Primary action buttons**: `<Button data-tour="create-unit-button">`
- **Forms**: `<form data-tour="assignment-form">`
- **Tab panels**: `<Tab data-tour="grades-tab">`
- **List containers**: `<List data-tour="student-list">`
- **Interactive widgets**: `<AudioPlayer data-tour="pronunciation-player">`
- **Navigation elements**: `<MenuItem data-tour="help-menu">`

#### ❌ DON'T add to:
- Generic wrapper divs without semantic meaning
- Every single child element (only key interaction points)
- Elements that are purely decorative
- Temporary or conditional elements (use stable targets)

### Multiple Selectors (Fallbacks)

Spotlight configs support multiple selectors for resilience:

```typescript
target: '[data-tour="create-section-button"], button:has-text("Create Section"), button:has-text("New Section")'
```

This tries:
1. `data-tour` attribute (preferred)
2. Button with specific text
3. Alternative button text

### Selector Types

```typescript
// data-tour attribute (BEST)
target: '[data-tour="editor"]'

// ARIA role (GOOD)
target: '[role="tab"]:has-text("Grades")'

// Text content (OK for resilience)
target: 'button:has-text("Save")'

// Class names (AVOID - too fragile)
target: '[class*="MuiButton"]' // ❌ Don't do this
```

## Complete Component Coverage

### Required data-tour Attributes by Page

#### Sections Page (`pages/sections.js`)
```tsx
// Page container
<div data-tour="sections-page">

  // Create section button
  <Button data-tour="create-section-button">Create Section</Button>

  // Section cards
  <Card data-tour="section-card">
    // Join code display
    <Typography data-tour="join-code">{joinCode}</Typography>
    
    // Tabs
    <Tabs>
      <Tab data-tour="assignments-tab" label="Assignments" />
      <Tab data-tour="grades-tab" label="Grades" />
    </Tabs>
  </Card>

  // Join section dialog
  <Dialog>
    <TextField data-tour="join-code-input" />
    <Button data-tour="join-confirm">Join</Button>
  </Dialog>
</div>
```

#### Units Page (`pages/units.js`)
```tsx
<div data-tour="units-page">
  <Button data-tour="create-unit-button">Create Unit</Button>
  <Grid data-tour="units-list">
    {/* Unit cards */}
  </Grid>
</div>
```

#### Editor (`src/components/Editor3/`)
```tsx
// Main editor
<div data-tour="editor" className="ContentEditable">
  {/* Editor content */}
</div>

// Toolbar
<div data-tour="editor-toolbar">
  <Button data-tour="save-button">Save</Button>
  {/* Other toolbar buttons */}
</div>

// Custom blocks
<div data-tour="quiz-block" className="QuizNode">
  <div data-tour="quiz-answers">
    <Checkbox data-tour="correct-checkbox" />
  </div>
</div>
```

#### Chat Sidebar (`src/components/ChatSidebar.js`)
```tsx
// Chat toggle button
<IconButton data-tour="chat-button" aria-label="Open chat">
  <ChatIcon />
</IconButton>

// Chat panel
<div data-tour="chat-sidebar">
  <TextField data-tour="chat-input" />
  <div data-tour="ai-message" className="message">
    <Button data-tour="insert-button">Insert</Button>
  </div>
</div>
```

#### Dictionary Editor (`src/components/DictionaryEditor2.js`)
```tsx
<div data-tour="dictionary-editor">
  <Button data-tour="add-word-button">Add Word</Button>
  
  <form data-tour="word-form">
    <TextField data-tour="word-input" />
    <TextField data-tour="definition-input" />
    <input type="file" data-tour="audio-upload" />
  </form>
</div>
```

#### Workbook (`pages/workbook.js`)
```tsx
<div data-tour="workbook">
  <div data-tour="quiz-question">
    {/* Question content */}
  </div>
  
  <Button data-tour="submit-button">Submit</Button>
  
  <div data-tour="results">
    {/* Score display */}
  </div>
</div>
```

#### Grades View
```tsx
<div data-tour="grades-list">
  <Card data-tour="grade-card">
    {/* Grade summary */}
  </Card>
</div>

<div data-tour="grade-detail">
  <div data-tour="correct-answers">
    {/* Answer key */}
  </div>
</div>
```

#### Help/Keyboard Shortcuts
```tsx
<MenuItem data-tour="help-menu">Help</MenuItem>

<div data-tour="shortcuts-page">
  <div data-tour="shortcuts-demo">
    {/* Automated demonstration */}
  </div>
</div>
```

## Testing Your Implementation

### Manual Testing Checklist

For each task you implement:

- [ ] `data-tour` attribute added to target elements
- [ ] Spotlight highlights correct element
- [ ] Tooltip positions correctly (not off-screen)
- [ ] Pulse animation works (if enabled)
- [ ] Multiple steps navigate correctly
- [ ] Story navigation works (if applicable)
- [ ] Complete/Skip buttons function
- [ ] Task marks as complete correctly
- [ ] Works in both Tutorial and Quiz modes

### Automated Testing

Create interaction tests in Storybook:

```jsx
// OnboardingPanel.interactions.js
export const TestInstructorSetupClass = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Select instructor persona
    await userEvent.click(canvas.getByText('Instructor'));
    
    // Click on first task
    const task = canvas.getByText('Set Up Your First Class');
    await userEvent.click(task);
    
    // Verify spotlight opens
    await expect(within(document.body).getByTestId('spotlight-overlay')).toBeVisible();
    
    // Verify target is highlighted
    // Note: This tests the config, actual targeting happens in real components
    
    // Click Next
    await userEvent.click(within(document.body).getByText('Next'));
    
    // Click Complete
    await userEvent.click(within(document.body).getByText('Complete'));
    
    // Verify task marked complete
    await expect(task).toHaveAttribute('aria-checked', 'true');
  },
};
```

## Common Patterns

### Modal/Dialog Targeting

```tsx
// Modal opens dynamically - target the button first
<Button data-tour="open-settings" onClick={openModal}>
  Settings
</Button>

// Then target modal content
<Dialog data-tour="settings-dialog">
  <DialogContent data-tour="settings-form">
    {/* Form fields */}
  </DialogContent>
</Dialog>
```

Spotlight steps:
```typescript
{
  id: 'open-settings',
  target: '[data-tour="open-settings"]',
  // ...
},
{
  id: 'configure',
  target: '[data-tour="settings-dialog"]',
  // Automatically waits for element to appear
}
```

### Conditional Elements

```tsx
// Use stable parent container
<div data-tour="assignment-list">
  {assignments.length > 0 ? (
    assignments.map(assignment => (
      <Card key={assignment.id}>{/* ... */}</Card>
    ))
  ) : (
    <Typography data-tour="no-assignments">
      No assignments yet
    </Typography>
  )}
</div>
```

### Tabbed Content

```tsx
<Tabs>
  <Tab data-tour="overview-tab" label="Overview" />
  <Tab data-tour="assignments-tab" label="Assignments" />
  <Tab data-tour="grades-tab" label="Grades" />
</Tabs>

<TabPanel data-tour="assignments-panel">
  {/* Assignments content */}
</TabPanel>
```

Spotlight can navigate to tabs automatically:
```typescript
{
  id: 'switch-to-grades',
  title: 'View Grades',
  target: '[data-tour="grades-tab"]',
  onClick: () => {
    // Spotlight can trigger tab switch
    document.querySelector('[data-tour="grades-tab"]')?.click();
  },
}
```

## Troubleshooting

### Element Not Highlighting

**Problem**: Spotlight doesn't highlight the target element

**Solutions**:
1. Verify `data-tour` attribute exists: Inspect DOM in DevTools
2. Check selector syntax: Should be `[data-tour="value"]`
3. Ensure element is rendered: May need to wait for async data
4. Check z-index: Spotlight uses `z-index: 9999`, ensure target isn't covered
5. Use fallback selectors: Add alternative ways to find element

### Tooltip Positioned Off-Screen

**Problem**: Tooltip appears outside viewport

**Solutions**:
1. Try different `tooltipPosition`: `'top'`, `'bottom'`, `'left'`, `'right'`, `'center'`
2. Use `'center'` for large or edge elements
3. Adjust `highlightPadding` to give more space
4. Ensure target element is scrolled into view before spotlight

### Spotlight Targeting Wrong Element

**Problem**: Multiple elements match selector

**Solutions**:
1. Make `data-tour` more specific: `section-name-input` not just `input`
2. Use descendant selectors: `[data-tour="section-form"] [data-tour="name-input"]`
3. Add unique IDs to distinguish similar elements
4. Target parent container and use step actions to guide user

### Navigation Not Working

**Problem**: Clicking "Next" doesn't navigate to story

**Solutions**:
1. Verify `storyId` in task's `completionCriteria`
2. Check Storybook API access: Should log API methods on mount
3. Use correct story ID format: `'pages-sections--default'`
4. Test in actual Storybook (not just component tests)

## Best Practices

### 1. Progressive Enhancement
Add `data-tour` attributes incrementally. Application works without them.

### 2. Semantic Naming
Use clear, descriptive names that indicate purpose:
- ✅ `create-assignment-button`
- ❌ `btn-1`

### 3. Stable Selectors
Target elements that won't change frequently:
- ✅ `data-tour` attributes
- ❌ CSS classes (may change with styling)

### 4. Minimal Coverage
Only add to elements referenced in spotlight configs. Don't over-attribute.

### 5. Test Both Modes
Verify spotlight works correctly in both Tutorial and Quiz modes.

### 6. Accessibility
Ensure spotlight doesn't break keyboard navigation or screen readers.

## Integration Checklist

When implementing a new feature with onboarding:

- [ ] Add task definition to `.storybook/code/onboarding-tasks.ts`
- [ ] Create spotlight config in `.storybook/code/spotlight-configs.ts`
- [ ] Add `data-tour` attributes to UI components
- [ ] Test spotlight tour in OnboardingPanel
- [ ] Document in component README/stories
- [ ] Add interaction tests
- [ ] Verify accessibility
- [ ] Test in real application (not just Storybook)

## Related Documentation

- [Onboarding System Overview](./ONBOARDING_README.md)
- [Onboarding Panel Access](./ONBOARDING_PANEL_ACCESS.md)
- [SpotlightOverlay Component](./docs/ONBOARDING_SPOTLIGHT_COMPONENT.md)
- [Spotlight Configuration Reference](./docs/ONBOARDING_SPOTLIGHT_CONFIGS.md)

## Example Pull Request

When adding spotlight support:

```
Title: Add spotlight tour for Dictionary Editor

Changes:
- Added data-tour attributes to DictionaryEditor2.js
- Created spotlight config for instructor-create-vocabulary task
- Updated OnboardingPanel to use new config
- Added interaction tests

Testing:
1. Open Storybook
2. Navigate to OnboardingPanel
3. Select "Instructor" persona
4. Click "Add Vocabulary Words" task
5. Verify spotlight highlights:
   - Dictionary Editor page
   - Add Word button
   - Word form
   - Audio upload
6. Complete tour and mark task done
```

## FAQ

**Q: Do I need data-tour on every element?**  
A: No, only on elements targeted by spotlight configs.

**Q: What if my component is highly dynamic?**  
A: Target the most stable parent container and use tooltip step actions to guide users.

**Q: Can spotlight work across page navigations?**  
A: Yes, if you navigate in a step's `onClick` handler before highlighting.

**Q: How do I test spotlight without implementing the full feature?**  
A: Use mock data in Storybook stories with required `data-tour` attributes.

**Q: Can I have multiple spotlights at once?**  
A: No, only one spotlight tour can be active at a time.

---

## Need Help?

Check out the example implementations in:
- `.storybook/components/OnboardingPanel.tsx`
- `.storybook/code/spotlight-configs.ts`
- `.storybook/components/SpotlightOverlay.tsx`

Or refer to the comprehensive documentation in this repository's `docs/` directory.
