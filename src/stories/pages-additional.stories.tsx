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

import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

// Client pages — direct imports
import SettingsPage from "../../app/[locale]/settings/page.jsx";
import RecycleBinPage from "../../app/[locale]/recycle-bin/page.jsx";
import SquadsPage from "../../app/[locale]/squads/page.jsx";
import SquadDetailClient from "../../app/[locale]/squad/[id]/SquadDetailClient";
import { XPHistoryContent } from "../../app/[locale]/xp-history/page.jsx";
import AnalyticsClient from "../../app/[locale]/admin/analytics/AnalyticsClient";
import AdminArchivesPage from "../../app/[locale]/admin/archives/page.jsx";
import AdminModerationPage from "../../app/[locale]/admin/moderation/page";
import AdminSettingsPage from "../../app/[locale]/admin/settings/page";
import AdminWordsPage from "../../app/[locale]/admin/words/page";
import NotificationsPage from "../../app/[locale]/profile/notifications/page";
import DrillPage from "../../app/[locale]/drill/[id]/page";
import SectionAISettingsClient from "../../app/[locale]/section/[id]/settings/ai/SectionAISettingsClient";
import SectionGamificationSettingsPage from "../../app/[locale]/section/[id]/settings/gamification/page";

// Client sub-components for server-rendered pages
import { LiveLeaderboard } from "../../app/[locale]/leaderboard/LiveLeaderboard";
import { GradeActions } from "../../app/[locale]/instructor/grade/[id]/GradeActions";

import {
  NailedItSection,
  AvatarSection,
} from "../../app/[locale]/profile/[username]/ProfileClientSections";
import ProfileThemeWrapper from "../../app/[locale]/profile/[username]/ProfileThemeWrapper";

// Mock helpers
import { seedIndexPageData } from "../../.storybook/__mocks__/index-page-examples";
import { setMockUser } from "../../.storybook/__mocks__/aws-amplify-auth";
import { FilesProvider } from "../../src/context/fileContext";

const meta: Meta = {
  title: "📄 Pages/Application Pages",
  parameters: {
    layout: "fullscreen",
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/" },
    },
    viewport: { defaultViewport: "responsive" },
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
        username: "student-alice-sub",
        userId: "student-alice-sub",
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
        groups: ["section-jpn-101-learners"],
      });
      seedIndexPageData("student");
      return <Story />;
    },
  ],
  render: () => <SettingsPage />,
  parameters: {
    mockAuth: {
      user: {
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
      },
      session: {
        username: "student-alice-sub",
        identityId: "identity-alice",
        groups: ["section-jpn-101-learners"],
      },
    },
    nextjs: { navigation: { pathname: "/settings" } },
  },
};

// ---------------------------------------------------------------------------
// Recycle Bin Page
// ---------------------------------------------------------------------------

export const RecycleBin: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "teacher-1",
        userId: "teacher-1",
        attributes: { sub: "teacher-1", email: "teacher@example.com" },
        groups: ["Admins", "Instructors"],
      });
      seedIndexPageData("instructor");
      return <Story />;
    },
  ],
  render: () => <RecycleBinPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: "teacher-1", email: "teacher@example.com" } },
      session: {
        username: "teacher-1",
        identityId: "identity-teacher-1",
        groups: ["Admins", "Instructors"],
      },
    },
    nextjs: { navigation: { pathname: "/recycle-bin" } },
  },
};

// ---------------------------------------------------------------------------
// Squads Page
// ---------------------------------------------------------------------------

export const Squads: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "student-alice-sub",
        userId: "student-alice-sub",
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
        groups: ["section-jpn-101-learners"],
      });
      seedIndexPageData("student");
      return <Story />;
    },
  ],
  render: () => <SquadsPage />,
  parameters: {
    mockAuth: {
      user: {
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
      },
      session: {
        username: "student-alice-sub",
        identityId: "identity-alice",
        groups: ["section-jpn-101-learners"],
      },
    },
    nextjs: { navigation: { pathname: "/squads" } },
  },
};

// ---------------------------------------------------------------------------
// Squad Detail Page
// ---------------------------------------------------------------------------

