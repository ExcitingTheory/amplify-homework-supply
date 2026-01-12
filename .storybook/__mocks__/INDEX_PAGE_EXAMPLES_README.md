# Index Page Mock Data Examples

Complete mock data for testing the student/instructor dashboard (index page).

## Quick Start

```javascript
import { seedIndexPageData } from './__mocks__/index-page-examples';

// In your story decorator or loader
seedIndexPageData('student'); // Student dashboard
seedIndexPageData('instructor'); // Instructor dashboard
seedIndexPageData('empty'); // New user, no data
```

## Available Scenarios

### 1. Student Dashboard (`'student'`)
Complete student experience with assignments, sections, and grades.

**Data includes:**
- **4 Units** (Japanese greetings, numbers, daily activities, kanji basics)
- **2 Sections** (enrolled in Japanese 101 and 102)
- **4 Assignments** from instructors
- **3 Grades** showing progression:
  - Unit 1: Completed (94%), then retaken (97%)
  - Unit 2: In progress (60% complete, 88% accuracy)
  - Unit 3 & 4: Not started

**Use case:** Testing student view of assignments, completion tracking, grade display

### 2. Instructor Dashboard (`'instructor'`)
Instructor view showing sections they teach and assignments they've created.

**Data includes:**
- **4 Units** (same units as student)
- **1 Section** (Japanese 101 - they own it)
- **2 Assignments** they created for their section
- **0 Grades** (instructors view student grades separately)

**Use case:** Testing instructor assignment creation, section management

### 3. Empty Dashboard (`'empty'`)
Brand new user with no data.

**Data includes:**
- **0 Units**
- **0 Sections**
- **0 Assignments**
- **0 Grades**

**Use case:** Testing onboarding flow, empty state messages, "Join Section" prompts

## Data Structure Details

### Units
Units represent learning modules with content.

```javascript
{
  id: 'unit-japanese-1',
  name: 'Introduction to Japanese Greetings',
  description: 'Learn basic Japanese greetings',
  owner: 'teacher-1',
  identityId: 'us-east-1:teacher-identity-1',
  data: JSON.stringify({ root: { children: [...] } }), // Lexical JSON
  featuredImage: 'public/units/japanese-greetings.jpg',
  published: true,
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-10T15:00:00Z',
  _version: 3,
  _lastChangedAt: 1705418400000,
  _deleted: false,
}
```

### Sections
Sections are classes/groups that students join.

**Important:** Students appear enrolled in sections they DON'T own. The index page filters:
- `mySections` = sections where `owner === user.username` (instructor view)
- `sections` = sections where `owner !== user.username` (student enrolled view)

```javascript
{
  id: 'section-jpn-101',
  name: 'Japanese 101 - Spring 2024',
  description: 'Beginner Japanese language course',
  owner: 'teacher-1', // Instructor who created it (NOT the student)
  identityId: 'us-east-1:teacher-identity-1',
  joinCode: 'JPN101SPRING',
  featuredImage: 'public/sections/jpn-101.jpg',
  active: true,
  createdAt: '2024-01-01T08:00:00Z',
  updatedAt: '2024-01-01T08:00:00Z',
  _version: 1,
  _lastChangedAt: 1705395600000,
  _deleted: false,
}
```

### Assignments
Assignments link units to students with due dates.

**Important ownership pattern:**
- `studentAssignments`: Assignment `owner` is the student who receives it
- `instructorAssignments`: Assignment `owner` is the instructor who created it

The index page logic filters by `owner` to show "My Assignments" (owned by user) vs "Assignments" (owned by others).

```javascript
// Student receives this assignment
{
  id: 'assignment-1',
  unitID: 'unit-japanese-1',
  sectionID: 'section-jpn-101',
  owner: 'student-alice-sub', // Assignment belongs to student
  instructor: 'teacher-1', // Who assigned it
  dueDate: '2024-01-25T23:59:00Z',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  _version: 1,
  _lastChangedAt: 1705489200000,
  _deleted: false,
}

// Instructor creates this assignment
{
  id: 'assignment-instructor-1',
  unitID: 'unit-japanese-1',
  sectionID: 'section-jpn-101',
  owner: 'teacher-1', // Assignment belongs to instructor
  instructor: 'teacher-1',
  dueDate: '2024-01-25T23:59:00Z',
  createdAt: '2024-01-15T09:00:00Z',
  updatedAt: '2024-01-15T09:00:00Z',
  _version: 1,
  _lastChangedAt: 1705485600000,
  _deleted: false,
}
```

### Grades
Student progress and submissions on units.

