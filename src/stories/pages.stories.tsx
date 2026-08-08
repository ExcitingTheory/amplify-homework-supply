/**
 * @fileoverview Storybook stories for Next.js application pages (App Router)
 *
 * Full-page stories demonstrating complete workflows:
 * - Index (Home/Dashboard)
 * - Sections (class management)
 * - Units (lesson content)
 * - Section Detail (class overview)
 * - Unit Detail (Lexical editor)
 * - Workbook (student assignment view)
 * - Peer Review
 *
 * All pages use mocked AWS Amplify services and authentication.
 * Server actions are aliased to mocks in .storybook/main.ts.
 *
 * @module stories/pages.stories
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// App Router pages — all marked 'use client', safe for Storybook.
// Server action imports are aliased to mocks in .storybook/main.ts.
import IndexPage from '../../app/[locale]/page.jsx';
import SectionsPage from '../../app/[locale]/sections/page.jsx';
import UnitsPage from '../../app/[locale]/units/page.jsx';
import SectionDetailPage from '../../app/[locale]/section/[id]/page.jsx';
import UnitDetailPage from '../../app/[locale]/unit/[id]/page';
import PeerReviewPage from '../../app/[locale]/review/[id]/page.jsx';
// WorkbookPage is an async server component — import the client component directly
import WorkbookClient from '../../app/[locale]/workbook/[id]/WorkbookClient';

// Mock data imports
import { seedIndexPageData } from '../../.storybook/__mocks__/index-page-examples';
import { setMockUser } from '../../.storybook/__mocks__/aws-amplify-auth';
import { FilesProvider } from '../../src/context/fileContext';
import { expect } from 'storybook/test'

const meta: Meta = {
  title: '📄 Pages/Application Pages',
  parameters: {
    layout: 'fullscreen',
    // Page components manage their own providers — disable the preview-level wrappers
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
      },
    },
    viewport: {
      defaultViewport: 'responsive',
    },
    docs: {
      description: {
        component: `
Complete Next.js App Router page layouts demonstrating full application flows.

## Page Types
- **Dashboard**: Assignment overview and quick actions
- **Units**: Learning unit library (published, draft, archived)
- **Sections**: Class sections and student groups
- **Workbook**: Student interface for completing assignments
- **Editor**: Instructor interface for creating/editing units
- **Peer Review**: Student peer review workflow

All pages use AWS Amplify Data Client for real-time sync and Cognito for authentication.
        `.trim(),
      },
      toc: true,
      source: {
        state: 'open',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// Index Page (Home/Dashboard)
// ---------------------------------------------------------------------------

/**
 * Home page displaying assignments, grades, and sections for the current user.
 */
export const Index: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        userId: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com' },
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
  render: () => <IndexPage signOut={() => {}} user={{}} />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'student-alice-sub', email: 'alice@example.com' } },
      session: { username: 'student-alice-sub', identityId: 'identity-alice', groups: ['section-jpn-101-learners', 'section-jpn-102-learners'] },
    },
    nextjs: { navigation: { pathname: '/' } },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

/**
 * Home page state when user has no sections — prompts to join or create.
 */
export const IndexNoSections: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'new-student',
        attributes: { sub: 'new-student', email: 'new.student@example.com' },
        groups: [],
      });
      seedIndexPageData('empty');
      return (
        <FilesProvider>
          <Story />
        </FilesProvider>
      );
    },
  ],
  render: () => <IndexPage signOut={() => {}} user={{}} />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'new-student', email: 'new.student@example.com' } },
      session: { username: 'new-student', groups: [] },
    },
    nextjs: { navigation: { pathname: '/' } },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

/**
 * Home page showing both pending and completed assignments with grade statistics.
 */
export const IndexAssignments: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com' },
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
  render: () => <IndexPage signOut={() => {}} user={{}} />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'student-alice-sub', email: 'alice@example.com' } },
      session: { username: 'student-alice-sub', identityId: 'identity-alice', groups: ['section-jpn-101-learners', 'section-jpn-102-learners'] },
    },
    nextjs: { navigation: { pathname: '/' } },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

// ---------------------------------------------------------------------------
// Units Page
// ---------------------------------------------------------------------------

/**
 * Units list page showing published, draft, and archived learning units.
 */
export const Units: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'teacher-1',
        attributes: { sub: 'teacher-1', email: 'teacher@example.com' },
        groups: ['Instructors'],
      });
      seedIndexPageData('instructor');
      return <Story />;
    },
  ],
  render: () => <UnitsPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'teacher-1', email: 'teacher@example.com' } },
      session: { username: 'teacher-1', identityId: 'identity-teacher-1', groups: ['Instructors'] },
    },
    nextjs: { navigation: { pathname: '/units' } },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

/**
 * Units page empty state prompting to create first unit.
 */
export const UnitsEmptyState: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'new-teacher',
        attributes: { sub: 'new-teacher', email: 'new.teacher@example.com' },
        groups: ['Instructors'],
      });
      seedIndexPageData('empty');
      return <Story />;
    },
  ],
  render: () => <UnitsPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'new-teacher', email: 'new.teacher@example.com' } },
      session: { username: 'new-teacher', groups: ['Instructors'] },
    },
    nextjs: { navigation: { pathname: '/units' } },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