export const SquadDetail: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "student-alice-sub",
        userId: "student-alice-sub",
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
        groups: ["section-jpn-101-learners"],
      });
      seedIndexPageData("student");
      return <Story />;
    },
  ],
  render: () => <SquadDetailClient />,
  parameters: {
    mockAuth: {
      user: {
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
      },
      session: {
        username: "student-alice-sub",
        identityId: "identity-alice",
        groups: ["section-jpn-101-learners"],
      },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/squad/squad-1",
        segments: [["id", "squad-1"]],
      },
    },
  },
};

// ---------------------------------------------------------------------------
// XP History Page
// ---------------------------------------------------------------------------

export const XPHistory: Story = {
  render: () => <XPHistoryContent logs={[]} totalXP={0} />,
  parameters: {
    mockAuth: {
      user: {
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
      },
      session: {
        username: "student-alice-sub",
        identityId: "identity-alice",
        groups: ["section-jpn-101-learners"],
      },
    },
    nextjs: { navigation: { pathname: "/xp-history" } },
  },
};

// ---------------------------------------------------------------------------
// Leaderboard (Client Component)
// ---------------------------------------------------------------------------

export const Leaderboard: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "student-alice-sub",
        userId: "student-alice-sub",
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
        groups: ["section-jpn-101-learners"],
      });
      seedIndexPageData("student");
      return <Story />;
    },
  ],
  render: () => (
    <LiveLeaderboard
      initialEntries={[
        {
          studentId: "student-alice-sub",
          studentName: "Alice Johnson",
          avatarColor: "#6366f1",
          totalXP: 2450,
          level: 5,
          currentStreak: 7,
          completedAssignments: 12,
          onTimeSubmissions: 11,
          totalSubmissions: 12,
        },
        {
          studentId: "student-bob-sub",
          studentName: "Bob Smith",
          avatarColor: "#f59e0b",
          totalXP: 2100,
          level: 4,
          currentStreak: 3,
          completedAssignments: 10,
          onTimeSubmissions: 8,
          totalSubmissions: 10,
        },
        {
          studentId: "student-carol-sub",
          studentName: "Carol Davis",
          avatarColor: "#10b981",
          totalXP: 1800,
          level: 4,
          currentStreak: 5,
          completedAssignments: 9,
          onTimeSubmissions: 9,
          totalSubmissions: 9,
        },
        {
          studentId: "student-dave-sub",
          studentName: "Dave Wilson",
          avatarColor: "#ef4444",
          totalXP: 1500,
          level: 3,
          currentStreak: 1,
          completedAssignments: 7,
          onTimeSubmissions: 5,
          totalSubmissions: 7,
        },
        {
          studentId: "student-eve-sub",
          studentName: "Eve Martinez",
          avatarColor: "#8b5cf6",
          totalXP: 1200,
          level: 3,
          currentStreak: 14,
          completedAssignments: 6,
          onTimeSubmissions: 6,
          totalSubmissions: 6,
        },
      ]}
    />
  ),
  parameters: {
    mockAuth: {
      user: {
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
      },
      session: {
        username: "student-alice-sub",
        identityId: "identity-alice",
        groups: ["section-jpn-101-learners"],
      },
    },
    nextjs: { navigation: { pathname: "/leaderboard" } },
  },
};

// ---------------------------------------------------------------------------
// Notifications Page
// ---------------------------------------------------------------------------

export const Notifications: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "student-alice-sub",
        userId: "student-alice-sub",
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
        groups: ["section-jpn-101-learners"],
      });
      seedIndexPageData("student");
      return <Story />;
    },
  ],
  render: () => <NotificationsPage />,
  parameters: {
    mockAuth: {
      user: {
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
      },
      session: {
        username: "student-alice-sub",
        identityId: "identity-alice",
        groups: ["section-jpn-101-learners"],
      },
    },
    nextjs: { navigation: { pathname: "/profile/notifications" } },
  },
};

// ---------------------------------------------------------------------------
// Admin: Analytics
// ---------------------------------------------------------------------------

export const AdminAnalytics: Story = {
  render: () => <AnalyticsClient initialSections={[]} />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: "admin-1", email: "admin@example.com" } },
      session: {
        username: "admin-1",
        identityId: "identity-admin-1",
        groups: ["Admins", "Instructors"],
      },
    },
    nextjs: { navigation: { pathname: "/admin/analytics" } },
  },
};

// ---------------------------------------------------------------------------
// Admin: Archives
// ---------------------------------------------------------------------------

