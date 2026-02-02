# Quiz Mode Navigation Update - Summary

## Overview

Updated the instructor onboarding Quiz Mode to navigate to **specific component stories** instead of generic "Application Pages". Each task now has targeted navigation links that take users directly to the relevant Storybook components where they can practice.

**Date**: February 1, 2026  
**Status**: ✅ Complete

---

## What Changed

### Before
- Quiz Mode showed generic instruction: "Navigate to **📄 Pages → Application Pages**"
- All tasks directed users to the same generic page
- Users had to manually find the right component
- No task-specific guidance

### After
- Each task has **task-specific navigation links**
- Primary button navigates to the most relevant story
- Alternative links provide additional practice options
- Clear, targeted guidance for each task

---

## Files Modified

### 1. [QuizMode.tsx](.storybook/components/QuizMode.tsx)
**Changes**:
- Added `TASK_NAVIGATION` mapping object with task-specific story links
- Replaced generic `APP_PAGES_URL` with per-task navigation
- Added support for alternative story links
- Updated UI to show primary and alternative navigation options

**New Task Navigation Structure**:
```typescript
const TASK_NAVIGATION: Record<string, TaskNavigation> = {
  'instructor-create-unit': {
    primary: '?path=/story/📄-pages-application-pages--units',
    label: 'Open Units Page',
    alternatives: [
      { url: '?path=/story/📚-creating-lessons-editor--default', label: 'Editor' },
      { url: '?path=/story/📄-pages-application-pages--unit-detail', label: 'Unit Detail' }
    ]
  },
  // ... 20+ task mappings
};
```

### 2. [QuizMode.css](.storybook/components/QuizMode.css)
**Changes**:
- Updated `.quiz-actions` to flex column layout
- Added `.alternative` button styling
- Added `.alternative-links` container styling
- Added `.alternatives-label` text styling
- Improved button hierarchy and visual distinction

### 3. [OnboardingPanel.tsx](.storybook/components/OnboardingPanel.tsx)
**Changes**:
- Updated Quiz Mode instructions text
- Changed from "Navigate to Pages → Application Pages" to "Click on tasks to navigate to interactive component stories"
- Reflects new task-specific navigation approach

### 4. [ONBOARDING_MODES.md](.storybook/components/ONBOARDING_MODES.md)
**Changes**:
- Updated Quiz Mode documentation
- Added task-to-story mapping examples
- Documented primary and alternative link structure
- Referenced new navigation guide

### 5. [INSTRUCTOR_QUIZ_MODE_NAVIGATION.md](docs/INSTRUCTOR_QUIZ_MODE_NAVIGATION.md) ⭐ NEW
**Complete navigation guide** with:
- Detailed instructions for each of 8 instructor tasks
- Story links with proper URL format
- Step-by-step completion guidance
- Story ID reference table
- Navigation tips and URL patterns
- Developer implementation guide

---

## Task Navigation Mapping

| Task | Primary Story | Alternatives |
|------|--------------|--------------|
| **Setup First Class** | Pages → Sections | Section Assigner Component |
| **Create Unit** | Pages → Units | Editor, Unit Detail |
| **Add Quiz Block** | Editor → Quiz Plugin | Full Editor |
| **Add Vocabulary** | Editor → Word Block Plugin | Vocabulary Review |
| **Create Assignment** | Pages → Section Detail | Section Assigner |
| **View Grades** | Pages → Section Detail | Student Workbook View |
| **Use AI Assistant** | Components → Chat Sidebar | AI Completion, Enhanced Generation |
| **Learn Shortcuts** | Help → Keyboard Shortcuts Trainer | Automated Demo, Practice in Editor |

Plus mappings for:
- 6 Learner tasks
- 3 Developer tasks  
- 4 Secret/Extra Credit tasks

**Total**: 21+ task-to-story mappings

---

## User Experience Improvements

### More Targeted Practice
- Users land exactly where they need to practice
- No searching through component library
- Immediate access to relevant functionality

### Multiple Learning Paths
- Primary link for most common approach
- Alternative links for different perspectives
- Example: Unit creation via Units page OR Editor OR Unit Detail

### Better Context
- Task instructions shown with navigation
- Clear explanation of what to practice
- Steps to complete visible before navigating

### Consistent Experience
- All personas (Instructor, Learner, Developer) supported
- Fallback to generic docs page for unmapped tasks
- Graceful handling of missing navigation data

---

## Story Link Format

