import React from 'react';
// Import page components
// Note: These are wrapped with MyAuth so we need to provide mock auth context
import IndexPage from './index.js';
import GradesPage from './grades.js';
import ProfilePage from './profile.js';
import SectionsPage from './sections.js';
import UnitsPage from './units.js';
import SectionDetailPage from './section/[id].js';
import UnitDetailPage from './unit/[id].js';
import WorkbookPage from './workbook/[id].js';

/**
 * Pages Stories - Storybook stories for all Next.js pages
 * 
 * This file contains stories for all pages in the application:
 * - Index (Home/Dashboard)
 * - Grades
 * - Profile
 * - Sections
 * - Units
 * - Section Detail
 * - Unit Detail (Editor)
 * - Workbook (Student View)
 */

const meta = {
  title: 'Pages/All Pages',
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: false,
      navigation: {
        pathname: '/',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

/**
 * Index Page (Home/Dashboard)
 * 
 * The landing page shows:
 * - Assignments that need completion
 * - Completed assignments with grades
 * - User's own assignments (if instructor)
 * - Sections the user belongs to
 */
export const Index = {
  render: () => <IndexPage />,
  parameters: {
    docs: {
      description: {
        story: 'Home page displaying assignments, grades, and sections for the current user.',
      },
    },
  },
};

/**
 * Grades Page
 * 
 * Displays grades organized by section:
 * - For instructors: All student grades in their sections
 * - For students: Their own grades organized by assignment
 */
export const Grades = {
  render: () => <GradesPage />,
  parameters: {
    docs: {
      description: {
        story: 'Grades page showing individual or class grades depending on user role.',
      },
    },
  },
};

/**
 * Profile Page
 * 
 * User profile management:
 * - View/edit email
 * - View user ID and identity ID
 * - Change password
 */
export const Profile = {
  render: () => <ProfilePage />,
  parameters: {
    docs: {
      description: {
        story: 'User profile page for managing account information and password.',
      },
    },
  },
};

/**
 * Sections Page
 * 
 * Section management:
 * - List all sections user is enrolled in
 * - List sections user created (instructors)
 * - Create new sections
 */
export const Sections = {
  render: () => <SectionsPage />,
  parameters: {
    docs: {
      description: {
        story: 'Sections list page with ability to create and view sections.',
      },
    },
  },
};

/**
 * Units Page
 * 
 * Learning unit management:
 * - Published units (available to all)
 * - Draft units (instructor's work in progress)
 * - Archived units
 * - Create new units
 */
export const Units = {
  render: () => <UnitsPage />,
  parameters: {
    docs: {
      description: {
        story: 'Units list page showing published, draft, and archived learning units.',
      },
    },
  },
};

/**
 * Section Detail Page
 * 
 * Individual section view:
 * - Section information
 * - Student roster
 * - Assignments for the section
 * - Grade overview
 * - Upload featured image
 */
export const SectionDetail = {
  render: () => <SectionDetailPage />,
  parameters: {
    nextRouter: {
      pathname: '/section/[id]',
      query: { id: 'test-section-id' },
    },
    docs: {
      description: {
        story: 'Section detail page showing students, assignments, and grades.',
      },
    },
  },
};

/**
 * Unit Detail Page (Editor)
 * 
 * Unit editor for instructors:
 * - Rich text editor with educational nodes
 * - Add quizzes, vocabulary exercises
 * - Add media (images, audio, video)
 * - Manage unit settings
 * - Publish/unpublish units
 */
export const UnitDetail = {
  render: () => <UnitDetailPage />,
  parameters: {
    nextRouter: {
      pathname: '/unit/[id]',
      query: { id: 'test-unit-id' },
    },
    docs: {
      description: {
        story: 'Unit editor page with Lexical-based rich text editor and educational content nodes.',
      },
    },
  },
};

/**
 * Workbook Page (Student View)
 * 
 * Student workbook interface:
 * - View unit content
 * - Complete exercises and quizzes
 * - Submit answers
 * - View grades
 * - Timed exercises with countdown
 */
export const Workbook = {
  render: () => <WorkbookPage />,
  parameters: {
    nextRouter: {
      pathname: '/workbook/[id]',
      query: { id: 'test-unit-id' },
    },
    docs: {
      description: {
        story: 'Student workbook view for completing unit exercises and viewing results.',
      },
    },
  },
};

/**
 * Index - With No Sections
 * 
 * State when user has not joined or created any sections yet
 */
export const IndexNoSections = {
  render: () => <IndexPage />,
  parameters: {
    docs: {
      description: {
        story: 'Home page state when user has no sections - prompts to join or create.',
      },
    },
  },
};

/**
 * Units - Empty State
 * 
 * State when no published units exist yet
 */
export const UnitsEmptyState = {
  render: () => <UnitsPage />,
  parameters: {
    docs: {
      description: {
        story: 'Units page empty state prompting to create first unit.',
      },
    },
  },
};

/**
 * Sections - Empty State
 * 
 * State when user has no sections
 */
export const SectionsEmptyState = {
  render: () => <SectionsPage />,
  parameters: {
    docs: {
      description: {
        story: 'Sections page empty state prompting to create first section.',
      },
    },
  },
};

/**
 * Profile - Password Change Flow
 * 
 * Demonstrates the password change form
 */
export const ProfilePasswordChange = {
  render: () => <ProfilePage />,
  parameters: {
    docs: {
      description: {
        story: 'Profile page focused on password change functionality.',
      },
    },
  },
};

/**
 * Workbook - Timed Exercise
 * 
 * Shows the timer interface before starting a timed exercise
 */
export const WorkbookTimedExercise = {
  render: () => <WorkbookPage />,
  parameters: {
    nextRouter: {
      pathname: '/workbook/[id]',
      query: { id: 'timed-unit-id' },
    },
    docs: {
      description: {
        story: 'Workbook page showing timed exercise start screen with instructions.',
      },
    },
  },
};

/**
 * Index - Assignments View
 * 
 * Shows pending and completed assignments
 */
export const IndexAssignments = {
  render: () => <IndexPage />,
  parameters: {
    docs: {
      description: {
        story: 'Home page showing both pending and completed assignments with grade statistics.',
      },
    },
  },
};

/**
 * Section Detail - Grade Table
 * 
 * Focus on the gradebook table view
 */
export const SectionDetailGradeTable = {
  render: () => <SectionDetailPage />,
  parameters: {
    nextRouter: {
      pathname: '/section/[id]',
      query: { id: 'test-section-id' },
    },
    docs: {
      description: {
        story: 'Section detail page showing student grades in table format.',
      },
    },
  },
};
