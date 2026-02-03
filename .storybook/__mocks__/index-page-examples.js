/**
 * Index Page Mock Data Examples for Storybook
 * 
 * This file provides comprehensive mock data for the index page (student dashboard),
 * including Units, Assignments, Sections, and Grades.
 * 
 * Data Models:
 * - Unit: Learning modules with content
 * - Assignment: Units assigned to students with due dates
 * - Section: Classes/groups that students join
 * - Grade: Student submissions and progress on units
 */

import { MOCK_MEDIA } from './mockMediaData';
// Gen 1 DataStore seed functions (for legacy pages)
import { 
  seedMockUnit as seedMockUnitGen1, 
  seedMockGrade as seedMockGradeGen1, 
  seedMockSections as seedMockSectionsGen1, 
  seedMockAssignments as seedMockAssignmentsGen1 
} from './aws-amplify-datastore';
// Gen 2 API seed functions (for new pages)
import {
  seedMockUnit as seedMockUnitGen2,
  seedMockGrade as seedMockGradeGen2,
  seedMockSections as seedMockSectionsGen2,
  seedMockAssignments as seedMockAssignmentsGen2
} from './aws-amplify-data';

/**
 * Dual seed function that seeds both Gen 1 DataStore and Gen 2 API mocks
 * This ensures compatibility with pages using either Amplify generation
 */
function seedMockUnit(unit) {
  seedMockUnitGen1(unit);
  seedMockUnitGen2(unit);
}

function seedMockGrade(grade) {
  seedMockGradeGen1(grade);
  seedMockGradeGen2(grade);
}

function seedMockSections(sections) {
  seedMockSectionsGen1(sections);
  seedMockSectionsGen2(sections);
}

function seedMockAssignments(assignments) {
  seedMockAssignmentsGen1(assignments);
  seedMockAssignmentsGen2(assignments);
}

/**
 * Mock Units for Index Page
 */
export const mockUnits = {
  'unit-japanese-1': {
    id: 'unit-japanese-1',
    name: 'Introduction to Japanese Greetings',
    description: 'Learn basic Japanese greetings and self-introduction phrases',
    owner: 'teacher-1',
    identityId: 'us-east-1:teacher-identity-1',
    data: JSON.stringify({
      root: {
        children: [
          {
            type: 'heading',
            tag: 'h1',
            children: [{ type: 'text', text: 'Japanese Greetings' }]
          }
        ]
      }
    }),
    featuredImage: MOCK_MEDIA.FEATURED_CROPPED.JAPANESE_CLASSROOM,
    published: true,
    createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-10T15:00:00Z').toISOString(),
    _version: 3,
    _lastChangedAt: Date.parse('2024-01-10T15:00:00Z'),
    _deleted: false,
  },
  'unit-japanese-2': {
    id: 'unit-japanese-2',
    name: 'Japanese Numbers and Counting',
    description: 'Master numbers 1-100 and counting objects in Japanese',
    owner: 'teacher-1',
    identityId: 'us-east-1:teacher-identity-1',
    data: JSON.stringify({
      root: {
        children: [
          {
            type: 'heading',
            tag: 'h1',
            children: [{ type: 'text', text: 'Numbers and Counting' }]
          }
        ]
      }
    }),
    featuredImage: MOCK_MEDIA.FEATURED_CROPPED.JAPANESE_CULTURE,
    published: true,
    createdAt: new Date('2024-01-05T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-12T15:00:00Z').toISOString(),
    _version: 2,
    _lastChangedAt: Date.parse('2024-01-12T15:00:00Z'),
    _deleted: false,
  },
  'unit-japanese-3': {
    id: 'unit-japanese-3',
    name: 'Daily Activities Vocabulary',
    description: 'Vocabulary for talking about your daily routine',
    owner: 'teacher-1',
    identityId: 'us-east-1:teacher-identity-1',
    data: JSON.stringify({
      root: {
        children: [
          {
            type: 'heading',
            tag: 'h1',
            children: [{ type: 'text', text: 'Daily Activities' }]
          }
        ]
      }
    }),
    featuredImage: MOCK_MEDIA.FEATURED_CROPPED.JAPANESE_MODERN,
    published: true,
    createdAt: new Date('2024-01-10T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-15T15:00:00Z').toISOString(),
    _version: 1,
    _lastChangedAt: Date.parse('2024-01-15T15:00:00Z'),
    _deleted: false,
  },
  'unit-kanji-basics': {
    id: 'unit-kanji-basics',
    name: 'Kanji Basics - First 50 Characters',
    description: 'Introduction to the first 50 essential kanji characters',
    owner: 'teacher-2',
    identityId: 'us-east-1:teacher-identity-2',
    data: JSON.stringify({
      root: {
        children: [
          {
            type: 'heading',
            tag: 'h1',
            children: [{ type: 'text', text: 'Basic Kanji' }]
          }
        ]
      }
    }),
    featuredImage: MOCK_MEDIA.IMAGE_JPEG,
    published: true,
    createdAt: new Date('2024-01-08T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-18T15:00:00Z').toISOString(),
    _version: 4,
    _lastChangedAt: Date.parse('2024-01-18T15:00:00Z'),
    _deleted: false,
  },
};

