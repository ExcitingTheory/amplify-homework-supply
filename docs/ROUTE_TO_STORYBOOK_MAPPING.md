# Frontend Route to Storybook Story Mapping

This document maps all Next.js frontend routes to their corresponding Storybook stories for development and testing.

## Quick Reference

**All routes are configured in Storybook's Next.js router** - links will navigate between stories automatically.

### Main Application Routes

```
/                    → 📄 Pages/Application Pages → Index
/profile             → 📄 Pages/Application Pages → Profile
/sections            → 📄 Pages/Application Pages → Sections
/section/[id]        → 📄 Pages/Application Pages → SectionDetail
/units               → 📄 Pages/Application Pages → Units
/unit/[id]           → 📄 Pages/Application Pages → UnitDetail
/workbook/[id]       → 📄 Pages/Application Pages → Workbook
```

### Storybook URLs

```
http://localhost:6006/?path=/story/pages-application-pages--index
http://localhost:6006/?path=/story/pages-application-pages--profile
http://localhost:6006/?path=/story/pages-application-pages--sections
http://localhost:6006/?path=/story/pages-application-pages--section-detail&args=id:section-jpn-101
http://localhost:6006/?path=/story/pages-application-pages--units
http://localhost:6006/?path=/story/pages-application-pages--unit-detail&args=id:unit-japanese-1
http://localhost:6006/?path=/story/pages-application-pages--workbook&args=id:assignment-1
```

---

## Route Mapping Table

> **✅ Router Configured**: All routes below are configured in [.storybook/code/route-map.ts](../.storybook/code/route-map.ts) to enable navigation within Storybook when clicking links.

| Frontend Route | Page Component | Storybook Path | Story Names | Router Config |
|---------------|----------------|----------------|-------------|---------------|
| `/` | [pages/index.js](../pages/index.js) | `📄 Pages/Index` | StudentDashboard, InstructorDashboard, EmptyState, Loading | ✅ |
| `/` | [pages/index.js](../pages/index.js) | `📄 Pages/Application Pages` | Index, IndexNoSections, IndexAssignments | ✅ |
| `/profile` | [pages/profile.js](../pages/profile.js) | `📄 Pages/Application Pages` | Profile, ProfilePasswordChange | ✅ |
| `/sections` | [pages/sections.js](../pages/sections.js) | `📄 Pages/Application Pages` | Sections, SectionsEmptyState | ✅ |
| `/section/[id]` | [pages/section/[id].js](../pages/section/[id].js) | `📄 Pages/Application Pages` | SectionDetail, SectionDetailStudent | ✅ |
| `/units` | [pages/units.js](../pages/units.js) | `📄 Pages/Application Pages` | Units, UnitsEmptyState | ✅ |
| `/unit/[id]` | [pages/unit/[id].js](../pages/unit/[id].js) | `📄 Pages/Application Pages` | UnitDetail | ✅ |
| `/unit/[id]` | [pages/unit/[id].js](../pages/unit/[id].js) | `🎓 Education/Editor` | InstructorView, StudentPreview, etc. | ✅ |
| `/workbook/[id]` | [pages/workbook/[id].js](../pages/workbook/[id].js) | `📄 Pages/Application Pages` | Workbook, WorkbookTimedExercise | ✅ |

## Detailed Story Breakdown

### Home/Dashboard Routes (`/`)

**Location**: [src/stories/index.stories.jsx](../src/stories/index.stories.jsx) AND [src/stories/pages.stories.tsx](../src/stories/pages.stories.tsx)

#### Stories:
1. **StudentDashboard** - Active learner with 4 assignments (1 completed, 3 in progress)
2. **InstructorDashboard** - Teacher managing classes and assignments
3. **EmptyState** - New user with no sections/assignments
4. **Loading** - Loading state while data fetches
5. **Index** (from pages.stories.tsx) - Comprehensive student view
6. **IndexNoSections** - State when user has no sections yet
7. **IndexAssignments** - Focus on pending and completed assignments

**Key Features**:
- Assignment cards with due dates and progress
- Grade statistics (highest, average, completion %)
- Section cards with enrollment info
- Empty state with CTAs

---

### Profile Route (`/profile`)

**Location**: [src/stories/pages.stories.tsx](../src/stories/pages.stories.tsx)

#### Stories:
1. **Profile** - Basic profile viewing/editing
2. **ProfilePasswordChange** - Focused on password change flow

**Key Features**:
- Email update (with confirmation code modal)
- User ID and Identity ID display
- Password change form
- Advanced settings (clear cache)

---

### Sections Routes (`/sections`)

**Location**: [src/stories/pages.stories.tsx](../src/stories/pages.stories.tsx)

#### Stories:
1. **Sections** - List of enrolled/created sections
2. **SectionsEmptyState** - No sections yet, prompts to create

