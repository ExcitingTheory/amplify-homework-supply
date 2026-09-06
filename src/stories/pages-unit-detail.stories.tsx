/**
 * @fileoverview Storybook stories for the Unit Detail (Lexical editor) page
 *
 * Split out of pages.stories.tsx — this page pulls in the full Lexical editor
 * bundle (Editor3), which is by far the heaviest page. Kept isolated so it
 * doesn't slow down loading other, lighter pages that shared the same module.
 *
 * @module stories/pages-unit-detail.stories
 */

import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import UnitEditorClient from "../../app/[locale]/unit/[id]/UnitEditorClient";

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
 * Unit editor page with Lexical-based rich text editor and educational content nodes.
 */
export const UnitDetail: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "teacher-1",
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
  render: () => <UnitEditorClient />,
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
        pathname: "/unit/unit-japanese-1",
        segments: [["id", "unit-japanese-1"]],
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0);
  },
};
