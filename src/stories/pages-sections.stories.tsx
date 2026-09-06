/**
 * @fileoverview Storybook stories for the Sections (class management) page
 *
 * Split out of pages.stories.tsx so opening this story doesn't force Vite to
 * transform heavy sibling pages (Lexical editor, Workbook, Peer Review, etc) —
 * previously all pages shared one module, making the Sections story slow to load.
 *
 * @module stories/pages-sections.stories
 */

import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import SectionsClient from "../../app/[locale]/sections/SectionsClient";

import {
  seedIndexPageData,
  mockSections,
} from "../../.storybook/__mocks__/index-page-examples";
import { setMockUser } from "../../.storybook/__mocks__/aws-amplify-auth";
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
 * Sections list page with ability to create and view sections.
 */
export const Sections: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "student-alice-sub",
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
        groups: ["section-jpn-101-learners", "section-jpn-102-learners"],
      });
      seedIndexPageData("student");
      return <Story />;
    },
  ],
  render: () => (
    <SectionsClient
      initialSections={[
        mockSections["section-jpn-101"],
        mockSections["section-jpn-102"],
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
        groups: ["section-jpn-101-learners", "section-jpn-102-learners"],
      },
    },
    nextjs: { navigation: { pathname: "/sections" } },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0);
  },
};

/**
 * Sections page empty state prompting to create first section.
 */
export const SectionsEmptyState: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "new-student",
        attributes: { sub: "new-student", email: "new.student@example.com" },
        groups: [],
      });
      seedIndexPageData("empty");
      return <Story />;
    },
  ],
  render: () => <SectionsClient initialSections={[]} />,
  parameters: {
    mockAuth: {
      user: {
        attributes: { sub: "new-student", email: "new.student@example.com" },
      },
      session: { username: "new-student", groups: [] },
    },
    nextjs: { navigation: { pathname: "/sections" } },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0);
  },
};
