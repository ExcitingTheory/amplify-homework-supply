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
import ModerationClient from "../../app/[locale]/admin/moderation/ModerationClient";
import AdminSettingsPage from "../../app/[locale]/admin/settings/page";
import WordListClient from "../../app/[locale]/admin/words/WordListClient";
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
  UnlockRoadmap,
} from "../../app/[locale]/profile/[username]/ProfileClientSections";
import ProfileThemeWrapper from "../../app/[locale]/profile/[username]/ProfileThemeWrapper";
import { GamificationProviderWrapper } from "../../src/context/gamificationProviderWrapper";
import { BadgeShelf } from "../../src/components/Gamification/BadgeShelf";
import { StreakCalendar } from "../../src/components/Gamification/StreakCalendar";
import { ProgressRings } from "../../src/components/Gamification/ProgressRings";
import { StreakShield } from "../../src/components/Gamification/StreakShield";
import { Box, Card, Typography } from "@mui/material";

// Mock helpers
import {
  mockSections,
  seedIndexPageData,
} from "../../.storybook/__mocks__/index-page-examples";
import {
  seedMockAnalyticsSummary,
  seedMockSections,
} from "../../.storybook/__mocks__/aws-amplify-data";
import { setMockUser } from "../../.storybook/__mocks__/aws-amplify-auth";
import { FilesProvider } from "../../src/context/fileContext";
import { withAppShell } from "./withAppShell";

// Offline fallback page (real component) + its offline data store
import { OfflinePageContent } from "../../app/[locale]/offline/OfflinePageContent";
import { cacheAssignment } from "../offline/OfflineDataStore";

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
    withAppShell,
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
    withAppShell,
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
    withAppShell,
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
    withAppShell,
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
  decorators: [withAppShell],
  render: () => (
    <XPHistoryContent
      logs={[
        {
          id: "xp-1",
          reason: "ALL_BLOCKS_COMPLETED",
          xpAmount: 120,
          createdAt: "2026-09-12T14:30:00Z",
        },
        {
          id: "xp-2",
          reason: "ON_TIME_SUBMISSION",
          xpAmount: 25,
          createdAt: "2026-09-12T14:29:00Z",
        },
        {
          id: "xp-3",
          reason: "NAILED_IT",
          xpAmount: 50,
          createdAt: "2026-09-11T10:15:00Z",
        },
        {
          id: "xp-4",
          reason: "PEER_REVIEW_GIVEN",
          xpAmount: 15,
          createdAt: "2026-09-10T09:00:00Z",
        },
        {
          id: "xp-5",
          reason: "STREAK_7DAY",
          xpAmount: 70,
          createdAt: "2026-09-09T08:00:00Z",
        },
        {
          id: "xp-6",
          reason: "PERFECT_SCORE",
          xpAmount: 100,
          createdAt: "2026-09-08T16:45:00Z",
        },
      ]}
      totalXP={380}
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
    withAppShell,
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
    withAppShell,
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

/**
 * Builds a run of daily AnalyticsSummary records matching the real
 * `amplify/data/resource.ts` schema shape (see docs/ANALYTICS_IMPLEMENTATION.md).
 */
function buildMockAnalyticsSummaries(days: number, sectionId?: string) {
  const scope = sectionId ? "section" : "platform";
  const scopeId = sectionId || "all";
  const now = new Date();
  const summaries = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split("T")[0];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const activity = isWeekend ? 0.55 : 1;
    const dailyActiveUsers = Math.round((40 + (i % 7) * 6) * activity);
    const totalSessions = Math.round(dailyActiveUsers * 1.8);
    const gradesSubmitted = Math.round((18 + (i % 5) * 4) * activity);
    const workbooksStarted = Math.round((10 + (i % 4) * 3) * activity);

    summaries.push({
      id: `${scope}#${scopeId}#${date}`,
      date,
      scope,
      scopeId,
      ...(sectionId ? { sectionId } : {}),
      dailyActiveUsers,
      totalPageViews: dailyActiveUsers * 12,
      totalSessions,
      avgSessionDurationMs: 6 * 60 * 1000 + (i % 5) * 45_000,
      totalEngagedTimeMs: totalSessions * 3 * 60 * 1000,
      avgEngagedTimeMs: 3 * 60 * 1000 + (i % 3) * 20_000,
      gradesSubmitted,
      avgAccuracy: 78 + (i % 10),
      workbooksStarted,
      workbooksCompleted: Math.round(workbooksStarted * 0.72),
      studentChatMessagesSent: Math.round(gradesSubmitted * 1.4),
      instructorChatMessagesSent: Math.round(gradesSubmitted * 0.2),
      documentsAnalyzed: Math.round((i % 4) + (isWeekend ? 0 : 2)),
      topPages: [
        { path: "/units", views: dailyActiveUsers * 4 },
        { path: "/dashboard", views: dailyActiveUsers * 3 },
      ],
    });
  }

  // Deliberate outlier 3 days ago (platform scope only) to demo anomaly detection
  if (!sectionId) {
    const outlier = summaries[summaries.length - 4];
    if (outlier) {
      outlier.dailyActiveUsers = Math.round(outlier.dailyActiveUsers * 0.25);
      outlier.totalSessions = Math.round(outlier.totalSessions * 0.25);
    }
  }
  return summaries;
}

