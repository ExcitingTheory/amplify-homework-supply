/**
 * @fileoverview Storybook stories for the Index (Dashboard) page
 *
 * Split out of pages.stories.tsx so opening this story doesn't force Vite to
 * transform heavy sibling pages (Lexical editor, Workbook, Peer Review, etc).
 *
 * @module stories/pages-index.stories
 */

import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import DashboardClient from "../../app/[locale]/DashboardClient";

import {
  seedIndexPageData,
  mockSections,
  studentAssignments,
  studentGrades,
} from "../../.storybook/__mocks__/index-page-examples";
import { setMockUser } from "../../.storybook/__mocks__/aws-amplify-auth";
import { FilesProvider } from "../../src/context/fileContext";
import { expect } from "storybook/test";

const meta: Meta = {
  title: "📄 Pages/Application Pages",
  parameters: {
    layout: "fullscreen",
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/",
      },
    },
    viewport: {
      defaultViewport: "responsive",
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Home page displaying assignments, grades, and sections for the current user.
 */
export const Index: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "student-alice-sub",
        userId: "student-alice-sub",
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
        groups: ["section-jpn-101-learners", "section-jpn-102-learners"],
      });
      seedIndexPageData("student");
      return (
        <FilesProvider>
          <Story />
        </FilesProvider>
      );
    },
  ],
  render: () => (
    <DashboardClient
      signOut={undefined}
      user={{
        username: "student-alice-sub",
        userId: "student-alice-sub",
        attributes: {
          sub: "student-alice-sub",
          email: "alice@example.com",
          name: "Alice Smith",
        },
        groups: ["section-jpn-101-learners", "section-jpn-102-learners"],
      }}
      initialSections={[
        mockSections["section-jpn-101"],
        mockSections["section-jpn-102"],
      ]}
      initialAssignments={studentAssignments}
      initialGrades={studentGrades}
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
        groups: ["section-jpn-101-learners", "section-jpn-102-learners"],
      },
    },
    nextjs: { navigation: { pathname: "/" } },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0);
  },
};

/**
 * Home page state when user has no sections — prompts to join or create.
 */
export const IndexNoSections: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "new-student",
        attributes: { sub: "new-student", email: "new.student@example.com" },
        groups: [],
      });
      seedIndexPageData("empty");
      return (
        <FilesProvider>
          <Story />
        </FilesProvider>
      );
    },
  ],
  render: () => (
    <DashboardClient
      signOut={undefined}
      user={undefined}
      initialSections={[]}
      initialAssignments={[]}
      initialGrades={[]}
    />
  ),
  parameters: {
    mockAuth: {
      user: {
        attributes: { sub: "new-student", email: "new.student@example.com" },
      },
      session: { username: "new-student", groups: [] },
    },
    nextjs: { navigation: { pathname: "/" } },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0);
  },
};

/**
 * Home page showing both pending and completed assignments with grade statistics.
 */
export const IndexAssignments: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "student-alice-sub",
        userId: "student-alice-sub",
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
        groups: ["section-jpn-101-learners", "section-jpn-102-learners"],
      });
      seedIndexPageData("student");
      return (
        <FilesProvider>
          <Story />
        </FilesProvider>
      );
    },
  ],
  render: () => (
    <DashboardClient
      signOut={undefined}
      user={{
        username: "student-alice-sub",
        userId: "student-alice-sub",
        attributes: {
          sub: "student-alice-sub",
          email: "alice@example.com",
          name: "Alice Smith",
        },
        groups: ["section-jpn-101-learners", "section-jpn-102-learners"],
      }}
      initialSections={[
        mockSections["section-jpn-101"],
        mockSections["section-jpn-102"],
      ]}
      initialAssignments={studentAssignments}
      initialGrades={studentGrades}
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
        groups: ["section-jpn-101-learners", "section-jpn-102-learners"],
      },
    },
    nextjs: { navigation: { pathname: "/" } },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0);
  },
};