// ---------------------------------------------------------------------------
// Sections Page
// ---------------------------------------------------------------------------

/**
 * Sections list page with ability to create and view sections.
 */
export const Sections: Story = {
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
  render: () => <SectionsPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'student-alice-sub', email: 'alice@example.com' } },
      session: { username: 'student-alice-sub', identityId: 'identity-alice', groups: ['section-jpn-101-learners', 'section-jpn-102-learners'] },
    },
    nextjs: { navigation: { pathname: '/sections' } },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

/**
 * Sections page empty state prompting to create first section.
 */
export const SectionsEmptyState: Story = {
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
  render: () => <SectionsPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'new-student', email: 'new.student@example.com' } },
      session: { username: 'new-student', groups: [] },
    },
    nextjs: { navigation: { pathname: '/sections' } },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

// ---------------------------------------------------------------------------
// Section Detail Page
// ---------------------------------------------------------------------------

/**
 * Section detail page for instructors — student roster, gradebook, assignments.
 */
export const SectionDetail: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'teacher-1',
        attributes: { sub: 'teacher-1', email: 'teacher@example.com' },
        groups: ['Instructors'],
      });
      seedIndexPageData('instructor');
      return (
        <FilesProvider>
          <Story />
        </FilesProvider>
      );
    },
  ],
  render: () => <SectionDetailPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'teacher-1', email: 'teacher@example.com' } },
      session: { username: 'teacher-1', identityId: 'identity-teacher-1', groups: ['Instructors'] },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/section/section-jpn-101',
        segments: [['id', 'section-jpn-101']],
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

/**
 * Section detail page for students — personal grades and assignments.
 */
export const SectionDetailStudent: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com', name: 'Alice Johnson' },
        groups: ['section-jpn-101-learners'],
      });
      seedIndexPageData('student');
      return (
        <FilesProvider>
          <Story />
        </FilesProvider>
      );
    },
  ],
  render: () => <SectionDetailPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'student-alice-sub', email: 'alice@example.com', name: 'Alice Johnson' } },
      session: { username: 'student-alice-sub', identityId: 'identity-alice', groups: ['section-jpn-101-learners'] },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/section/section-jpn-101',
        segments: [['id', 'section-jpn-101']],
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

// ---------------------------------------------------------------------------
// Unit Detail Page (Editor)
// ---------------------------------------------------------------------------

/**
 * Unit editor page with Lexical-based rich text editor and educational content nodes.
 */
export const UnitDetail: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'teacher-1',
        attributes: { sub: 'teacher-1', email: 'teacher@example.com' },
        groups: ['Instructors'],
      });
      seedIndexPageData('instructor');
      return (
        <FilesProvider>
          <Story />
        </FilesProvider>
      );
    },
  ],
  render: () => <UnitDetailPage params={Promise.resolve({ id: 'unit-japanese-1', locale: 'en' })} />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'teacher-1', email: 'teacher@example.com' } },
      session: { username: 'teacher-1', identityId: 'identity-teacher-1', groups: ['Instructors'] },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/unit/unit-japanese-1',
        segments: [['id', 'unit-japanese-1']],
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

// ---------------------------------------------------------------------------
// Workbook Page (Student View)
// ---------------------------------------------------------------------------

/**
 * Student workbook view for completing unit exercises and viewing results.
 */
export const Workbook: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com' },
        groups: ['section-jpn-101-learners'],
      });
      seedIndexPageData('student');
      return (
        <FilesProvider>
          <Story />
        </FilesProvider>
      );
    },
  ],
  render: () => <WorkbookClient />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'student-alice-sub', email: 'alice@example.com' } },
      session: { username: 'student-alice-sub', identityId: 'identity-alice', groups: ['section-jpn-101-learners'] },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/workbook/unit-japanese-1',
        segments: [['id', 'unit-japanese-1']],
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

/**
 * Workbook page showing timed exercise start screen with instructions.
 */
export const WorkbookTimedExercise: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com' },
        groups: ['section-jpn-101-learners'],
      });
      seedIndexPageData('student');
      return (
        <FilesProvider>
          <Story />
        </FilesProvider>
      );
    },
  ],
  render: () => <WorkbookClient />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'student-alice-sub', email: 'alice@example.com' } },
      session: { username: 'student-alice-sub', identityId: 'identity-alice', groups: ['section-jpn-101-learners'] },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/workbook/assignment-2',
        segments: [['id', 'assignment-2']],
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

// ---------------------------------------------------------------------------
// Peer Review Page
// ---------------------------------------------------------------------------

/**
 * Peer review page where students review each other's work.
 */
export const PeerReview: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com' },
        groups: ['section-jpn-101-learners'],
      });
      seedIndexPageData('student');
      return (
        <FilesProvider>
          <Story />
        </FilesProvider>
      );
    },
  ],
  render: () => <PeerReviewPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'student-alice-sub', email: 'alice@example.com' } },
      session: { username: 'student-alice-sub', identityId: 'identity-alice', groups: ['section-jpn-101-learners'] },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/review/assignment-1',
        segments: [['id', 'assignment-1']],
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};