export const AdminAnalytics: Story = {
  decorators: [withAppShell],
  render: () => {
    seedMockSections([
      mockSections["section-jpn-101"],
      mockSections["section-jpn-102"],
    ]);
    seedMockAnalyticsSummary(buildMockAnalyticsSummaries(95));
    seedMockAnalyticsSummary(
      buildMockAnalyticsSummaries(95, "section-jpn-101"),
    );
    seedMockAnalyticsSummary(
      buildMockAnalyticsSummaries(95, "section-jpn-102"),
    );
    return <AnalyticsClient initialSections={[]} />;
  },
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
    withAppShell,
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
    withAppShell,
  ],
  render: () => (
    <ModerationClient
      initialItems={[
        {
          id: "grade-flagged-1",
          modelName: "Grade",
          owner: "student-alice-sub",
          moderation: {
            status: "flagged",
            flags: JSON.stringify({ categories: { harassment: true } }),
            checkedAt: "2026-09-12T10:00:00Z",
          },
          createdAt: "2026-09-11T09:00:00Z",
          updatedAt: "2026-09-12T10:00:00Z",
          sectionId: "section-jpn-101",
        },
        {
          id: "word-flagged-1",
          modelName: "Word",
          owner: "student-bob-sub",
          moderation: {
            status: "flagged",
            flags: JSON.stringify({ categories: { "hate/threatening": true } }),
            checkedAt: "2026-09-10T14:00:00Z",
          },
          createdAt: "2026-09-09T08:00:00Z",
          updatedAt: "2026-09-10T14:00:00Z",
          sectionId: null,
        },
      ]}
    />
  ),
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
    withAppShell,
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
    withAppShell,
  ],
  render: () => (
    <WordListClient
      initialWords={[
        {
          id: "word-1",
          phrase: "こんにちは",
          pronunciation: "konnichiwa",
          definition: "hello / good afternoon",
          audio: ["public/audio/konnichiwa.mp3"],
          definitionAudio: null,
          owner: "teacher-1",
          createdAt: "2026-01-10T10:00:00Z",
          updatedAt: "2026-01-10T10:00:00Z",
          moderation: { status: "ok" },
          embedding: { model: "text-embedding-3-small" },
        },
        {
          id: "word-2",
          phrase: "ありがとう",
          pronunciation: "arigatou",
          definition: "thank you",
          audio: null,
          definitionAudio: null,
          owner: "teacher-1",
          createdAt: "2026-01-11T10:00:00Z",
          updatedAt: "2026-01-11T10:00:00Z",
          moderation: null,
          embedding: null,
        },
        {
          id: "word-3",
          phrase: "さようなら",
          pronunciation: null,
          definition: null,
          audio: null,
          definitionAudio: null,
          owner: "student-alice-sub",
          createdAt: "2026-01-12T10:00:00Z",
          updatedAt: "2026-01-12T10:00:00Z",
          moderation: { status: "flagged" },
          embedding: null,
        },
      ]}
    />
  ),
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
    withAppShell,
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
  loaders: [
    async () => {
      // Seed the real OfflineDataStore (IndexedDB) so the page lists cached
      // assignments through its actual code path.
      const now = Date.now();
      await cacheAssignment({
        id: "offline-asg-1",
        unitID: "unit-japanese-1",
        sectionID: "sec-jpn-101",
        unitName: "Introduction to Japanese Greetings",
        dueDate: "2026-09-20",
        status: "PUBLISHED",
        cachedAt: now,
      });
      await cacheAssignment({
        id: "offline-asg-2",
        unitID: "unit-japanese-2",
        sectionID: "sec-jpn-101",
        unitName: "Hiragana Basics",
        dueDate: "2026-09-27",
        status: "PUBLISHED",
        cachedAt: now - 1000,
      });
      return {};
    },
  ],
  render: () => <OfflinePageContent />,
  parameters: {
    minimalProviders: true,
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
    withAppShell,
  ],
  render: () => (
    <ProfileThemeWrapper themeId="default" customPalette={null}>
      <GamificationProviderWrapper sectionID={undefined}>
        <Box
          data-tour="profile-page"
          sx={{
            marginTop: "1rem",
            px: 2,
            pb: 3,
            maxWidth: "60rem",
            mx: "auto",
            boxSizing: "border-box",
          }}
        >
          {/* Top row: Avatar + Activity side by side */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
              mb: 2,
            }}
          >
            <Card
              sx={{
                padding: "2rem 1rem",
                paddingTop: "2.5rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                overflow: "visible",
              }}
            >
              <AvatarSection
                isOwnProfile={false}
                profileUsername="student-bob-sub"
                streak={7}
              />
              <Typography variant="h5">Bob Smith</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <StreakShield freezesRemaining={2} freezesUsed={1} />
              </Box>
            </Card>

            <Card
              sx={{
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="h5" gutterBottom>
                Activity
              </Typography>
              <StreakCalendar
                activeDays={
                  new Set([
                    "2026-09-01",
                    "2026-09-02",
                    "2026-09-05",
                    "2026-09-08",
                    "2026-09-10",
                    "2026-09-11",
                    "2026-09-12",
                  ])
                }
              />
            </Card>
          </Box>

          {/* Progress Rings */}
          <Card sx={{ padding: "2rem 1rem", mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Progress
            </Typography>
            <ProgressRings
              modules={[
                {
                  moduleId: "unit-jp-101",
                  moduleName: "Hiragana Basics",
                  completionPercent: 100,
                  totalWorkbooks: 5,
                  completedWorkbooks: 5,
                },
                {
                  moduleId: "unit-jp-102",
                  moduleName: "Katakana Basics",
                  completionPercent: 60,
                  totalWorkbooks: 5,
                  completedWorkbooks: 3,
                },
              ]}
            />
          </Card>

          {/* Badges */}
          <Card sx={{ padding: "2rem 1rem", mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Badges
            </Typography>
            <BadgeShelf
              earnedBadges={[
                {
                  badgeType: "FIRST_SUBMISSION",
                  awardedAt: "2025-01-15T10:00:00Z",
                },
                {
                  badgeType: "SHARPSHOOTER",
                  awardedAt: "2025-02-10T11:00:00Z",
                },
                {
                  badgeType: "DEEP_THINKER",
                  awardedAt: "2025-03-10T12:00:00Z",
                },
              ]}
            />
          </Card>

          {/* Unlock Roadmap (live lock state — client component) */}
          <UnlockRoadmap />

          {/* Nailed It Wall */}
          <NailedItSection
            nailedItBlocks={[
              {
                id: "nailed-1",
                question: "Recognize こんにちは",
                nailedItReason:
                  "Excellent understanding demonstrated in a completed task.",
                homeworkTitle: "Learner Workbook",
                createdAt: "2026-09-10T10:00:00Z",
              },
              {
                id: "nailed-2",
                question: "Order numbers 1–10",
                nailedItReason:
                  "Excellent understanding demonstrated in a completed task.",
                homeworkTitle: "Learner Workbook",
                createdAt: "2026-09-08T10:00:00Z",
              },
            ]}
          />
        </Box>
      </GamificationProviderWrapper>
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
        pathname: "/profile/student-bob-sub",
        segments: [["username", "student-bob-sub"]],
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
    withAppShell,
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
    withAppShell,
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
