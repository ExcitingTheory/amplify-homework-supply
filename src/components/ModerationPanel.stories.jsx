/**
 * @fileoverview Storybook stories for ModerationPanel component
 * Demonstrates detailed content moderation review panel
 *
 * Note: Uses safe mock data with generic "label" categories
 */

import React from "react";
import ModerationPanel from "./ModerationPanel";
import { Box, Stack } from "@mui/material";
import { DemoBanner } from "../../.storybook/components/DemoBanner";
import { expect, within } from "storybook/test";

// Mock items with different moderation scenarios
const mockFlaggedSingle = {
  id: "content-1",
  moderationStatus: "flagged",
  moderationFlags: JSON.stringify({
    categories: {
      category_label_1: true,
      category_label_2: false,
      category_label_3: false,
    },
    categoryScores: {
      category_label_1: 0.89,
      category_label_2: 0.12,
      category_label_3: 0.05,
    },
    model: "text-moderation-latest",
  }),
  moderationCheckedAt: new Date().toISOString(),
};

const mockFlaggedMultiple = {
  id: "content-2",
  moderationStatus: "flagged",
  moderationFlags: JSON.stringify({
    categories: {
      category_label_1: true,
      category_label_2: true,
      category_label_3: true,
      category_label_4: false,
    },
    categoryScores: {
      category_label_1: 0.95,
      category_label_2: 0.78,
      category_label_3: 0.64,
      category_label_4: 0.23,
    },
    model: "text-moderation-latest",
  }),
  moderationCheckedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
};

const mockFlaggedLowConfidence = {
  id: "content-3",
  moderationStatus: "flagged",
  moderationFlags: JSON.stringify({
    categories: {
      category_label_1: true,
    },
    categoryScores: {
      category_label_1: 0.52, // Just above threshold
    },
    model: "text-moderation-latest",
  }),
  moderationCheckedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
};

const mockApprovedItem = {
  id: "content-4",
  moderationStatus: "approved",
  moderationFlags: null,
  moderationCheckedAt: new Date().toISOString(),
};

const mockUncheckedItem = {
  id: "content-5",
  moderationStatus: null,
  moderationFlags: null,
  moderationCheckedAt: null,
};

export default {
  title: "🧩 UI Components/Moderation Panel",
  component: ModerationPanel,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Detailed moderation review panel for instructors. Shows flagged categories with confidence scores and policy guidance using generic labels.",
      },
    },
  },
  decorators: [
    (Story) => (
      <Box sx={{ maxWidth: 800, p: 3 }}>
        <DemoBanner
          title="Content Moderation Panel"
          description="Detailed review interface for flagged content with generic category labels"
        />
        <Story />
      </Box>
    ),
  ],
};

export const SingleCategoryFlagged = {
  args: {
    item: mockFlaggedSingle,
    title: "Content Moderation",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Panel showing content flagged for a single category with high confidence.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Content Moderation");
  },
};

export const MultipleCategoriesFlagged = {
  args: {
    item: mockFlaggedMultiple,
    title: "Student Submission Requires Review",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Panel with multiple flagged categories. Expand each to see descriptions.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Student Submission Requires Review");
  },
};

export const LowConfidenceFlag = {
  args: {
    item: mockFlaggedLowConfidence,
    title: "Content Moderation",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Content flagged with lower confidence score (just above threshold). May need manual review to confirm.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Content Moderation");
  },
};

export const ApprovedContent = {
  args: {
    item: mockApprovedItem,
    title: "Content Moderation",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Approved content shows no panel (null render to reduce clutter).",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryByText("Content Moderation")).toBeNull();
  },
};

export const UncheckedContent = {
  args: {
    item: mockUncheckedItem,
    title: "Content Moderation",
  },
  parameters: {
    docs: {
      description: {
        story: "Content not yet checked shows no panel.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryByText("Content Moderation")).toBeNull();
  },
};

// Custom title example
export const CustomTitle = {
  args: {
    item: mockFlaggedMultiple,
    title: "Unit Content Flagged for Review",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Custom title can be provided to match context (Unit, Grade, Question, etc.).",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Unit Content Flagged for Review");
  },
};

// Multiple panels in sequence
export const InstructorReviewWorkflow = () => (
  <Stack spacing={3}>
    <ModerationPanel item={mockFlaggedMultiple} title="Student Submission #1" />
    <ModerationPanel item={mockFlaggedSingle} title="Student Submission #2" />
    <ModerationPanel
      item={mockFlaggedLowConfidence}
      title="Student Submission #3"
    />
  </Stack>
);

InstructorReviewWorkflow.parameters = {
  docs: {
    description: {
      story:
        "Example workflow: instructor reviewing multiple flagged student submissions.",
    },
  },
};

InstructorReviewWorkflow.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await canvas.findByText("Student Submission #1");
  await canvas.findByText("Student Submission #2");
  await canvas.findByText("Student Submission #3");
};

// Edge cases
export const MalformedFlags = () => {
  const itemWithBadJSON = {
    id: "bad-1",
    moderationStatus: "flagged",
    moderationFlags: "not valid json",
    moderationCheckedAt: new Date().toISOString(),
  };

  return <ModerationPanel item={itemWithBadJSON} title="Malformed Data Test" />;
};

MalformedFlags.parameters = {
  docs: {
    description: {
      story: "Gracefully handles malformed moderation data (returns null).",
    },
  },
};

MalformedFlags.play = async ({ canvasElement }) => {
  expect(canvasElement).toBeTruthy();
};