All navigation uses Storybook URL format:
```
?path=/story/[category-slug]--[story-name]
```

### Examples:
- `?path=/story/📄-pages-application-pages--units`
- `?path=/story/📚-creating-lessons-editor--default`
- `?path=/story/components-chatsidebar--default`
- `?path=/story/help-keyboard-shortcuts--keyboard-shortcut-trainer`

### Category Prefixes:
- `📄-pages-application-pages--*` - Full page examples
- `📚-creating-lessons-editor--*` - Editor and plugins
- `🧩-components-*` - Individual components
- `⌨️-help-keyboard-shortcuts--*` - Help and training

---

## Testing Checklist

To verify the changes work correctly:

### 1. Start Storybook
```bash
npm run storybook
```

### 2. Open Onboarding Panel
- Click "Onboarding" at bottom of screen
- Select "Instructor" persona
- Switch to "Quiz" mode

### 3. Test Task Navigation
For each instructor task:
- [ ] Click expand icon to see details
- [ ] Verify story link button shows task-specific label
- [ ] Click primary button - should navigate to correct story
- [ ] Go back, try alternative links if available
- [ ] Verify all links work and go to expected stories

### 4. Test Other Personas
- [ ] Repeat for "Learner" persona (6 tasks)
- [ ] Repeat for "Developer" persona (9 tasks including secrets)

### 5. Verify Fallback
- Create a test task without navigation mapping
- Should show "Browse Application Pages" fallback

---

## Future Enhancements

### Potential Improvements:
1. **Deep linking**: Pass `taskId` as query param so story knows which task is active
2. **Progress indicators**: Show completion status in the target story
3. **Breadcrumb navigation**: "You are here" indicator in stories
4. **Auto-completion detection**: Stories detect when user completes actions
5. **Story metadata**: Add `onboardingTaskIds` to story metadata for reverse lookup
6. **Search integration**: "Find story for task X" search command

### Maintenance:
- Keep navigation mapping in sync when adding new tasks
- Update story IDs if stories are renamed/moved
- Add tests to verify all story links are valid
- Document pattern for contributors adding new onboarding tasks

---

## Developer Notes

### Adding New Tasks

When adding a new onboarding task:

1. **Define task** in `.storybook/code/onboarding-tasks.ts`
2. **Add navigation** to `TASK_NAVIGATION` in `QuizMode.tsx`:
   ```typescript
   'your-task-id': {
     primary: '?path=/story/category--story-name',
     label: 'Open Component Name',
     alternatives: [
       { url: '?path=/story/other-category--story', label: 'Alternative' }
     ]
   },
   ```
3. **Document** in `INSTRUCTOR_QUIZ_MODE_NAVIGATION.md` (or relevant persona doc)
4. **Test** navigation links work correctly

### Finding Story IDs

To find the story ID for a component:
1. Navigate to the story in Storybook
2. Check URL: `...?path=/story/[STORY-ID-HERE]`
3. Or check the story file's `title` and `export const StoryName`
4. Format: `title.toLowerCase().replace(/\s+/g, '-')--story-name-lowercase`

### Story Link Helper (Future)

Consider creating a helper function:
```typescript
function getStoryUrl(title: string, storyName: string = 'default'): string {
  const titleSlug = title.toLowerCase().replace(/\s+/g, '-');
  const storySlug = storyName.toLowerCase().replace(/\s+/g, '-');
  return `?path=/story/${titleSlug}--${storySlug}`;
}
```

---

## Related Documentation

- [ONBOARDING_MODES.md](.storybook/components/ONBOARDING_MODES.md) - Overall onboarding system
- [INSTRUCTOR_QUIZ_MODE_NAVIGATION.md](docs/INSTRUCTOR_QUIZ_MODE_NAVIGATION.md) - Detailed navigation guide
- [onboarding-tasks.ts](.storybook/code/onboarding-tasks.ts) - Task definitions
- [QuizMode.tsx](.storybook/components/QuizMode.tsx) - Component implementation
- [OnboardingPanel.tsx](.storybook/components/OnboardingPanel.tsx) - Progress tracking

---

## Questions or Issues?

If navigation links break or stories are moved:
1. Check story still exists at that ID
2. Update `TASK_NAVIGATION` mapping
3. Update documentation
4. Test all affected tasks

Contact: ExcitingTheory team

---

**Implementation Status**: ✅ Complete  
**Documentation**: ✅ Complete  
**Testing**: ⏳ Pending user verification