/**
 * Mock Sections (Classes)
 */
export const mockSections = {
  'section-jpn-101': {
    id: 'section-jpn-101',
    name: 'Japanese 101 - Spring 2024',
    description: 'Beginner Japanese language course',
    owner: 'teacher-1',
    identityId: 'us-east-1:teacher-identity-1',
    learner: 'section-jpn-101-learners', // Cognito group name for students in this section
    code: 'JPN101SPRING',
    status: 'PUBLISHED',
    featuredImage: MOCK_MEDIA.FEATURED_CROPPED.EDUCATION_GENERAL,
    createdAt: new Date('2024-01-01T08:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-01T08:00:00Z').toISOString(),
    _version: 1,
    _lastChangedAt: Date.parse('2024-01-01T08:00:00Z'),
    _deleted: false,
  },
  'section-jpn-102': {
    id: 'section-jpn-102',
    name: 'Japanese 102 - Advanced',
    description: 'Advanced Japanese with kanji focus',
    owner: 'teacher-2',
    identityId: 'us-east-1:teacher-identity-2',
    learner: 'section-jpn-102-learners', // Cognito group name for students in this section
    code: 'JPN102ADV',
    status: 'PUBLISHED',
    featuredImage: MOCK_MEDIA.FEATURED_CROPPED.ACADEMIC,
    createdAt: new Date('2024-01-02T08:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-02T08:00:00Z').toISOString(),
    _version: 1,
    _lastChangedAt: Date.parse('2024-01-02T08:00:00Z'),
    _deleted: false,
  },
};

/**
 * Mock Assignments - Student receives these from instructors
 * Note: Owner is the instructor who created the assignment, NOT the student
 */
export const studentAssignments = [
  {
    id: 'assignment-1',
    unitID: 'unit-japanese-1',
    sectionID: 'section-jpn-101',
    owner: 'teacher-1', // Assignment owner is the instructor who created it
    instructor: 'teacher-1',
    status: 'PUBLISHED',
    dueDate: new Date('2024-01-25T23:59:00Z').toISOString(),
    createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-15T10:00:00Z').toISOString(),
    _version: 1,
    _lastChangedAt: Date.parse('2024-01-15T10:00:00Z'),
    _deleted: false,
  },
  {
    id: 'assignment-2',
    unitID: 'unit-japanese-2',
    sectionID: 'section-jpn-101',
    owner: 'teacher-1',
    instructor: 'teacher-1',
    status: 'PUBLISHED',
    dueDate: new Date('2024-01-30T23:59:00Z').toISOString(),
    createdAt: new Date('2024-01-16T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-16T10:00:00Z').toISOString(),
    _version: 1,
    _lastChangedAt: Date.parse('2024-01-16T10:00:00Z'),
    _deleted: false,
  },
  {
    id: 'assignment-3',
    unitID: 'unit-japanese-3',
    sectionID: 'section-jpn-101',
    owner: 'teacher-1',
    instructor: 'teacher-1',
    status: 'PUBLISHED',
    dueDate: new Date('2024-02-05T23:59:00Z').toISOString(),
    createdAt: new Date('2024-01-18T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-18T10:00:00Z').toISOString(),
    _version: 1,
    _lastChangedAt: Date.parse('2024-01-18T10:00:00Z'),
    _deleted: false,
  },
  {
    id: 'assignment-4',
    unitID: 'unit-kanji-basics',
    sectionID: 'section-jpn-102',
    owner: 'teacher-2',
    instructor: 'teacher-2',
    status: 'PUBLISHED',
    dueDate: new Date('2024-02-10T23:59:00Z').toISOString(),
    createdAt: new Date('2024-01-20T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-20T10:00:00Z').toISOString(),
    _version: 1,
    _lastChangedAt: Date.parse('2024-01-20T10:00:00Z'),
    _deleted: false,
  },
];

