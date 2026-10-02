/**
 * Stories for GradeReviewDrawer — the instructor-facing drawer opened from the
 * section gradebook (InlineGradeCell → "view work") that fetches a Grade +
 * Unit live via the Amplify client and renders the student's filled-in
 * workbook read-only via GradedWorkbookViewer.
 */

import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within, waitFor } from "storybook/test";
import {
  seedMockUnit,
  seedMockGrade,
  clearMockData,
} from "@storybook-mocks/aws-amplify-data";
import { GradeReviewDrawer } from "./GradeReviewDrawer";

const UNIT_ID = "unit-grade-review-1";

const MOCK_UNIT_CONTENT = JSON.stringify({
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Japanese Greetings - Unit 1",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "heading",
        tag: "h1",
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Complete the quiz below to test your knowledge of Japanese greetings.",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
});

function seedUnit() {
  seedMockUnit({
    id: UNIT_ID,
    name: "Japanese Greetings - Unit 1",
    data: MOCK_UNIT_CONTENT,
    owner: "teacher-1",
    _version: 1,
  });
}

// Aiko — single completed attempt, high score
const GRADE_AIKO = {
  id: "grade-review-aiko",
  unitID: UNIT_ID,
  owner: "student-aiko",
  sectionID: "section-grade-review-1",
  identityId: "identity-aiko",
  instructor: "teacher-1",
  unitVersion: 1,
  percentComplete: 100,
  accuracy: 92,
  complete: true,
  timerStarted: true,
  data: JSON.stringify({
    "quiz-block-1": {
      complete: true,
      accuracy: 100,
      responses: {
        "quiz-q1": { selected: "こんにちは", correct: true },
        "quiz-q2": { selected: "さようなら", correct: true },
      },
    },
    "custom-q-1": {
      complete: true,
      accuracy: 85,
      userAnswer:
        "In Japan, you say こんにちは during the daytime, おはようございます in the morning, and こんばんは at night.",
      feedback: "Good explanation, well detailed.",
    },
  }),
  feedback: JSON.stringify({
    overall: "Excellent work! Great grasp of greeting etiquette.",
    blockFeedback: { "quiz-block-1": "Perfect score!" },
  }),
  files: [],
  moderationStatus: "approved",
  moderationFlags: null,
  moderationCheckedAt: "2024-02-10T15:30:00Z",
  createdAt: "2024-02-10T14:00:00Z",
  updatedAt: "2024-02-10T15:30:00Z",
  _version: 2,
  _lastChangedAt: Date.parse("2024-02-10T15:30:00Z"),
  _deleted: false,
};

// Aiko's earlier, lower-scoring attempt (same owner + unit as GRADE_AIKO,
// so GradeReviewDrawer's internal fetch groups both into the attempt tabs)
const GRADE_AIKO_ATTEMPT_1 = {
  ...GRADE_AIKO,
  id: "grade-review-aiko-attempt-1",
  accuracy: 68,
  data: JSON.stringify({
    "quiz-block-1": {
      complete: true,
      accuracy: 75,
      responses: {
        "quiz-q1": { selected: "こんにちは", correct: true },
        "quiz-q2": { selected: "ありがとう", correct: false },
      },
    },
    "custom-q-1": {
      complete: true,
      accuracy: 60,
      userAnswer: "You say hello with konnichiwa.",
      feedback: "Correct but too brief — add more greetings.",
    },
  }),
  feedback: JSON.stringify({
    overall: "Decent first attempt — review farewell vs. gratitude phrases.",
    blockFeedback: { "quiz-block-1": "Confusing さようなら with ありがとう" },
  }),
  moderationStatus: null,
  moderationCheckedAt: null,
  createdAt: "2024-02-08T14:00:00Z",
  updatedAt: "2024-02-08T14:40:00Z",
  _version: 1,
  _lastChangedAt: Date.parse("2024-02-08T14:40:00Z"),
};

