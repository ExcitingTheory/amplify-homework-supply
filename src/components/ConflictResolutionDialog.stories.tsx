import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ConflictResolutionDialog, {
  GradeConflictDetails,
} from "./ConflictResolutionDialog";
import { Button } from "@mui/material";

const meta: Meta<typeof ConflictResolutionDialog> = {
  title: "Components/Offline & Sync/ConflictResolutionDialog",
  component: ConflictResolutionDialog,
  parameters: {
    // Pure presentational component — skip the app context/subscription stack.
    minimalProviders: true,
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof ConflictResolutionDialog>;

const sampleConflict: GradeConflictDetails = {
  gradeId: "grade-84920482-1234",
  localVersion: 2,
  serverVersion: 3,
  localData: {
    "quiz-1": {
      prompt: "What is the capital of France?",
      userAnswer: "Paris (offline response)",
      accuracy: 100,
      complete: true,
      gradedOffline: true,
    },
    "essay-2": {
      prompt: "Explain photosynthesis in 2 sentences.",
      userAnswer:
        "Plants use sunlight to convert CO2 and water into glucose and oxygen.",
      accuracy: 95,
      complete: true,
      gradedOffline: true,
    },
  },
  serverData: {
    "quiz-1": {
      prompt: "What is the capital of France?",
      userAnswer: "Paris",
      accuracy: 100,
      complete: true,
    },
    "essay-2": {
      prompt: "Explain photosynthesis in 2 sentences.",
      userAnswer: "Plants convert light to energy.",
      accuracy: 70,
      complete: true,
    },
  },
  requiresInstructorReview: true,
};

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Open Conflict Dialog
        </Button>
        <ConflictResolutionDialog
          open={open}
          conflict={sampleConflict}
          onClose={() => setOpen(false)}
          onResolve={async (res) => {
            console.log("Resolved with:", res);
            setOpen(false);
          }}
        />
      </>
    );
  },
};

export const MinorConflict: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const minorConflict: GradeConflictDetails = {
      ...sampleConflict,
      requiresInstructorReview: false,
      serverData: {
        ...sampleConflict.serverData,
        "essay-2": {
          prompt: "Explain photosynthesis in 2 sentences.",
          userAnswer: "Plants use sunlight to make food.",
          accuracy: 90,
          complete: true,
        },
      },
    };

    return (
      <>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Open Minor Conflict Dialog
        </Button>
        <ConflictResolutionDialog
          open={open}
          conflict={minorConflict}
          onClose={() => setOpen(false)}
          onResolve={async (res) => {
            console.log("Resolved minor conflict with:", res);
            setOpen(false);
          }}
        />
      </>
    );
  },
};