**Key Features**:
- Section cards with featured images
- Create new section dialog
- Instructor dashboard with aggregate stats
- Join section functionality

---

### Section Detail Routes (`/section/[id]`)

**Location**: [src/stories/pages.stories.tsx](../src/stories/pages.stories.tsx)

#### Stories:
1. **SectionDetail** - Instructor view with full gradebook (4 students: Alice, Bob, Carol, Dave)
2. **SectionDetailStudent** - Student view showing only their grades

**Mock Data**:
- **Section**: Japanese 101 - Spring 2024
- **Students**: 
  - Alice: 97%, 88% on 2 assignments
  - Bob: 87%, 82% on 2 assignments
  - Carol: 91% (1 complete), 60% (1 in-progress)
  - Dave: 78%, 84% on 2 assignments
- **Assignments**: 2 unit assignments with different due dates

**Key Features**:
- Grade cell override (click to manually set grade)
- Curve settings (scale-to-top, linear-adjustment)
- Assignment selection for curve application
- Featured image drag-and-drop upload
- Student roster table
- Instructor/Student view toggle
- Show/hide future and draft assignments

---

### Units Routes (`/units`)

**Location**: [src/stories/pages.stories.tsx](../src/stories/pages.stories.tsx)

#### Stories:
1. **Units** - Published, draft, and archived units
2. **UnitsEmptyState** - No units, prompts to create

**Key Features**:
- Three-section layout (Published/Drafts/Archived)
- Unit cards with featured images
- Create new unit button
- Links to editor and workbook views

---

### Unit Editor Routes (`/unit/[id]`)

**Location**: 
- [src/stories/pages.stories.tsx](../src/stories/pages.stories.tsx) - Full page story
- [src/components/Editor3/Editor.stories.jsx](../src/components/Editor3/Editor.stories.jsx) - Component stories

#### Page Stories:
1. **UnitDetail** - Full page editor view

#### Component Stories (Editor3):
1. **InstructorView** - Default editor mode
2. **StudentPreview** - Preview as student
3. **WithExistingContent** - Editor with loaded content
4. **EmptyEditor** - Blank slate
5. **WithChat** - Editor with AI chat sidebar
6. **WithToolbarExpanded** - All toolbar options visible
7. **MobileView** - Mobile-responsive layout
8. **DarkMode** - Dark theme variant

**Key Features**:
- Lexical rich text editor
- Custom nodes (Quiz, Answer, Meaning Association, Custom Answer)
- Media upload (images, audio, video)
- Dictionary integration
- File management
- Section assignment
- Publishing controls
- Moderation tools

---

### Workbook Routes (`/workbook/[id]`)

**Location**: [src/stories/pages.stories.tsx](../src/stories/pages.stories.tsx)

#### Stories:
1. **Workbook** - Standard workbook view
2. **WorkbookTimedExercise** - Timer interface before starting

**Key Features**:
- Read-only content view
- Interactive exercise blocks
- Answer submission
- Grade display (accuracy, completion %)
- Timer countdown (for timed exercises)
- Recent grades history

---

## Component-Level Stories

While not full pages, these components are heavily featured in the routes above:

### Editor Component
**Location**: [src/components/Editor3/Editor.stories.jsx](../src/components/Editor3/Editor.stories.jsx)

Stories include interactions like:
- Adding quiz blocks
- Uploading images/audio
- Assigning to sections
- Publishing units
- Using AI chat

### Chat Sidebar
**Location**: [src/components/ChatSidebar.stories.jsx](../src/components/ChatSidebar.stories.jsx)

Features demonstrated:
- `create_section` tool
- `create_assignment` tool
- Content search tools
- Streaming responses

### Other Key Components
- **MainToolbar** - Navigation bar ([src/components/MainToolbar.stories.jsx](../src/components/MainToolbar.stories.jsx))
- **SectionAssigner** - Assignment creation ([src/components/SectionAssigner.stories.jsx](../src/components/SectionAssigner.stories.jsx))
- **VocabularyReview2** - Vocab practice ([src/components/VocabularyReview2.stories.tsx](../src/components/VocabularyReview2.stories.tsx))
- **QuestionBlock** - Quiz questions ([src/components/QuestionBlock.stories.jsx](../src/components/QuestionBlock.stories.jsx))

---

## Router Configuration

### How It Works

The Storybook Next.js router is configured in [.storybook/code/route-map.ts](../.storybook/code/route-map.ts) to:

1. **Map Routes to Stories**: When you click a link in a story (e.g., `<a href="/units">`), the router intercepts it and navigates to the corresponding Storybook story
2. **Handle Dynamic Routes**: Routes with `[id]` parameters are automatically matched and the ID is passed as a story arg
3. **Track Navigation**: Navigation events are logged for onboarding task completion