// Kenji — a second student's grade on the same unit, used for prev/next nav
const GRADE_KENJI = {
  ...GRADE_AIKO,
  id: "grade-review-kenji",
  owner: "student-kenji",
  identityId: "identity-kenji",
  accuracy: 54,
  data: JSON.stringify({
    "quiz-block-1": {
      complete: true,
      accuracy: 50,
      responses: {
        "quiz-q1": { selected: "さようなら", correct: false },
        "quiz-q2": { selected: "さようなら", correct: true },
      },
    },
    "custom-q-1": {
      complete: true,
      accuracy: 40,
      userAnswer: "Hello is used.",
      feedback: "Too brief — needs more detail and examples.",
    },
  }),
  feedback: JSON.stringify({
    overall: "Needs more practice distinguishing greetings from farewells.",
    blockFeedback: { "quiz-block-1": "Mixed up hello and goodbye" },
  }),
  moderationStatus: null,
  moderationCheckedAt: null,
  createdAt: "2024-02-11T09:00:00Z",
  updatedAt: "2024-02-11T09:20:00Z",
  _version: 1,
  _lastChangedAt: Date.parse("2024-02-11T09:20:00Z"),
};

const STUDENT_NAMES: Record<string, string> = {
  [GRADE_AIKO.id]: "Aiko Tanaka",
  [GRADE_KENJI.id]: "Kenji Sato",
};

/** Controlled harness so prev/next navigation (onNavigate) updates the open grade. */
function GradeReviewDrawerHarness({
  gradeIds,
  initialIndex = 0,
}: {
  gradeIds: string[];
  initialIndex?: number;
}) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const gradeId = gradeIds[currentIndex] ?? null;

  return (
    <GradeReviewDrawer
      open
      onClose={() => {}}
      gradeId={gradeId}
      unitId={UNIT_ID}
      studentName={gradeId ? STUDENT_NAMES[gradeId] || "Student" : "Student"}
      gradeIds={gradeIds}
      currentIndex={currentIndex}
      onNavigate={setCurrentIndex}
    />
  );
}

const meta: Meta<typeof GradeReviewDrawer> = {
  title: "📊 Instructor Tools/Grade Review Drawer",
  component: GradeReviewDrawer,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Drawer opened from the section gradebook to review a student's filled-in workbook in read-only mode, with attempt history, moderation, and grade override.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof GradeReviewDrawer>;

export const SingleAttempt: Story = {
  loaders: [
    async () => {
      clearMockData();
      seedUnit();
      seedMockGrade(GRADE_AIKO);
    },
  ],
  render: () => <GradeReviewDrawerHarness gradeIds={[GRADE_AIKO.id]} />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() =>
      expect(body.getAllByText(/Aiko Tanaka/i).length).toBeGreaterThan(0),
    );
    await body.findByText(/Japanese Greetings - Unit 1/i);
  },
};

export const MultipleAttempts: Story = {
  loaders: [
    async () => {
      clearMockData();
      seedUnit();
      seedMockGrade(GRADE_AIKO_ATTEMPT_1);
      seedMockGrade(GRADE_AIKO);
    },
  ],
  render: () => <GradeReviewDrawerHarness gradeIds={[GRADE_AIKO.id]} />,
  parameters: {
    docs: {
      description: {
        story:
          "Aiko's two submissions for the same unit — the drawer groups them by owner + unit and shows attempt tabs.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() =>
      expect(body.getAllByText(/Aiko Tanaka/i).length).toBeGreaterThan(0),
    );
  },
};

export const MultipleStudents: Story = {
  loaders: [
    async () => {
      clearMockData();
      seedUnit();
      seedMockGrade(GRADE_AIKO);
      seedMockGrade(GRADE_KENJI);
    },
  ],
  render: () => (
    <GradeReviewDrawerHarness gradeIds={[GRADE_AIKO.id, GRADE_KENJI.id]} />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Two students graded on the same unit — use the prev/next arrows (or ← / → keys) to step between them.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() =>
      expect(body.getAllByText(/Aiko Tanaka/i).length).toBeGreaterThan(0),
    );
    expect(body.getByText(/\(1\/2\)/)).toBeTruthy();
  },
};
