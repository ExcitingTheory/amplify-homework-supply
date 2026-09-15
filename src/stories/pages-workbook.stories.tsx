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
import { withAppShell } from "./withAppShell";

import {
  mockSections,
  mockUnits,
  seedIndexPageData,
  studentAssignments,
} from "../../.storybook/__mocks__/index-page-examples";
import {
  clearMockData,
  seedMockAssignments,
  seedMockGrade,
  seedMockSections,
  seedMockUnit,
} from "../../.storybook/__mocks__/aws-amplify-data";
import { setMockUser } from "../../.storybook/__mocks__/aws-amplify-auth";
import { FilesProvider } from "../../src/context/fileContext";
import { expect } from "storybook/test";

function WorkbookPageStory() {
  return <WorkbookClient />;
}

const timedExerciseWorkbookState = {
  root: {
    type: "root",
    children: [
      {
        type: "heading",
        tag: "h1",
        direction: "ltr",
        format: "",
        indent: 0,
        version: 1,
        children: [
          {
            type: "text",
            text: "Japanese Numbers Timed Practice",
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
            version: 1,
          },
        ],
      },
      {
        type: "paragraph",
        direction: "ltr",
        format: "",
        indent: 0,
        version: 1,
        children: [
          {
            type: "text",
            text: "Answer each prompt as accurately as you can. This story starts before the timer begins, then renders this workbook content after the learner starts the attempt.",
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
            version: 1,
          },
        ],
      },
      {
        type: "list",
        listType: "bullet",
        tag: "ul",
        direction: "ltr",
        format: "",
        indent: 0,
        version: 1,
        start: 1,
        children: [
          {
            type: "listitem",
            direction: "ltr",
            format: "",
            indent: 0,
            version: 1,
            value: 1,
            children: [
              {
                type: "text",
                text: "Read the number in Japanese before choosing an answer.",
                format: 0,
                detail: 0,
                mode: "normal",
                style: "",
                version: 1,
              },
            ],
          },
          {
            type: "listitem",
            direction: "ltr",
            format: "",
            indent: 0,
            version: 1,
            value: 2,
            children: [
              {
                type: "text",
                text: "Use the retry-enabled assignment setting to start another attempt after submitting.",
                format: 0,
                detail: 0,
                mode: "normal",
                style: "",
                version: 1,
              },
            ],
          },
        ],
      },
      {
        type: "paragraph",
        direction: "ltr",
        format: "",
        indent: 0,
        version: 1,
        children: [
          {
            type: "text",
            text: "What is the Japanese reading for 20?",
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
            version: 1,
          },
        ],
      },
      {
        key: "timed-number-20-quiz",
        type: "quiz",
        version: 1,
        data: [
          {
            id: "timed-number-q1-correct",
            answer: "にじゅう",
            correct: true,
          },
          {
            id: "timed-number-q1-wrong-1",
            answer: "じゅうに",
            correct: false,
          },
          {
            id: "timed-number-q1-wrong-2",
            answer: "さんじゅう",
            correct: false,
          },
        ],
      },
      {
        type: "paragraph",
        direction: "ltr",
        format: "",
        indent: 0,
        version: 1,
        children: [
          {
            type: "text",
            text: "What is the Japanese reading for 45?",
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
            version: 1,
          },
        ],
      },
      {
        key: "timed-number-45-quiz",
        type: "quiz",
        version: 1,
        data: [
          {
            id: "timed-number-q2-correct",
            answer: "よんじゅうご",
            correct: true,
          },
          {
            id: "timed-number-q2-wrong-1",
            answer: "ごじゅうよん",
            correct: false,
          },
          {
            id: "timed-number-q2-wrong-2",
            answer: "しじゅうご",
            correct: false,
          },
        ],
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    version: 1,
  },
};

function seedTimedExerciseStory({
  completed = false,
  inProgress = false,
} = {}) {
  const unitId = completed
    ? "unit-japanese-2-completed"
    : inProgress
      ? "unit-japanese-2-in-progress"
      : "unit-japanese-2-start";
  clearMockData();
  seedMockUnit({
    ...mockUnits["unit-japanese-2"],
    id: unitId,
    retryEnabled: true,
    data: JSON.stringify(timedExerciseWorkbookState),
  });
  seedMockSections([mockSections["section-jpn-101"]]);
  seedMockAssignments(
    [
      studentAssignments.find(
        (assignment) => assignment.unitID === "unit-japanese-2",
      ),
    ]
      .filter(Boolean)
      .map((assignment) => ({
        ...assignment,
        id: `${assignment.id}-${completed ? "completed" : inProgress ? "in-progress" : "start"}`,
        unitID: unitId,
        workbookChatEnabled: false,
        aiChatEnabled: false,
      })),
  );

  if (inProgress || completed) {
    seedMockGrade({
      id: completed
        ? "grade-alice-timed-completed"
        : "grade-alice-timed-in-progress",
      unitID: unitId,
      owner: "student-alice-sub",
      identityId: "identity-alice",
      instructor: "teacher-1",
      unitVersion: 1,
      percentComplete: completed ? 100 : 35,
      accuracy: completed ? 95 : 88,
      complete: completed,
      timerStarted: true,
      data: JSON.stringify({
        "timed-number-20-quiz": {
          complete: true,
          accuracy: 100,
          selected: "にじゅう",
        },
        "timed-number-45-quiz": {
          complete: completed,
          accuracy: completed ? 90 : 0,
          selected: completed ? "よんじゅうご" : null,
        },
      }),
      feedback: null,
      files: [],
      createdAt: new Date(Date.now() - 30_000).toISOString(),
      updatedAt: new Date(Date.now() - 15_000).toISOString(),
      _version: 1,
      _lastChangedAt: Date.now() - 15_000,
      _deleted: false,
    });
  }
}

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
  render: () => <WorkbookPageStory />,
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
      seedTimedExerciseStory();
      return (
        <FilesProvider>
          <Story />
        </FilesProvider>
      );
    },
  ],
  render: () => <WorkbookPageStory />,
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
        pathname: "/workbook/unit-japanese-2-start",
        segments: [["id", "unit-japanese-2-start"]],
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0);
  },
};

/**
 * Workbook page showing a timed exercise after the timer has started.
 */
export const WorkbookTimedExerciseInProgress: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "student-alice-sub",
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
        groups: ["section-jpn-101-learners"],
      });
      seedTimedExerciseStory({ inProgress: true });
      return (
        <FilesProvider>
          <Story />
        </FilesProvider>
      );
    },
  ],
  render: () => <WorkbookPageStory />,
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
        pathname: "/workbook/unit-japanese-2-in-progress",
        segments: [["id", "unit-japanese-2-in-progress"]],
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0);
  },
};

/**
 * Workbook page showing the completed state for a timed exercise.
 */
export const WorkbookTimedExerciseCompleted: Story = {
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: "student-alice-sub",
        attributes: { sub: "student-alice-sub", email: "alice@example.com" },
        groups: ["section-jpn-101-learners"],
      });
      seedTimedExerciseStory({ completed: true });
      return (
        <FilesProvider>
          <Story />
        </FilesProvider>
      );
    },
  ],
  render: () => <WorkbookPageStory />,
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
        pathname: "/workbook/unit-japanese-2-completed",
        segments: [["id", "unit-japanese-2-completed"]],
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0);
  },
};
