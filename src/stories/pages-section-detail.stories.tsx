/**
 * @fileoverview Storybook stories for the Section Detail page
 *
 * Split out of pages.stories.tsx so opening this story doesn't force Vite to
 * transform heavy sibling pages (Lexical editor, Workbook, Peer Review, etc).
 *
 * @module stories/pages-section-detail.stories
 */

import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import SectionDetailClient from "../../app/[locale]/section/[id]/SectionDetailClient";

import {
  seedIndexPageData,
  mockSections,
  studentAssignments,
} from "../../.storybook/__mocks__/index-page-examples";
import { setMockUser } from "../../.storybook/__mocks__/aws-amplify-auth";
import { seedMockSections } from "../../.storybook/__mocks__/aws-amplify-data";
import { FilesProvider } from "../../src/context/fileContext";
import { expect } from "storybook/test";
import { withAppShell } from "./withAppShell";

const meta: Meta = {
  title: "📄 Pages/Application Pages",
  decorators: [withAppShell],
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

const sectionWithDetails = {
  ...mockSections["section-jpn-101"],
  startDate: "2024-01-08",
  endDate: "2024-05-24",
  classSchedule: [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }],
  timezone: "America/Los_Angeles",
  location: {
    school: {
      name: "Pacific Prep",
      address: "100 Harbor Way, Seattle, WA",
    },
    campus: "North campus",
    buildingName: "Learning Center",
    roomNumber: "204",
  },
};

/**
 * Section detail page for instructors — student roster, gradebook, assignments.
 */
export const SectionDetail: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "teacher-1",
        attributes: { sub: "teacher-1", email: "teacher@example.com" },
        groups: ["Instructors"],
      });
      seedIndexPageData("instructor");
      seedMockSections([sectionWithDetails]);
      return (
        <FilesProvider>
          <Story />
        </FilesProvider>
      );
    },
  ],
  render: () => (
    <SectionDetailClient
      initialSection={sectionWithDetails}
      initialAssignments={studentAssignments}
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
        pathname: "/section/section-jpn-101",
        segments: [["id", "section-jpn-101"]],
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0);
    const summary = canvasElement.querySelector(
      '[data-tour="section-summary"]',
    );
    expect(summary?.textContent).toContain("Pacific Prep");
    expect(summary?.textContent).toContain("09:00–10:00");
  },
};

/**
 * Section detail page for students — personal grades and assignments.
 */
export const SectionDetailStudent: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "student-alice-sub",
        attributes: {
          sub: "student-alice-sub",
          email: "alice@example.com",
          name: "Alice Johnson",
        },
        groups: ["section-jpn-101-learners"],
      });
      seedIndexPageData("student");
      seedMockSections([sectionWithDetails]);
      return (
        <FilesProvider>
          <Story />
        </FilesProvider>
      );
    },
  ],
  render: () => (
    <SectionDetailClient
      initialSection={sectionWithDetails}
      initialAssignments={studentAssignments}
    />
  ),
  parameters: {
    mockAuth: {
      user: {
        attributes: {
          sub: "student-alice-sub",
          email: "alice@example.com",
          name: "Alice Johnson",
        },
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
        pathname: "/section/section-jpn-101",
        segments: [["id", "section-jpn-101"]],
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0);
  },
};