### Route Resolution Example

```javascript
// In your component:
<Button href="/section/jpn-101">View Section</Button>

// Router intercepts and converts to:
?path=/story/pages-application-pages--section-detail&args=id:jpn-101
```

### Supported Routes

All routes in the table above are configured and will navigate within Storybook when clicked. See [route-map.ts](../.storybook/code/route-map.ts) for the complete mapping.

---

## Usage Guide

### Viewing a Route in Storybook

1. Start Storybook: `npm run storybook`
2. Navigate to the story path (e.g., `📄 Pages/Application Pages`)
3. Select the specific story variant
4. Interact with the component in isolation
5. Click links - they will navigate to other stories!

### Mock Data Sources

All page stories use mock data from:
- [.storybook/__mocks__/index-page-examples.js](../.storybook/__mocks__/index-page-examples.js) - `seedIndexPageData()`
- [.storybook/__mocks__/aws-amplify-auth.js](../.storybook/__mocks__/aws-amplify-auth.js) - `setMockUser()`
- [.storybook/__mocks__/aws-amplify-datastore.ts](../.storybook/__mocks__/aws-amplify-datastore.ts) - DataStore queries
- [.storybook/__mocks__/ui-data/](../.storybook/__mocks__/ui-data/) - Component-specific data

### Running Interaction Tests

Many stories include play functions that simulate user interactions:

```bash
# Run all interaction tests
npm run test-storybook

# Run tests for specific story
npm run test-storybook -- --grep "StudentDashboard"
```

---

## Route Parameters

### Dynamic Routes

Routes with `[id]` use Next.js dynamic routing:

```javascript
// In Storybook, set via parameters:
parameters: {
  nextRouter: {
    pathname: '/section/[id]',
    query: { id: 'section-jpn-101' },
    isReady: true,
  },
}
```

**Common IDs**:
- Sections: `section-jpn-101`, `section-jpn-102`
- Units: `unit-japanese-1`, `unit-japanese-2`
- Assignments: `assignment-1`, `assignment-2`
- Students: `student-alice-sub`, `student-bob-sub`, `student-carol-sub`, `student-dave-sub`
- Teachers: `teacher-1`

---

## Testing Workflows

### Student Flow
1. **Index** (StudentDashboard) → View pending assignments
2. **Workbook** → Complete an assignment
3. **Index** → See completed grades
4. **SectionDetailStudent** → View all section grades

### Instructor Flow
1. **Units** → Create new unit
2. **UnitDetail** → Edit content with editor
3. **Sections** → Create section
4. *outer Implementation Details

### Configuration Files

1. **[.storybook/code/route-map.ts](../.storybook/code/route-map.ts)** - Route to story mapping
2. **[.storybook/__mocks__/next-router.js](../.storybook/__mocks__/next-router.js)** - Mock `useRouter` hook
3. **[.storybook/preview.jsx](../.storybook/preview.jsx)** - Router context provider

### Adding New Routes

To add a new route:

1. Add the route to `ROUTE_TO_STORY_MAP` in [route-map.ts](../.storybook/code/route-map.ts):
   ```typescript
   '/my-new-page': '?path=/story/pages-application-pages--my-new-page',
   ```

2. Add the corresponding story category to `STORY_CATEGORIES`:
   ```typescript
   'pages-application-pages--my-new-page': 'appropriate-category',
   ```

3. Test navigation by clicking links in existing stories

### Debugging Router Issues

If links aren't working:

1. Check browser console for `[Mock Router]` logs
2. Verify the route exists in `ROUTE_TO_STORY_MAP`
3. Confirm the story ID matches the Storybook URL format (kebab-case)
4. Check that `nextRouter` parameters are set in story config (for dynamic routes)

---

## Related Documentation

- [.storybook/code/route-map.ts](../.storybook/code/route-map.ts) - Router configuration5. **SectionDetail** → View student grades

---

## Accessibility Testing

All page stories support accessibility testing:

```javascript
// In story parameters
parameters: {
  a11y: {
    config: {
      rules: [
        { id: 'color-contrast', enabled: true },
        { id: 'label', enabled: true },
      ]
    }
  }
}
```

Run: `npm run storybook` and check the Accessibility panel.

---

## Related Documentation

- [ONBOARDING.md](./ONBOARDING.md) - Developer setup
- [API.md](./API.md) - Data models
- [EXPERIMENTAL_FEATURES_CATALOG.md](./EXPERIMENTAL_FEATURES_CATALOG.md) - Feature flags
- [E2E_TEST_PLAN.md](./E2E_TEST_PLAN.md) - End-to-end testing
- [Automate Storybook Testing Workflow.md](./Automate%20Storybook%20Testing%20Workflow.md) - Testing automation
