/**
 * @fileoverview Storybook stories for the Workbook (student assignment view) page
 *
 * Split out of pages.stories.tsx so opening this story doesn't force Vite to
 * transform heavy sibling pages (Lexical editor, Peer Review, etc).
 *
 * @module stories/pages-workbook.stories
 */

import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import WorkbookClient from "../../app/[locale]/workbook/[id]/WorkbookClient";

import { seedIndexPageData } from "../../.storybook/__mocks__/index-page-examples";
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
 * Student workbook view for completing unit exercises and viewing results.
 */
export const Workbook: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "student-alice-sub",
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
        groups: ["section-jpn-101-learners"],
      });
      seedIndexPageData("student");
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
        pathname: "/workbook/unit-japanese-1",
        segments: [["id", "unit-japanese-1"]],
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0);
  },
};

/**
 * Workbook page showing timed exercise start screen with instructions.
 */
export const WorkbookTimedExercise: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "student-alice-sub",
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
        groups: ["section-jpn-101-learners"],
      });
      seedIndexPageData("student");
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
        pathname: "/workbook/assignment-2",
        segments: [["id", "assignment-2"]],
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0);
  },
};
