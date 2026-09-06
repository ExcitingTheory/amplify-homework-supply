# Dashboard Visual Refresh Plan

## Purpose

Improve the student and instructor dashboards so they are easier to scan, more user friendly, and more visually intentional. The goal is not to add more dashboard content. The goal is to make the existing content answer each user's main question faster.

- Students need momentum: "What should I do next?"
- Instructors need triage: "Who needs attention, and what should I do about it?"

## Current Surfaces

- Student dashboard route: `app/[locale]/DashboardClient.jsx`
- Student dashboard components: `src/components/Dashboard/SectionPanel.tsx`, `src/components/Dashboard/AssignmentCard.tsx`, `src/components/Dashboard/UpNextCard.tsx`
- Instructor dashboard: `src/components/InstructorDashboard.jsx`
- Dashboard stories: `src/stories/index.stories.jsx`, `src/components/InstructorDashboard.stories.jsx`, `src/components/Dashboard/*.stories.tsx`
- Related learner UX plan: `docs/LEARNER_DASHBOARD_UX_PLAN.md`

## Design Direction

### Role-Specific Priority

The dashboards should have different visual priorities because the users are doing different jobs.

For students, the first screen should make the next action unmistakable. The current dashboard already has a hero, section panels, an up-next card, assignment cards, and gamification content. The refresh should reduce competition between those elements and make the next assignment the primary object on the page.

For instructors, the first screen should surface class health and intervention needs. The existing instructor dashboard already calculates useful signals: total students, active students, average grade, moderation alerts, at-risk learners, section progress, recent activity, and top students. The refresh should reorganize those signals into a triage-first layout.

### Visual System

Replace the current heavy gradient-card feel with a calmer dashboard system:

- Light neutral page background with subtle warmth
- White or near-white panels with restrained borders
- One primary accent per role
- Meaningful status colors only for completion, warning, overdue, and moderation states
- Consistent radii, spacing, card padding, and elevation
- Typography and spacing used for hierarchy instead of strong decorative gradients

Suggested role accents:

- Student: focused blue or teal for learning momentum
- Instructor: green or slate for class health and operations
- Warning/error colors reserved for actual intervention states

## Student Dashboard Improvements

### 1. Redesign the Hero as a Today Panel

The current hero combines greeting, avatar, level, XP, streak, badges, squad status, and next assignment context. That is useful information, but it competes for attention.

Change the hero into a compact "Today" panel with:

- Greeting and learner identity
- Current level/progress in a restrained secondary position
- One dominant next assignment callout
- Due date urgency and section name
- One primary action: start or continue
- Optional secondary action: practice focus areas

Move secondary gamification details, such as badge shelf and squad banner, below the main next-action area.

### 2. Strengthen the Global Next Step

The global next-step banner in `DashboardClient.jsx` is the most important student element. Make it feel like the page's primary workflow rather than a small inline alert.

Recommended changes:

- Larger title treatment: "Your next step"
- Unit title as the dominant text
- Section name and due date as metadata
- Clear due urgency state: due soon, overdue, no due date
- Primary contained action aligned consistently
- Optional compact thumbnail or subject icon

### 3. Polish Assignment Cards

`AssignmentCard.tsx` is functional but visually dense. The title row can accumulate difficulty dots, prefetch badge, grade chip, nailed-it chip, lock chip, and due chip.

Recommended card structure:

- Media or icon column
- Title and short description
- Metadata row for due date, difficulty, locked status, and prefetch state
- Result/progress row for completed assignments
- Action row with one primary action and quieter secondary actions

Reduce chip competition by moving some metadata into smaller text rows or tooltips. Keep chips for meaningful state only: overdue, locked, completed, nailed-it.

### 4. Make Section Panels Feel Like Course Panels

`SectionPanel.tsx` is the right abstraction. Improve its visual hierarchy so each enrolled section feels like a mini course dashboard.

Each section summary should show:

- Section name
- Pending count
- Completed count
- Completion percentage
- Current or next due assignment
- Optional campaign chapter teaser

Inside the expanded panel:

- Up-next card first
- Remaining assignments second
- Completed assignments behind progressive disclosure
- Campaign timeline and briefing close to the section they belong to

### 5. Improve Mobile Student Layout

On mobile, the dashboard should prioritize tap targets and avoid visual crowding.

Recommended mobile behavior:

- Compact hero with next action visible without excessive scrolling
- Section panels stacked full width
- Assignment cards without large thumbnails, or with small square thumbnails
- Action buttons at the bottom of cards with stable spacing
- Clear spacing between interactive elements

## Instructor Dashboard Improvements

### 1. Redesign the Top Area as Class Health + Needs Attention

The current instructor summary bar shows aggregate performance, total students, active students, average grade, and moderation alerts. Keep those metrics, but add a more actionable hierarchy.

Recommended top layout:

- Class Health metric group: students, active this week, average grade, completion rate
- Needs Attention panel: flagged content, at-risk students, overdue work, low-completion sections
- Primary action shortcuts: manage sections, review flagged content, open grade review

