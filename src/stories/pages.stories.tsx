/**
 * @fileoverview Storybook stories for Next.js application pages
 * 
 * Full-page stories demonstrating complete workflows:
 * - Index (Home/Dashboard)
 * - Profile management
 * - Sections (class management)
 * - Units (lesson content)
 * - Section Detail (class overview)
 * - Unit Detail (Lexical editor)
 * - Workbook (student assignment view)
 * 
 * All pages use mocked AWS Amplify services and authentication.
 * 
 * @module stories/pages.stories
 */

// Import page components lazily to avoid breaking Vitest browser mode
import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const PageLoadingFallback = ({ name = 'page' }: { name?: string }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 2 }}>
    <CircularProgress size={44} thickness={4} />
    <Box component="span" sx={{ color: 'text.secondary', typography: 'body2' }}>
      Loading {name}…
    </Box>
  </Box>
);

// Lazy load page components
const IndexPage = React.lazy(() => import('../../pages/index.jsx'));
const ProfilePage = React.lazy(() => import('../../pages/profile.jsx'));
const SectionsPage = React.lazy(() => import('../../pages/sections.jsx'));
const UnitsPage = React.lazy(() => import('../../pages/units.jsx'));
const SectionDetailPage = React.lazy(() => import('../../pages/section/[id].jsx').then(m => ({ default: m.SectionDetail })));
const UnitDetailPage = React.lazy(() => import('../../pages/unit/[id].jsx'));
const WorkbookPage = React.lazy(() => import('../../pages/workbook/[id].jsx'));
const PeerReviewPage = React.lazy(() => import('../../pages/review/[id].jsx'));

// Mock data imports
import { seedIndexPageData } from '../../.storybook/__mocks__/index-page-examples';
import { setMockUser } from '../../.storybook/__mocks__/aws-amplify-auth';
import { FilesProvider } from '../context/fileContext';
import { useRouter } from 'next/router';

/**
 * Pages Stories - Storybook stories for all Next.js pages
 * 
 * This file contains stories for all pages in the application:
 * - Index (Home/Dashboard)
 * - Profile
 * - Sections
 * - Units
 * - Section Detail
 * - Unit Detail (Editor)
 * - Workbook (Student View)
 */

const meta = {
  title: '📄 Pages/Application Pages',
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: false,
      navigation: {
        pathname: '/',
      },
    },
    // Ensure viewport can scroll for long pages
    viewport: {
      defaultViewport: 'responsive',
    },
    docs: {
      description: {
        component: `
Complete Next.js page layouts demonstrating full application flows.

## Page Types
- **Dashboard**: Assignment overview and quick actions
- **Units**: Learning unit library (published, draft, archived)
- **Sections**: Class sections and student groups
- **Workbook**: Student interface for completing assignments
- **Editor**: Instructor interface for creating/editing units

All pages use AWS Amplify DataStore for real-time sync and Cognito for authentication.
        `.trim(),
      },
      toc: true,
      source: {
        state: 'open',
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
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        userId: 'student-alice-sub',
        attributes: {
          sub: 'student-alice-sub',
          email: 'alice@example.com',
        },
        groups: ['section-jpn-101-learners', 'section-jpn-102-learners'],
      });
      seedIndexPageData('student');
      return (
        <FilesProvider>
          <Story />
        </FilesProvider>
      );
    },
  ],
  render: () => (
    <React.Suspense fallback={<PageLoadingFallback name="Dashboard" />}>
      <IndexPage
        user={{
          username: 'student-alice-sub',
          userId: 'student-alice-sub',
          attributes: {
            sub: 'student-alice-sub',
            email: 'alice@example.com',
          },
          groups: ['section-jpn-101-learners', 'section-jpn-102-learners'],
        }}
        signOut={() => console.log('Sign out clicked')}
      />
    </React.Suspense>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Home page displaying assignments, grades, and sections for the current user.',
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
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com' },
        groups: ['section-jpn-101-learners'],
      });
      return <Story />;
    },
  ],
  render: () => (
    <React.Suspense fallback={<PageLoadingFallback name="Profile" />}>
      <ProfilePage />
    </React.Suspense>
  ),
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
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com' },
        groups: ['section-jpn-101-learners', 'section-jpn-102-learners'],
      });
      seedIndexPageData('student');
      return <Story />;
    },
  ],
  render: () => (
    <React.Suspense fallback={<PageLoadingFallback name="Sections" />}>
      <SectionsPage />
    </React.Suspense>
  ),
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
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'teacher-1',
        attributes: { sub: 'teacher-1', email: 'teacher@example.com' },
        groups: [],
      });
      seedIndexPageData('instructor');
      return <Story />;
    },
  ],
  render: () => (
    <React.Suspense fallback={<PageLoadingFallback name="Units" />}>
      <UnitsPage />
    </React.Suspense>
  ),
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
 * - Section information (Japanese 101 with 4 students)
 * - Student roster (Alice, Bob, Carol, Dave)
 * - Assignments for the section (2 unit assignments)
 * - Grade overview (gradebook showing all student scores)
 * - Upload featured image
 * 
 * Mock data includes:
 * - Alice: 2 completed units (97%, 88%)
 * - Bob: 2 completed units (87%, 82%)
 * - Carol: 1 completed (91%), 1 in-progress (60%)
 * - Dave: 2 completed units (78%, 84%)
 */