/**
 * Mock Assignments created by the instructor (for "My Assignments" section)
 */
export const instructorAssignments = [
  {
    id: 'assignment-instructor-1',
    unitID: 'unit-japanese-1',
    sectionID: 'section-jpn-101',
    owner: 'teacher-1', // Assignment owner is the instructor who created it
    instructor: 'teacher-1',
    status: 'PUBLISHED',
    dueDate: new Date('2024-01-25T23:59:00Z').toISOString(),
    createdAt: new Date('2024-01-15T09:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-15T09:00:00Z').toISOString(),
    _version: 1,
    _lastChangedAt: Date.parse('2024-01-15T09:00:00Z'),
    _deleted: false,
  },
  {
    id: 'assignment-instructor-2',
    unitID: 'unit-japanese-2',
    sectionID: 'section-jpn-101',
    owner: 'teacher-1',
    instructor: 'teacher-1',
    status: 'PUBLISHED',
    dueDate: new Date('2024-01-30T23:59:00Z').toISOString(),
    createdAt: new Date('2024-01-16T09:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-16T09:00:00Z').toISOString(),
    _version: 1,
    _lastChangedAt: Date.parse('2024-01-16T09:00:00Z'),
    _deleted: false,
  },
  {
    id: 'assignment-instructor-3',
    unitID: 'unit-japanese-3',
    sectionID: 'section-jpn-101',
    owner: 'teacher-1',
    instructor: 'teacher-1',
    status: 'PUBLISHED',
    dueDate: new Date('2024-02-05T23:59:00Z').toISOString(),
    createdAt: new Date('2024-01-18T09:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-18T09:00:00Z').toISOString(),
    _version: 1,
    _lastChangedAt: Date.parse('2024-01-18T09:00:00Z'),
    _deleted: false,
  },
  // Future assignment - due in 2050
  {
    id: 'assignment-instructor-future-1',
    unitID: 'unit-japanese-1',
    sectionID: 'section-jpn-101',
    owner: 'teacher-1',
    instructor: 'teacher-1',
    status: 'PUBLISHED',
    dueDate: new Date('2050-12-31T23:59:00Z').toISOString(),
    createdAt: new Date('2024-01-19T09:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-19T09:00:00Z').toISOString(),
    _version: 1,
    _lastChangedAt: Date.parse('2024-01-19T09:00:00Z'),
    _deleted: false,
  },
  // Draft assignment - not yet published
  {
    id: 'assignment-instructor-draft-1',
    unitID: 'unit-japanese-2',
    sectionID: 'section-jpn-101',
    owner: 'teacher-1',
    instructor: 'teacher-1',
    status: 'DRAFT',
    dueDate: new Date('2024-02-15T23:59:00Z').toISOString(),
    createdAt: new Date('2024-01-20T09:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-20T09:00:00Z').toISOString(),
    _version: 1,
    _lastChangedAt: Date.parse('2024-01-20T09:00:00Z'),
    _deleted: false,
  },
];

