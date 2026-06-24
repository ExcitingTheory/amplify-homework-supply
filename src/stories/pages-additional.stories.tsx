/**
 * @fileoverview Storybook stories for additional Next.js App Router pages
 *
 * Covers pages NOT in pages.stories.tsx:
 * - Settings (user preferences)
 * - Recycle Bin (soft-deleted items)
 * - Squads (gamification teams)
 * - Squad Detail (individual squad)
 * - XP History (experience points log)
 * - Leaderboard (live rankings)
 * - Profile (public profile with badges)
 * - Notifications (user notifications)
 * - Admin: Analytics
 * - Admin: Archives
 * - Admin: Moderation
 * - Admin: Settings (gamification config)
 * - Admin: Words (vocabulary management)
 * - Instructor: Grade (grading interface)
 *
 * @module stories/pages-additional.stories
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// Client pages — direct imports
import SettingsPage from '../../app/[locale]/settings/page.jsx';
import RecycleBinPage from '../../app/[locale]/recycle-bin/page.jsx';
import SquadsPage from '../../app/[locale]/squads/page.jsx';
import SquadDetailPage from '../../app/[locale]/squad/[id]/page.jsx';
import XPHistoryPage from '../../app/[locale]/xp-history/page.jsx';
import AdminAnalyticsPage from '../../app/[locale]/admin/analytics/page';
import AdminArchivesPage from '../../app/[locale]/admin/archives/page.jsx';
import AdminModerationPage from '../../app/[locale]/admin/moderation/page';
import AdminSettingsPage from '../../app/[locale]/admin/settings/page';
import AdminWordsPage from '../../app/[locale]/admin/words/page';
import NotificationsPage from '../../app/[locale]/profile/notifications/page';

// Client sub-components for server-rendered pages
import { LiveLeaderboard } from '../../app/[locale]/leaderboard/LiveLeaderboard';
import { GradeActions } from '../../app/[locale]/instructor/grade/[id]/GradeActions';

// Mock helpers
import { seedIndexPageData } from '../../.storybook/__mocks__/index-page-examples';
import { setMockUser } from '../../.storybook/__mocks__/aws-amplify-auth';
import { FilesProvider } from '../../src/context/fileContext';

const meta: Meta = {
  title: '📄 Pages/Additional Pages',
  parameters: {
    layout: 'fullscreen',
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
    nextjs: {
      appDirectory: true,
      navigation: { pathname: '/' },
    },
    viewport: { defaultViewport: 'responsive' },
    docs: {
      description: {
        component: `
Additional application pages covering settings, gamification, admin tools, and instructor workflows.

## Page Categories
- **User**: Settings, Notifications, XP History
- **Gamification**: Leaderboard, Squads, Squad Detail
- **Admin**: Analytics, Archives, Moderation, Gamification Settings, Words
- **Instructor**: Grade Review
- **Utility**: Recycle Bin
        `.trim(),
      },
      toc: true,
    },
  },
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// Settings Page
// ---------------------------------------------------------------------------

export const Settings: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        userId: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com' },
        groups: ['section-jpn-101-learners'],
      });
      seedIndexPageData('student');
      return <Story />;
    },
  ],
  render: () => <SettingsPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'student-alice-sub', email: 'alice@example.com' } },
      session: { username: 'student-alice-sub', identityId: 'identity-alice' },
    },
    nextjs: { navigation: { pathname: '/settings' } },
  },
};

// ---------------------------------------------------------------------------
// Recycle Bin Page
// ---------------------------------------------------------------------------

export const RecycleBin: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'teacher-1',
        userId: 'teacher-1',
        attributes: { sub: 'teacher-1', email: 'teacher@example.com' },
        groups: ['Admins', 'Instructors'],
      });
      seedIndexPageData('instructor');
      return <Story />;
    },
  ],
  render: () => <RecycleBinPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'teacher-1', email: 'teacher@example.com' } },
      session: { username: 'teacher-1', identityId: 'identity-teacher-1' },
    },
    nextjs: { navigation: { pathname: '/recycle-bin' } },
  },
};

// ---------------------------------------------------------------------------
// Squads Page
// ---------------------------------------------------------------------------

export const Squads: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        userId: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com' },
        groups: ['section-jpn-101-learners'],
      });
      seedIndexPageData('student');
      return <Story />;
    },
  ],
  render: () => <SquadsPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'student-alice-sub', email: 'alice@example.com' } },
      session: { username: 'student-alice-sub', identityId: 'identity-alice' },
    },
    nextjs: { navigation: { pathname: '/squads' } },
  },
};

// ---------------------------------------------------------------------------
// Squad Detail Page
// ---------------------------------------------------------------------------

export const SquadDetail: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        userId: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com' },
        groups: ['section-jpn-101-learners'],
      });
      seedIndexPageData('student');
      return <Story />;
    },
  ],
  render: () => <SquadDetailPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'student-alice-sub', email: 'alice@example.com' } },
      session: { username: 'student-alice-sub', identityId: 'identity-alice' },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/squad/squad-1',
        segments: [['id', 'squad-1']],
      },
    },
  },
};

// ---------------------------------------------------------------------------
// XP History Page
// ---------------------------------------------------------------------------

export const XPHistory: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        userId: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com' },
        groups: ['section-jpn-101-learners'],
      });
      seedIndexPageData('student');
      return <Story />;
    },
  ],
  render: () => <XPHistoryPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'student-alice-sub', email: 'alice@example.com' } },
      session: { username: 'student-alice-sub', identityId: 'identity-alice' },
    },
    nextjs: { navigation: { pathname: '/xp-history' } },
  },
};

// ---------------------------------------------------------------------------
// Leaderboard (Client Component)
// ---------------------------------------------------------------------------

export const Leaderboard: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        userId: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com' },
        groups: ['section-jpn-101-learners'],
      });
      seedIndexPageData('student');
      return <Story />;
    },
  ],
  render: () => (
    <LiveLeaderboard
      initialEntries={[
        { studentId: 'student-alice-sub', studentName: 'Alice Johnson', avatarColor: '#6366f1', totalXP: 2450, level: 5, currentStreak: 7, completedAssignments: 12 },
        { studentId: 'student-bob-sub', studentName: 'Bob Smith', avatarColor: '#f59e0b', totalXP: 2100, level: 4, currentStreak: 3, completedAssignments: 10 },
        { studentId: 'student-carol-sub', studentName: 'Carol Davis', avatarColor: '#10b981', totalXP: 1800, level: 4, currentStreak: 5, completedAssignments: 9 },
        { studentId: 'student-dave-sub', studentName: 'Dave Wilson', avatarColor: '#ef4444', totalXP: 1500, level: 3, currentStreak: 1, completedAssignments: 7 },
        { studentId: 'student-eve-sub', studentName: 'Eve Martinez', avatarColor: '#8b5cf6', totalXP: 1200, level: 3, currentStreak: 14, completedAssignments: 6 },
      ]}
    />
  ),
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'student-alice-sub', email: 'alice@example.com' } },
      session: { username: 'student-alice-sub', identityId: 'identity-alice' },
    },
    nextjs: { navigation: { pathname: '/leaderboard' } },
  },
};

// ---------------------------------------------------------------------------
// Notifications Page
// ---------------------------------------------------------------------------

export const Notifications: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        userId: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com' },
        groups: ['section-jpn-101-learners'],
      });
      seedIndexPageData('student');
      return <Story />;
    },
  ],
  render: () => <NotificationsPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'student-alice-sub', email: 'alice@example.com' } },
      session: { username: 'student-alice-sub', identityId: 'identity-alice' },
    },
    nextjs: { navigation: { pathname: '/profile/notifications' } },
  },
};

// ---------------------------------------------------------------------------
// Admin: Analytics
// ---------------------------------------------------------------------------

export const AdminAnalytics: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'admin-1',
        userId: 'admin-1',
        attributes: { sub: 'admin-1', email: 'admin@example.com' },
        groups: ['Admins', 'Instructors'],
      });
      seedIndexPageData('instructor');
      return <Story />;
    },
  ],
  render: () => <AdminAnalyticsPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'admin-1', email: 'admin@example.com' } },
      session: { username: 'admin-1', identityId: 'identity-admin-1' },
    },
    nextjs: { navigation: { pathname: '/admin/analytics' } },
  },
};

// ---------------------------------------------------------------------------
// Admin: Archives
// ---------------------------------------------------------------------------

export const AdminArchives: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'admin-1',
        userId: 'admin-1',
        attributes: { sub: 'admin-1', email: 'admin@example.com' },
        groups: ['Admins', 'Instructors'],
      });
      seedIndexPageData('instructor');
      return <Story />;
    },
  ],
  render: () => <AdminArchivesPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'admin-1', email: 'admin@example.com' } },
      session: { username: 'admin-1', identityId: 'identity-admin-1' },
    },
    nextjs: { navigation: { pathname: '/admin/archives' } },
  },
};

// ---------------------------------------------------------------------------
// Admin: Moderation
// ---------------------------------------------------------------------------

export const AdminModeration: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'admin-1',
        userId: 'admin-1',
        attributes: { sub: 'admin-1', email: 'admin@example.com' },
        groups: ['Admins', 'Instructors'],
      });
      seedIndexPageData('instructor');
      return <Story />;
    },
  ],
  render: () => <AdminModerationPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'admin-1', email: 'admin@example.com' } },
      session: { username: 'admin-1', identityId: 'identity-admin-1' },
    },
    nextjs: { navigation: { pathname: '/admin/moderation' } },
  },
};

// ---------------------------------------------------------------------------
// Admin: Settings (Gamification Config)
// ---------------------------------------------------------------------------

export const AdminSettings: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'admin-1',
        userId: 'admin-1',
        attributes: { sub: 'admin-1', email: 'admin@example.com' },
        groups: ['Admins', 'Instructors'],
      });
      seedIndexPageData('instructor');
      return <Story />;
    },
  ],
  render: () => <AdminSettingsPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'admin-1', email: 'admin@example.com' } },
      session: { username: 'admin-1', identityId: 'identity-admin-1' },
    },
    nextjs: { navigation: { pathname: '/admin/settings' } },
  },
};

// ---------------------------------------------------------------------------
// Admin: Words (Vocabulary Management)
// ---------------------------------------------------------------------------

export const AdminWords: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'admin-1',
        userId: 'admin-1',
        attributes: { sub: 'admin-1', email: 'admin@example.com' },
        groups: ['Admins', 'Instructors'],
      });
      seedIndexPageData('instructor');
      return <Story />;
    },
  ],
  render: () => <AdminWordsPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'admin-1', email: 'admin@example.com' } },
      session: { username: 'admin-1', identityId: 'identity-admin-1' },
    },
    nextjs: { navigation: { pathname: '/admin/words' } },
  },
};

// ---------------------------------------------------------------------------
// Instructor: Grade Review
// ---------------------------------------------------------------------------

export const InstructorGrade: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'teacher-1',
        userId: 'teacher-1',
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
  render: () => (
    <GradeActions
      unit={{ id: 'unit-japanese-1', name: 'Introduction to Japanese Greetings', data: '' }}
      grades={[
        {
          id: 'grade-alice-unit-1',
          attempt: 1,
          accuracy: 85,
          percentComplete: 100,
          complete: true,
          data: { 'block-1': { complete: true, accuracy: 90 }, 'block-2': { complete: true, accuracy: 80 } },
          feedback: null,
          moderationStatus: null,
          moderationFlags: null,
          moderationCheckedAt: null,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T11:30:00Z',
        },
      ]}
      studentName="Alice Johnson"
      moderation={null}
    />
  ),
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'teacher-1', email: 'teacher@example.com' } },
      session: { username: 'teacher-1', identityId: 'identity-teacher-1' },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/instructor/grade/grade-alice-unit-1',
        segments: [['id', 'grade-alice-unit-1']],
      },
    },
  },
};