export const SectionDetail = {
  decorators: [
    (Story: React.FC, context: any) => {
      setMockUser({
        username: 'teacher-1',
        attributes: { sub: 'teacher-1', email: 'teacher@example.com' },
        groups: ['Instructors'],
      });
      seedIndexPageData('instructor');
      
      // Mock router to provide section id from parameters
      const router = useRouter();
      if (context.parameters.nextRouter) {
        Object.assign(router, context.parameters.nextRouter);
      }
      
      return <FilesProvider><Story /></FilesProvider>;
    },
  ],
  render: () => (
    <React.Suspense fallback={<PageLoadingFallback name="Section Detail" />}>
      <SectionDetailPage
        user={{
          username: 'teacher-1',
          attributes: { sub: 'teacher-1', email: 'teacher@example.com' },
        }}
        signOut={() => console.log('Sign out clicked')}
      />
    </React.Suspense>
  ),
  parameters: {
    nextRouter: {
      pathname: '/section/[id]',
      query: { id: 'section-jpn-101' },
      isReady: true,
    },
    docs: {
      description: {
        story: 'Section detail page for instructors - shows student roster (4 students: Alice, Bob, Carol, Dave), gradebook with all student scores across 2 assignments, and section management tools. Mock data includes varied completion states and accuracy scores.',
      },
    },
  },
};

/**
 * Section Detail Page (Student View)
 * 
 * Student viewing their section - shows their own grades and assignments
 */