/**
 * Mock Grades for Other Students (Bob, Carol, Dave)
 * For instructor gradebook view
 */
export const otherStudentGrades = [
  // Bob - unit-japanese-1
  {
    id: 'grade-bob-1',
    unitID: 'unit-japanese-1',
    owner: 'student-bob-sub',
    identityId: 'identity-bob',
    instructor: 'teacher-1',
    unitVersion: 1,
    percentComplete: 100,
    accuracy: 87,
    complete: true,
    timerStarted: true,
    data: JSON.stringify({
      'quiz-block-1': { complete: true, accuracy: 90 },
      'meaning-assoc-1': { complete: true, accuracy: 85 },
      'custom-q-1': { complete: true, accuracy: 86 }
    }),
    files: [],
    createdAt: new Date('2024-01-17T11:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-21T10:00:00Z').toISOString(),
    _version: 4,
    _lastChangedAt: Date.parse('2024-01-21T10:00:00Z'),
    _deleted: false,
  },
  // Bob - unit-japanese-2
  {
    id: 'grade-bob-2',
    unitID: 'unit-japanese-2',
    owner: 'student-bob-sub',
    identityId: 'identity-bob',
    instructor: 'teacher-1',
    unitVersion: 1,
    percentComplete: 100,
    accuracy: 82,
    complete: true,
    timerStarted: true,
    data: JSON.stringify({
      'quiz-block-1': { complete: true, accuracy: 80 },
      'meaning-assoc-1': { complete: true, accuracy: 85 },
      'custom-q-1': { complete: true, accuracy: 81 }
    }),
    files: [],
    createdAt: new Date('2024-01-18T14:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-22T09:30:00Z').toISOString(),
    _version: 3,
    _lastChangedAt: Date.parse('2024-01-22T09:30:00Z'),
    _deleted: false,
  },
  // Carol - unit-japanese-1
  {
    id: 'grade-carol-1',
    unitID: 'unit-japanese-1',
    owner: 'student-carol-sub',
    identityId: 'identity-carol',
    instructor: 'teacher-1',
    unitVersion: 1,
    percentComplete: 100,
    accuracy: 91,
    complete: true,
    timerStarted: true,
    data: JSON.stringify({
      'quiz-block-1': { complete: true, accuracy: 95 },
      'meaning-assoc-1': { complete: true, accuracy: 90 },
      'custom-q-1': { complete: true, accuracy: 88 }
    }),
    files: [],
    createdAt: new Date('2024-01-16T15:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-20T14:15:00Z').toISOString(),
    _version: 5,
    _lastChangedAt: Date.parse('2024-01-20T14:15:00Z'),
    _deleted: false,
  },
  // Carol - unit-japanese-2 (in progress)
  {
    id: 'grade-carol-2',
    unitID: 'unit-japanese-2',
    owner: 'student-carol-sub',
    identityId: 'identity-carol',
    instructor: 'teacher-1',
    unitVersion: 1,
    percentComplete: 60,
    accuracy: 0,
    complete: false,
    timerStarted: true,
    data: JSON.stringify({
      'quiz-block-1': { complete: true, accuracy: 88 },
      'meaning-assoc-1': { complete: false, accuracy: 0 }
    }),
    files: [],
    createdAt: new Date('2024-01-19T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-19T11:00:00Z').toISOString(),
    _version: 2,
    _lastChangedAt: Date.parse('2024-01-19T11:00:00Z'),
    _deleted: false,
  },
  // Dave - unit-japanese-1
  {
    id: 'grade-dave-1',
    unitID: 'unit-japanese-1',
    owner: 'student-dave-sub',
    identityId: 'identity-dave',
    instructor: 'teacher-1',
    unitVersion: 1,
    percentComplete: 100,
    accuracy: 78,
    complete: true,
    timerStarted: true,
    data: JSON.stringify({
      'quiz-block-1': { complete: true, accuracy: 75 },
      'meaning-assoc-1': { complete: true, accuracy: 80 },
      'custom-q-1': { complete: true, accuracy: 79 }
    }),
    files: [],
    createdAt: new Date('2024-01-18T09:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-23T08:00:00Z').toISOString(),
    _version: 6,
    _lastChangedAt: Date.parse('2024-01-23T08:00:00Z'),
    _deleted: false,
  },
  // Dave - unit-japanese-2
  {
    id: 'grade-dave-2',
    unitID: 'unit-japanese-2',
    owner: 'student-dave-sub',
    identityId: 'identity-dave',
    instructor: 'teacher-1',
    unitVersion: 1,
    percentComplete: 100,
    accuracy: 84,
    complete: true,
    timerStarted: true,
    data: JSON.stringify({
      'quiz-block-1': { complete: true, accuracy: 85 },
      'meaning-assoc-1': { complete: true, accuracy: 83 },
      'custom-q-1': { complete: true, accuracy: 84 }
    }),
    files: [],
    createdAt: new Date('2024-01-22T13:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-24T10:00:00Z').toISOString(),
    _version: 3,
    _lastChangedAt: Date.parse('2024-01-24T10:00:00Z'),
    _deleted: false,
  },
];

