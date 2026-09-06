/**
 * Quick Tour - Student Workflow
 * Live interactive demo using actual page components with play() interactions.
 */
import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within, waitFor, userEvent, expect } from "storybook/test";
import { Box } from "@mui/material";
import { setMockUser } from "@storybook-mocks/aws-amplify-auth";
import { clearMockData } from "@storybook-mocks/aws-amplify-data";
import { seedIndexPageData } from "@storybook-mocks/index-page-examples";
import { setNavigationState } from "@storybook-mocks/next-navigation";
import { PathParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime.js";
import { FilesProvider } from "../../src/context/fileContext";

// App Router pages — all marked 'use client', safe for Storybook.
import DashboardClient from "../../app/[locale]/DashboardClient.jsx";
import SectionDetailClient from "../../app/[locale]/section/[id]/SectionDetailClient.jsx";
import WorkbookClient from "../../app/[locale]/workbook/[id]/WorkbookClient";

const meta: Meta = {
  title: "🏠 Getting Started/Quick Tour/Student Workflow",
  tags: ["!autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { disable: true },
    // Page components manage their own providers
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
    nextjs: {
      appDirectory: true,
    },
  },
};
export default meta;
type Story = StoryObj;

/**
 * Step 1 — Student dashboard with assignments and progress.
 */
export const Step1_Dashboard: Story = {
  name: "1. Student Dashboard",
  loaders: [
    async () => {
      clearMockData();
      setMockUser({
        username: "student-alice-sub",
        attributes: {
          sub: "student-alice-sub",
          email: "alice@example.com",
          name: "Alice Johnson",
        },
        groups: [
          "Learners",
          "section-jpn-101-learners",
          "section-jpn-102-learners",
        ],
      });
      setNavigationState({ pathname: "/", params: {} });
      seedIndexPageData("student");
    },
  ],
  decorators: [
    (Story: React.FC) => (
      <FilesProvider>
        <Story />
      </FilesProvider>
    ),
  ],
  render: () => (
    <Box>
      <DashboardClient
        initialSections={[]}
        initialAssignments={[]}
        initialGrades={[]}
      />
    </Box>
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
        groups: [
          "Learners",
          "section-jpn-101-learners",
          "section-jpn-102-learners",
        ],
        idToken: {
          payload: { sub: "student-alice-sub" },
          toString: () => "mock-id-token",
        },
      },
    },
    nextjs: {
      navigation: { pathname: "/" },
    },
    initializeMockData: false,
    clearMockData: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("View student dashboard", async () => {
      await waitFor(
        () => {
          const matches = canvas.getAllByText(/Japanese/i);
          if (matches.length === 0) throw new Error("No content found");
        },
        { timeout: 8000 },
      );
    });
    await step("Student sees their assignments and progress", async () => {
      await new Promise((r) => setTimeout(r, 1500));
    });
  },
};

/**
 * Step 2 — Join a section and view class assignments.
 */
export const Step2_JoinSection: Story = {
  name: "2. Section & Assignments",
  loaders: [
    async () => {
      clearMockData();
      setMockUser({
        username: "student-alice-sub",
        attributes: {
          sub: "student-alice-sub",
          email: "alice@example.com",
          name: "Alice Johnson",
        },
        groups: [
          "Learners",
          "section-jpn-101-learners",
          "section-jpn-102-learners",
        ],
      });
      setNavigationState({
        pathname: "/section/section-jpn-101",
        params: { id: "section-jpn-101" },
      });
      seedIndexPageData("student");
    },
  ],
  decorators: [
    (Story: React.FC) => (
      <FilesProvider>
        <Story />
      </FilesProvider>
    ),
  ],
  render: () => (
    <Box>
      <PathParamsContext.Provider
        value={{ id: "section-jpn-101", locale: "en" }}
      >
        <SectionDetailClient />
      </PathParamsContext.Provider>
    </Box>
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
        groups: [
          "Learners",
          "section-jpn-101-learners",
          "section-jpn-102-learners",
        ],
      },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/section/section-jpn-101",
        segments: [["id", "section-jpn-101"]],
      },
    },
    initializeMockData: false,
    clearMockData: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("View section assignments", async () => {
      await waitFor(
        () => {
          const matches = canvas.getAllByText(/Japanese/i);
          if (matches.length === 0) throw new Error("No Japanese text found");
        },
        { timeout: 8000 },
      );
    });
    await step("Student can see due dates and progress", async () => {
      await new Promise((r) => setTimeout(r, 1500));
    });
  },
};

/**
 * Step 3 — Complete a workbook with graded blocks.
 */
export const Step3_Workbook: Story = {
  name: "3. Workbook",
  loaders: [
    async () => {
      clearMockData();
      setMockUser({
        username: "student-alice-sub",
        attributes: {
          sub: "student-alice-sub",
          email: "alice@example.com",
          name: "Alice Johnson",
        },
        groups: [
          "Learners",
          "section-jpn-101-learners",
          "section-jpn-102-learners",
        ],
      });
      setNavigationState({
        pathname: "/workbook/unit-japanese-1",
        params: { id: "unit-japanese-1" },
      });
      seedIndexPageData("student");
    },
  ],
  decorators: [
    (Story: React.FC) => (
      <FilesProvider>
        <Story />
      </FilesProvider>
    ),
  ],
  render: () => (
    <Box>
      <PathParamsContext.Provider
        value={{ id: "unit-japanese-1", locale: "en" }}
      >
        <WorkbookClient />
      </PathParamsContext.Provider>
    </Box>
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
        groups: [
          "Learners",
          "section-jpn-101-learners",
          "section-jpn-102-learners",
        ],
      },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/workbook/unit-japanese-1",
        segments: [["id", "unit-japanese-1"]],
      },
    },
    unitId: "unit-japanese-1",
    initializeMockData: false,
    clearMockData: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Wait for workbook to load", async () => {
      await waitFor(
        () => {
          expect(canvas.getAllByText(/Japanese/i).length).toBeGreaterThan(0);
        },
        { timeout: 8000 },
      );
    });
    await step("Student interacts with graded content", async () => {
      await new Promise((r) => setTimeout(r, 2000));
    });
  },
};
