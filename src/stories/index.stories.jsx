import React from 'react';
import Index from '../../pages/index';
import { seedIndexPageData } from '../../.storybook/__mocks__/index-page-examples';
import { setMockUser } from '../../.storybook/__mocks__/aws-amplify-auth';
// import { clearMockUnits } from '../../.storybook/__mocks__/aws-amplify-datastore';

// Wrapper component to bridge Storybook args to Next.js page props
// Next.js pages don't receive props from story args by default
function IndexPageWrapper(props) {
  console.log('[IndexPageWrapper] Received props:', props);
  return <Index {...props} />;
}

export default {
  title: 'Pages/Index',
  component: IndexPageWrapper,
  parameters: {
    layout: 'fullscreen',
    // Disable unit/section context providers for this page
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
    docs: {
      description: {
        component: 'Student and instructor dashboard showing assignments, sections, and grade progress',
      },
    },
  },
};

/**
 * Student Dashboard - Active learner with assignments and progress
 * 
 * Shows student enrolled in 2 sections with the following:
 * 
 * **Assignments Section (needs grading):**
 * - Unit 2 (Numbers) - in progress (88%, 60% complete)
 * - Unit 3 (Daily Activities) - not started
 * - Unit 4 (Kanji Basics) - not started
 * 
 * **Completed Assignments Section:**
 * - Unit 1 (Greetings) - 97% (highest), 95.5% (average), 2 attempts
 * 
 * **Sections:**
 * - Japanese 101 - Spring 2024
 * - Japanese 102 - Advanced
 */
export const StudentDashboard = {
  decorators: [
    (Story, { args }) => {
      // Set mock auth user for any components that call getCurrentUser
      setMockUser({
        username: 'student-alice-sub',
        userId: 'student-alice-sub',
        attributes: {
          sub: 'student-alice-sub',
          email: 'alice@example.com',
        },
        groups: ['section-jpn-101-learners', 'section-jpn-102-learners'],
      });
      // Seed data
      seedIndexPageData('student');
      
      // Return the story with props explicitly passed
      return <Story {...args} />;
    },
  ],
  args: {
    user: {
      username: 'student-alice-sub',
      userId: 'student-alice-sub',
      attributes: {
        sub: 'student-alice-sub',
        email: 'alice@example.com',
      },
      groups: ['section-jpn-101-learners', 'section-jpn-102-learners'],
    },
    signOut: () => console.log('Sign out clicked'),
  },
};

/**
 * Instructor Dashboard - Teacher managing classes
 * 
 * Shows:
 * - 1 section they teach
 * - 2 assignments they created
 * - Links to edit units
 */
export const InstructorDashboard = {
  decorators: [
    (Story, { args }) => {
      setMockUser({
        username: 'teacher-1',
        userId: 'teacher-1',
        attributes: {
          sub: 'teacher-1',
          email: 'teacher@example.com',
        },
        groups: [],
      });
      seedIndexPageData('instructor');
      return <Story {...args} />;
    },
  ],
  args: {
    user: {
      username: 'teacher-1',
      attributes: {
        email: 'teacher@example.com',
        sub: 'teacher-1',
      },
    },
    signOut: () => console.log('Sign out clicked'),
  },
};

/**
 * Empty State - New user
 * 
 * Shows:
 * - No sections
 * - No assignments
 */
export const EmptyState = {
  decorators: [
    (Story, { args }) => {
      seedIndexPageData('empty');
      return <Story {...args} />;
    },
  ],
  args: {
    user: {
      username: 'new-student',
      attributes: {
        email: 'new.student@example.com',
        sub: 'new-student',
      },
    },
    signOut: () => console.log('Sign out clicked'),
  },
};

/**
 * Loading State - While data is fetching
 */
export const Loading = {
  args: {
    user: null,
    signOut: () => console.log('Sign out clicked'),
  },
};