/**
 * Mock Grades for Student (Alice)
 * Showing various completion states and accuracy levels
 */
export const studentGrades = [
  // Alice - Completed assignment with high score
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
      'meaning-assoc-1': { complete: true, accuracy: 95 },
      'custom-q-1': { complete: true, accuracy: 90 }
    }),
    feedback: JSON.stringify({
      overall: 'Excellent work! Great understanding of greetings.',
    }),
    files: [],
    moderationStatus: 'approved',
    moderationFlags: null,
    moderationCheckedAt: new Date('2024-01-20T14:00:00Z').toISOString(),
    createdAt: new Date('2024-01-16T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-20T13:30:00Z').toISOString(),
    _version: 8,
    _lastChangedAt: Date.parse('2024-01-20T13:30:00Z'),
    _deleted: false,
  },
  // Another attempt at the same unit (showing multiple attempts)
  {
    id: 'grade-alice-1-attempt2',
    unitID: 'unit-japanese-1',
    owner: 'student-alice-sub',
    identityId: 'identity-alice',
    instructor: 'teacher-1',
    unitVersion: 1,
    percentComplete: 100,
    accuracy: 97,
    complete: true,
    timerStarted: true,
    data: JSON.stringify({
      'quiz-block-1': { complete: true, accuracy: 100 },
      'meaning-assoc-1': { complete: true, accuracy: 100 },
      'custom-q-1': { complete: true, accuracy: 92 }
    }),
    feedback: JSON.stringify({
      overall: 'Even better! Perfect score on vocabulary.',
    }),
    files: [],
    moderationStatus: 'approved',
    moderationFlags: null,
    moderationCheckedAt: new Date('2024-01-22T14:00:00Z').toISOString(),
    createdAt: new Date('2024-01-22T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-22T13:30:00Z').toISOString(),
    _version: 5,
    _lastChangedAt: Date.parse('2024-01-22T13:30:00Z'),
    _deleted: false,
  },
  // In progress on another unit
  {
    id: 'grade-alice-2',
    unitID: 'unit-japanese-2',
    owner: 'student-alice-sub',
    identityId: 'identity-alice',
    instructor: 'teacher-1',
    unitVersion: 1,
    percentComplete: 60,
    accuracy: 88,
    complete: false,
    timerStarted: true,
    data: JSON.stringify({
      'quiz-block-1': { complete: true, accuracy: 90 },
      'quiz-block-2': { complete: true, accuracy: 85 },
      'custom-q-1': { complete: false, accuracy: 0 }
    }),
    feedback: null,
    files: [],
    moderationStatus: null,
    moderationFlags: null,
    moderationCheckedAt: null,
    createdAt: new Date('2024-01-23T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-23T15:00:00Z').toISOString(),
    _version: 4,
    _lastChangedAt: Date.parse('2024-01-23T15:00:00Z'),
    _deleted: false,
  },
  // Not started yet (unit-japanese-3 has no grade) - will show in "Assignments" section
  // Not started yet (unit-kanji-basics has no grade) - will show in "Assignments" section
];