export const AdminArchives: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "admin-1",
        userId: "admin-1",
        attributes: { sub: "admin-1", email: "admin@example.com" },
        groups: ["Admins", "Instructors"],
      });
      seedIndexPageData("instructor");
      return <Story />;
    },
  ],
  render: () => <AdminArchivesPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: "admin-1", email: "admin@example.com" } },
      session: {
        username: "admin-1",
        identityId: "identity-admin-1",
        groups: ["Admins", "Instructors"],
      },
    },
    nextjs: { navigation: { pathname: "/admin/archives" } },
  },
};

// ---------------------------------------------------------------------------
// Admin: Moderation
// ---------------------------------------------------------------------------

export const AdminModeration: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "admin-1",
        userId: "admin-1",
        attributes: { sub: "admin-1", email: "admin@example.com" },
        groups: ["Admins", "Instructors"],
      });
      seedIndexPageData("instructor");
      return <Story />;
    },
  ],
  render: () => <AdminModerationPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: "admin-1", email: "admin@example.com" } },
      session: {
        username: "admin-1",
        identityId: "identity-admin-1",
        groups: ["Admins", "Instructors"],
      },
    },
    nextjs: { navigation: { pathname: "/admin/moderation" } },
  },
};

// ---------------------------------------------------------------------------
// Admin: Settings (Gamification Config)
// ---------------------------------------------------------------------------

export const AdminSettings: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "admin-1",
        userId: "admin-1",
        attributes: { sub: "admin-1", email: "admin@example.com" },
        groups: ["Admins", "Instructors"],
      });
      seedIndexPageData("instructor");
      return <Story />;
    },
  ],
  render: () => <AdminSettingsPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: "admin-1", email: "admin@example.com" } },
      session: {
        username: "admin-1",
        identityId: "identity-admin-1",
        groups: ["Admins", "Instructors"],
      },
    },
    nextjs: { navigation: { pathname: "/admin/settings" } },
  },
};

// ---------------------------------------------------------------------------
// Admin: Words (Vocabulary Management)
// ---------------------------------------------------------------------------

export const AdminWords: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "admin-1",
        userId: "admin-1",
        attributes: { sub: "admin-1", email: "admin@example.com" },
        groups: ["Admins", "Instructors"],
      });
      seedIndexPageData("instructor");
      return <Story />;
    },
  ],
  render: () => <AdminWordsPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: "admin-1", email: "admin@example.com" } },
      session: {
        username: "admin-1",
        identityId: "identity-admin-1",
        groups: ["Admins", "Instructors"],
      },
    },
    nextjs: { navigation: { pathname: "/admin/words" } },
  },
};

// ---------------------------------------------------------------------------
// Instructor: Grade Review
// ---------------------------------------------------------------------------