The first visible instructor question should be: "What needs my attention today?"

### 2. Rework Section Cards Into Scannable Analytic Panels

The current instructor section cards are vertically rich but can become long. Convert each section card into a clearer analytic panel.

Recommended section card layout:

- Header: section name, join code, alert chips, manage button
- Left area: class health, average grade, completion percentage
- Middle area: class progress by unit
- Right area: students needing support and recent activity
- Footer: secondary actions such as skill tree, peer review, analytics

This makes multiple sections easier to compare without every card becoming a long report.

### 3. Prioritize Intervention Over Leaderboards

Top students are useful, but they should not outrank intervention workflows on an instructor dashboard.

Recommended changes:

- Keep the top-students list as a secondary section
- Make at-risk students more prominent
- Show recent submissions requiring review ahead of leaderboard content
- Consider a section-level tab or segmented control: Overview, Needs Support, Activity, Top Students

### 4. Make Alerts More Actionable

Moderation and at-risk alerts should include direct next steps.

Recommended alert treatment:

- Alert title with count
- Short list of the highest-priority items
- Direct action button for each item or a grouped "Review all" action
- Keep the full chip list behind expansion when there are many items

### 5. Improve Instructor Mobile Layout

Instructor analytics should collapse carefully on smaller screens.

Recommended mobile behavior:

- Summary metrics in a compact 2x2 grid
- Needs Attention immediately below summary
- Section cards collapsed by default
- Detailed analytics behind expand controls or tabs
- Avoid wide table-like rows that compress poorly

## Shared UI Improvements

### 1. Define Dashboard Tokens

Create shared dashboard styling conventions so student and instructor surfaces feel related.

Suggested tokens:

- Panel radius: 12px
- Card radius: 8px
- Border: `1px solid` with `divider`
- Primary panel padding: 24px desktop, 16px mobile
- Card padding: 16px
- Section gap: 24px
- Item gap: 12px to 16px

These can begin as local `sx` constants or small helper objects before becoming theme-level tokens.

### 2. Reduce Decorative Gradients

Use gradients sparingly. Reserve them for rare celebratory or campaign surfaces, not every primary dashboard container.

For day-to-day dashboards, prefer:

- Subtle background bands
- Thin accent borders
- Small status icons
- Strong text hierarchy
- Consistent whitespace

### 3. Normalize Empty and Loading States

Make loading states mimic the final layout so the page feels stable.

Student empty state should include:

- Join-section primary action
- Join code entry if available in the flow
- A short preview of what appears after joining

Instructor empty state should include:

- Create section action
- Short explanation of sections
- Next action for creating or assigning content

### 4. Improve Accessibility and Cognitive Load

Preserve the current accessibility direction and strengthen it where visual changes are made.

Checklist:

- Keep section landmarks and useful aria labels
- Keep the skip link
- Preserve reduced-motion handling
- Avoid relying on color alone for grade/urgency states
- Ensure focus states are visible on cards and action buttons
- Keep text readable on mobile and avoid clipped card labels

## Implementation Plan

### Phase 1: Visual System Foundation

- Add local dashboard style constants for panel, card, spacing, and status treatments.
- Update the dashboard page background and spacing.
- Replace heavy hero gradients with calmer panel styling.
- Verify student and instructor stories still render.

### Phase 2: Student Refresh

- Redesign the student hero into a Today panel.
- Promote the global next-step card visually.
- Simplify `AssignmentCard.tsx` metadata layout.
- Refine `SectionPanel.tsx` summary hierarchy.
- Check mobile layouts in Storybook.

### Phase 3: Instructor Refresh

- Redesign the instructor summary as Class Health plus Needs Attention.
- Rework section cards into a clearer analytic grid.
- Move at-risk and review-needed content ahead of leaderboard content.
- Collapse or secondary-position leaderboard content.
- Check multi-section and no-section stories.

### Phase 4: Polish and Validation

- Add or update Storybook stories for important visual states.
- Validate desktop and mobile screenshots.
- Check keyboard navigation through hero, section panels, assignment cards, and instructor actions.
- Run focused lint/type checks for touched files.

## Storybook Validation Matrix

Use Storybook as the primary visual workbench before full app validation.

Student states:

- Active learner with multiple sections
- One urgent assignment due soon
- Overdue assignment
- Completed assignments with grades
- Locked assignment
- Empty state with no sections
- Mobile viewport

Instructor states:

- Multiple sections
- Single section
- No sections
- Flagged moderation content
- At-risk students
- No grade data yet
- Mobile viewport

## Success Criteria

- A student can identify the next assignment within three seconds.
- An instructor can identify the most urgent class issue within three seconds.
- Dashboard cards have consistent spacing, radii, and action placement.
- Secondary gamification content supports the workflow without competing with it.
- Instructor intervention content is more prominent than leaderboard content.
- Mobile layouts remain readable and tappable.
- Storybook contains enough states to review the visual system without needing live data.