/**
 * Complete Dataset for Student Dashboard
 * - Assignments showing different states (needs grading, completed, in progress, not started)
 * - Grades showing progression over time with multiple attempts
 * - Sections student is enrolled in (owned by teachers, so they appear in "Sections")
 * 
 * Expected Dashboard Display:
 * - "Assignments" section: unit-japanese-3, unit-kanji-basics (no grades yet)
 * - "Completed Assignments" section: unit-japanese-1 (97% best), unit-japanese-2 (88%, 60% complete)
 * - "Sections" section: Japanese 101, Japanese 102 (enrolled, not owned)
 */
export const studentDashboardData = {
  username: 'student-alice-sub',
  identityId: 'identity-alice',
  units: mockUnits,
  sections: {
    enrolled: [mockSections['section-jpn-101'], mockSections['section-jpn-102']], // Student enrolled in these
    owned: [], // Students don't own sections
  },
  assignments: {
    received: studentAssignments, // Assignments from instructors (owner !== student)
    created: [], // Students don't create assignments
  },
  grades: studentGrades,
};

/**
 * Complete Dataset for Instructor Dashboard
 * - My Sections (sections they own)
 * - Other Sections (enrolled as student/co-instructor)
 * - My Assignments (assignments they created)
 * - Assignments received (if they're a student in other classes)
 */
export const instructorDashboardData = {
  username: 'teacher-1',
  units: mockUnits,
  sections: {
    enrolled: [], // Instructors can be students too
    owned: [mockSections['section-jpn-101']], // Sections they teach
  },
  assignments: {
    received: [], // Usually none unless instructor is also a student
    created: instructorAssignments, // Assignments they created
  },
  grades: [], // Instructors don't have their own grades
};

/**
 * Scenario: Empty Dashboard (New Student)
 * - No sections joined
 * - No assignments
 * - No grades
 */
export const emptyDashboardData = {
  username: 'new-student',
  units: {},
  sections: {
    enrolled: [],
    owned: [],
  },
  assignments: {
    received: [],
    created: [],
  },
  grades: [],
};

/**
 * Helper function to seed index page data in Storybook
 */
export function seedIndexPageData(scenario = 'student') {
  let data;
  switch (scenario) {
    case 'student':
      data = studentDashboardData;
      break;
    case 'instructor':
      data = instructorDashboardData;
      break;
    case 'empty':
      data = emptyDashboardData;
      break;
    default:
      data = studentDashboardData;
  }

  // Seed units
  Object.values(data.units).forEach(unit => seedMockUnit(unit));

  // Seed sections
  const allSections = [...data.sections.enrolled, ...data.sections.owned];
  if (allSections.length > 0) {
    seedMockSections(allSections);
  }

  // Seed assignments
  const allAssignments = [...data.assignments.received, ...data.assignments.created];
  if (allAssignments.length > 0) {
    seedMockAssignments(allAssignments);
  }

  // Seed grades - for instructor view, seed ALL student grades
  if (scenario === 'instructor') {
    // Seed all student grades so gradebook shows data
    [...studentGrades, ...otherStudentGrades].forEach(grade => seedMockGrade(grade));
  } else {
    // For student view, just seed their own grades
    data.grades.forEach(grade => seedMockGrade(grade));
  }

  console.log('[IndexPageData] Seeded', scenario, 'dashboard with', {
    units: Object.keys(data.units).length,
    sections: allSections.length,
    assignments: allAssignments.length,
    grades: scenario === 'instructor' ? (studentGrades.length + otherStudentGrades.length) : data.grades.length,
  });
}

export default {
  mockUnits,
  mockSections,
  studentAssignments,
  instructorAssignments,
  studentGrades,
  otherStudentGrades,
  studentDashboardData,
  instructorDashboardData,
  emptyDashboardData,
  seedIndexPageData,
};