export const InstructorGrade: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "teacher-1",
        userId: "teacher-1",
        attributes: { sub: "teacher-1", email: "teacher@example.com" },
        groups: ["Instructors"],
      });
      seedIndexPageData("instructor");
      return (
        <FilesProvider>
          <Story />
        </FilesProvider>
      );
    },
  ],
  render: () => (
    <GradeActions
      unit={{
        id: "unit-japanese-1",
        name: "Introduction to Japanese Greetings",
        data: "",
      }}
      grades={[
        {
          id: "grade-alice-unit-1",
          attempt: 1,
          accuracy: 85,
          percentComplete: 100,
          complete: true,
          data: {
            "block-1": { complete: true, accuracy: 90 },
            "block-2": { complete: true, accuracy: 80 },
          },
          feedback: null,
          moderationStatus: null,
          moderationFlags: null,
          moderationCheckedAt: null,
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T11:30:00Z",
        },
      ]}
      studentName="Alice Johnson"
      moderation={null}
    />
  ),
  parameters: {
    mockAuth: {
      user: { attributes: { sub: "teacher-1", email: "teacher@example.com" } },
      session: {
        username: "teacher-1",
        identityId: "identity-teacher-1",
        groups: ["Instructors"],
      },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/instructor/grade/grade-alice-unit-1",
        segments: [["id", "grade-alice-unit-1"]],
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Practice Drill Page
// ---------------------------------------------------------------------------

export const Drill: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "student-alice-sub",
        userId: "student-alice-sub",
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
        groups: ["section-jpn-101-learners"],
      });
      seedIndexPageData("student");
      return <Story />;
    },
  ],
  render: () => <DrillPage />,
  parameters: {
    mockAuth: {
      user: {
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
      },
      session: {
        username: "student-alice-sub",
        identityId: "identity-alice",
        groups: ["section-jpn-101-learners"],
      },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/drill/unit-jp-101",
        segments: [["id", "unit-jp-101"]],
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Offline Fallback Page (server page — rendered as static UI)
// ---------------------------------------------------------------------------

export const Offline: Story = {
  render: () => (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <span style={{ fontSize: "3rem" }}>📡</span>
      <h1 style={{ margin: 0 }}>You are offline</h1>
      <p style={{ color: "#666" }}>
        Check your internet connection and try again.
      </p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  ),
  parameters: {
    nextjs: { navigation: { pathname: "/offline" } },
  },
};

// ---------------------------------------------------------------------------
// Privacy Policy Page (server page — rendered as static UI)
// ---------------------------------------------------------------------------

export const Privacy: Story = {
  render: () => (
    <div
      style={{
        maxWidth: 720,
        margin: "2rem auto",
        padding: "2rem",
        fontFamily: "sans-serif",
      }}
    >
      <h1>Privacy Policy</h1>
      <p style={{ color: "#555" }}>Last updated: January 2025</p>
      <h2>Data Collection</h2>
      <p>
        We collect information you provide directly, including your name, email
        address, and learning progress data.
      </p>
      <h2>How We Use Your Data</h2>
      <p>
        Your data is used to provide personalized learning experiences, track
        progress, and improve our platform.
      </p>
      <h2>Data Storage</h2>
      <p>
        All data is stored securely on AWS infrastructure with encryption at
        rest and in transit.
      </p>
      <h2>Your Rights</h2>
      <p>
        You may request deletion of your data at any time by contacting support.
      </p>
    </div>
  ),
  parameters: {
    nextjs: { navigation: { pathname: "/privacy" } },
  },
};

// ---------------------------------------------------------------------------
// Public Profile Page (server page — using client sub-components)
// ---------------------------------------------------------------------------

export const ProfilePublic: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "student-alice-sub",
        userId: "student-alice-sub",
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
        groups: ["section-jpn-101-learners"],
      });
      seedIndexPageData("student");
      return <Story />;
    },
  ],
  render: () => (
    <ProfileThemeWrapper themeId="default" customPalette={null}>
      <div style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
        <h1>Alice Johnson</h1>
        <p style={{ color: "#666" }}>Level 12 • 2,450 XP</p>
        <AvatarSection
          isOwnProfile={true}
          profileUsername="student-alice-sub"
        />
        <NailedItSection nailedItBlocks={[]} />
      </div>
    </ProfileThemeWrapper>
  ),
  parameters: {
    mockAuth: {
      user: {
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
      },
      session: {
        username: "student-alice-sub",
        identityId: "identity-alice",
        groups: ["section-jpn-101-learners"],
      },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/profile/student-alice-sub",
        segments: [["username", "student-alice-sub"]],
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Section AI Settings Page
// ---------------------------------------------------------------------------

export const SectionAISettings: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "teacher-1",
        userId: "teacher-1",
        attributes: { sub: "teacher-1", email: "teacher@example.com" },
        groups: ["Admins", "Instructors"],
      });
      seedIndexPageData("instructor");
      return <Story />;
    },
  ],
  render: () => <SectionAISettingsClient />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: "teacher-1", email: "teacher@example.com" } },
      session: {
        username: "teacher-1",
        identityId: "identity-teacher-1",
        groups: ["Admins", "Instructors"],
      },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/section/section-jpn-101/settings/ai",
        segments: [["id", "section-jpn-101"]],
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Section Gamification Settings Page
// ---------------------------------------------------------------------------

export const SectionGamificationSettings: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "teacher-1",
        userId: "teacher-1",
        attributes: { sub: "teacher-1", email: "teacher@example.com" },
        groups: ["Admins", "Instructors"],
      });
      seedIndexPageData("instructor");
      return <Story />;
    },
  ],
  render: () => <SectionGamificationSettingsPage />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: "teacher-1", email: "teacher@example.com" } },
      session: {
        username: "teacher-1",
        identityId: "identity-teacher-1",
        groups: ["Admins", "Instructors"],
      },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/section/section-jpn-101/settings/gamification",
        segments: [["id", "section-jpn-101"]],
      },
    },
  },
};
