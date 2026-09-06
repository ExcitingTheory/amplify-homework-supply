/**
 * @fileoverview Storybook stories for the Units (learning content library) page
 *
 * Split out of pages.stories.tsx so opening this story doesn't force Vite to
 * transform heavy sibling pages (Lexical editor, Workbook, Peer Review, etc).
 *
 * @module stories/pages-units.stories
 */

import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import UnitsClient from "../../app/[locale]/units/UnitsClient";

import {
  seedIndexPageData,
  mockUnits,
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
 * Units list page showing published, draft, and archived learning units.
 */
export const Units: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "teacher-1",
        attributes: { sub: "teacher-1", email: "teacher@example.com" },
        groups: ["Instructors"],
      });
      seedIndexPageData("instructor");
      return <Story />;
    },
  ],
  render: () => <UnitsClient initialUnits={Object.values(mockUnits)} />,
  parameters: {
    mockAuth: {
      user: { attributes: { sub: "teacher-1", email: "teacher@example.com" } },
      session: {
        username: "teacher-1",
        identityId: "identity-teacher-1",
        groups: ["Instructors"],
      },
    },
    nextjs: { navigation: { pathname: "/units" } },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0);
  },
};

/**
 * Units page empty state prompting to create first unit.
 */
export const UnitsEmptyState: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "new-teacher",
        attributes: { sub: "new-teacher", email: "new.teacher@example.com" },
        groups: ["Instructors"],
      });
      seedIndexPageData("empty");
      return <Story />;
    },
  ],
  render: () => <UnitsClient initialUnits={[]} />,
  parameters: {
    mockAuth: {
      user: {
        attributes: { sub: "new-teacher", email: "new.teacher@example.com" },
      },
      session: { username: "new-teacher", groups: ["Instructors"] },
    },
    nextjs: { navigation: { pathname: "/units" } },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0);
  },
};