export const SectionDetailStudent = {
  decorators: [
    (Story: React.FC, context: any) => {
      setMockUser({
        username: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com', name: 'Alice Johnson' },
        groups: ['section-jpn-101-learners'],
      });
      seedIndexPageData('student');
      
      // Mock router to provide id from parameters
      const router = useRouter();
      if (context.parameters.nextRouter) {
        Object.assign(router, context.parameters.nextRouter);
      }
      
      return <FilesProvider><Story /></FilesProvider>;
    },
  ],
  render: () => (
    <React.Suspense fallback={<PageLoadingFallback name="Section Detail" />}>
      <SectionDetailPage
        user={{
          username: 'student-alice-sub',
          attributes: { sub: 'student-alice-sub', email: 'alice@example.com', name: 'Alice Johnson' },
        }}
        signOut={() => console.log('Sign out clicked')}
      />
    </React.Suspense>
  ),
  parameters: {
    nextRouter: {
      pathname: '/section/[id]',
      query: { id: 'section-jpn-101' },
      isReady: true,
    },
    docs: {
      description: {
        story: 'Section detail page for students - shows their personal grades and assignments for the section.',
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
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'teacher-1',
        attributes: { sub: 'teacher-1', email: 'teacher@example.com' },
        groups: [],
      });
      seedIndexPageData('instructor');
      return <FilesProvider><Story /></FilesProvider>;
    },
  ],
  render: () => (
    <React.Suspense fallback={<PageLoadingFallback name="Unit Editor" />}>
      <UnitDetailPage />
    </React.Suspense>
  ),
  parameters: {
    nextRouter: {
      pathname: '/unit/[id]',
      query: { id: 'unit-japanese-1' },
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
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com' },
        groups: ['section-jpn-101-learners'],
      });
      seedIndexPageData('student');
      return <FilesProvider><Story /></FilesProvider>;
    },
  ],
  render: () => (
    <React.Suspense fallback={<PageLoadingFallback name="Workbook" />}>
      <WorkbookPage />
    </React.Suspense>
  ),
  parameters: {
    nextRouter: {
      pathname: '/workbook/[id]',
      query: { id: 'assignment-1' },
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
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'new-student',
        attributes: { sub: 'new-student', email: 'new.student@example.com' },
        groups: [],
      });
      seedIndexPageData('empty');
      return <FilesProvider><Story /></FilesProvider>;
    },
  ],
  render: () => (
    <React.Suspense fallback={<PageLoadingFallback name="Dashboard" />}>
      <IndexPage
        user={{ username: 'new-student', attributes: { sub: 'new-student', email: 'new.student@example.com' } }}
        signOut={() => console.log('Sign out')}
      />
    </React.Suspense>
  ),
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
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'new-teacher',
        attributes: { sub: 'new-teacher', email: 'new.teacher@example.com' },
        groups: [],
      });
      seedIndexPageData('empty');
      return <Story />;
    },
  ],
  render: () => (
    <React.Suspense fallback={<PageLoadingFallback name="Units" />}>
      <UnitsPage />
    </React.Suspense>
  ),
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
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'new-student',
        attributes: { sub: 'new-student', email: 'new.student@example.com' },
        groups: [],
      });
      seedIndexPageData('empty');
      return <Story />;
    },
  ],
  render: () => (
    <React.Suspense fallback={<PageLoadingFallback name="Sections" />}>
      <SectionsPage />
    </React.Suspense>
  ),
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
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com' },
        groups: ['section-jpn-101-learners'],
      });
      return <Story />;
    },
  ],
  render: () => (
    <React.Suspense fallback={<PageLoadingFallback name="Profile" />}>
      <ProfilePage />
    </React.Suspense>
  ),
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
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com' },
        groups: ['section-jpn-101-learners'],
      });
      seedIndexPageData('student');
      return <FilesProvider><Story /></FilesProvider>;
    },
  ],
  render: () => (
    <React.Suspense fallback={<PageLoadingFallback name="Workbook" />}>
      <WorkbookPage />
    </React.Suspense>
  ),
  parameters: {
    nextRouter: {
      pathname: '/workbook/[id]',
      query: { id: 'assignment-2' },
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
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com' },
        groups: ['section-jpn-101-learners', 'section-jpn-102-learners'],
      });
      seedIndexPageData('student');
      return <FilesProvider><Story /></FilesProvider>;
    },
  ],
  render: () => (
    <React.Suspense fallback={<PageLoadingFallback name="Dashboard" />}>
      <IndexPage
        user={{
          username: 'student-alice-sub',
          attributes: { sub: 'student-alice-sub', email: 'alice@example.com' },
          groups: ['section-jpn-101-learners', 'section-jpn-102-learners'],
        }}
        signOut={() => console.log('Sign out')}
      />
    </React.Suspense>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Home page showing both pending and completed assignments with grade statistics.',
      },
    },
  },
};

/**
 * Peer Review Room
 *
 * Split-pane view with:
 * - Read-only workbook (left) showing the student's homework
 * - Real-time peer review chat (right)
 * - AppBar with status chip, online count, and "End Review" button (owner only)
 * - Feedback prompt shown after closing review
 */
export const PeerReview = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        userId: 'student-alice-sub',
        attributes: {
          sub: 'student-alice-sub',
          email: 'alice@example.com',
        },
        groups: ['section-jpn-101-learners'],
      });
      seedIndexPageData('student');
      return <FilesProvider><Story /></FilesProvider>;
    },
  ],
  render: () => (
    <React.Suspense fallback={<PageLoadingFallback name="Peer Review" />}>
      <PeerReviewPage />
    </React.Suspense>
  ),
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/review/[id]',
        query: { id: 'room-mock-001' },
      },
    },
    docs: {
      description: {
        story: 'Peer review room with split-pane workbook + chat. Uses mocked Yjs provider for real-time state.',
      },
    },
  },
};