```javascript
{
  id: 'grade-alice-1',
  unitID: 'unit-japanese-1',
  owner: 'student-alice-sub',
  identityId: 'identity-alice',
  instructor: 'teacher-1',
  unitVersion: 1,
  percentComplete: 100,
  accuracy: 94,
  complete: true,
  timerStarted: true,
  data: JSON.stringify({
    'quiz-block-1': { complete: true, accuracy: 100 },
    'meaning-assoc-1': { complete: true, accuracy: 95 }
  }),
  feedback: JSON.stringify({
    overall: 'Excellent work!'
  }),
  files: [],
  moderationStatus: 'approved',
  moderationFlags: null,
  moderationCheckedAt: '2024-01-20T14:00:00Z',
  createdAt: '2024-01-16T10:00:00Z',
  updatedAt: '2024-01-20T13:30:00Z',
  _version: 8,
  _lastChangedAt: 1705753800000,
  _deleted: false,
}
```

## Index Page Logic

The index page groups data by:

1. **Assignments** - Assignments owned by others (received from instructors)
   - Shows "needs grading" if no complete grade exists for that unit
   - Shows "completed" if a grade exists with `complete: true`

2. **Completed Assignments** - Assignments with grades
   - Displays highest, last, average accuracy
   - Shows attempt count ("Level 3" badge)
   - Grayed out featured image

3. **My Assignments** - Assignments owned by current user (instructor-created)
   - Shows edit controls
   - Links to unit editor

4. **Sections** - Sections user has joined (not owned by them)
   - Links to section view

5. **My Sections** - Sections owned by current user
   - Links to section management

## Testing Different States

### Assignment States

```javascript
// Not started - no grade exists
const assignment = studentAssignments[3]; // unit-kanji-basics
// Will show in "Assignments" section

// In progress - grade exists but not complete
const assignment = studentAssignments[1]; // unit-japanese-2
const grade = studentGrades[2]; // percentComplete: 60, complete: false
// Will show in "Assignments" section

// Completed - grade exists and complete
const assignment = studentAssignments[0]; // unit-japanese-1
const grade = studentGrades[0]; // percentComplete: 100, complete: true
// Will show in "Completed Assignments" section
```

### Multiple Attempts

Student can retake units multiple times:

```javascript
const grades = studentGrades.filter(g => g.unitID === 'unit-japanese-1');
// 2 grades: 94% and 97%
// Index calculates:
// - highest: 97%
// - last: 97% (by updatedAt)
// - average: (94 + 97) / 2 = 95.5%
// - count: 2 attempts
```

## Direct Access to Data

Import individual datasets if you need specific data without seeding:

```javascript
import {
  mockUnits,
  mockSections,
  studentAssignments,
  instructorAssignments,
  studentGrades,
  studentDashboardData,
  instructorDashboardData,
  emptyDashboardData,
} from './__mocks__/index-page-examples';

// Use individual unit
console.log(mockUnits['unit-japanese-1']);

// Use complete dataset
const { units, sections, assignments, grades } = studentDashboardData;
```

## Example Story

```javascript
import { seedIndexPageData } from '../.storybook/__mocks__/index-page-examples';
import { clearMockUnits } from '../.storybook/__mocks__/aws-amplify-datastore';

export default {
  title: 'Pages/Index',
  component: Index,
  decorators: [
    (Story) => {
      clearMockUnits(); // Clear between stories
      seedIndexPageData('student'); // Load student data
      return <Story />;
    }
  ],
};

export const StudentDashboard = {};
export const InstructorDashboard = {
  decorators: [
    (Story) => {
      clearMockUnits();
      seedIndexPageData('instructor');
      return <Story />;
    }
  ]
};
export const EmptyState = {
  decorators: [
    (Story) => {
      clearMockUnits();
      seedIndexPageData('empty');
      return <Story />;
    }
  ]
};
```

## Tips

1. **Always clear before seeding**: Call `clearMockUnits()` before `seedIndexPageData()` to prevent data from previous stories

2. **Username must match**: Set mock auth username to match the data:
   - Student: `'student-alice-sub'`
   - Instructor: `'teacher-1'`
   - Empty: `'new-student'`

3. **Featured images**: Mock images won't load unless Storage is mocked. Use `aws-amplify-storage` mock if needed.

4. **Assignment ownership**: Remember the `owner` field determines whose dashboard it appears on:
   - Student view: `assignments.filter(a => a.owner !== user.username)` - received
   - Instructor view: `assignments.filter(a => a.owner === user.username)` - created

5. **Grade calculation**: The index page aggregates grades by `unitID` to show stats. Multiple grades for the same unit show progression over time.
