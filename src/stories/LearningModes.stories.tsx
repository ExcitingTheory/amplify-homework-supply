/**
 * Example stories demonstrating Tutorial Mode and Quiz Mode
 */

import React from "react";
import { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button, TextField, Box } from "@mui/material";
import TutorialStep from "../../.storybook/components/TutorialStep";
import QuizMode from "../../.storybook/components/QuizMode";

const meta: Meta = {
  title: "🏠 Getting Started/Onboarding/Learning Modes",
  parameters: {
    docs: {
      description: {
        component: `
Two onboarding modes to help users learn the platform:

## Tutorial Mode 
Interactive demos embedded in the documentation with step-by-step guidance.

## Quiz Mode
Hands-on practice in embedded pages with action tracking and completion criteria.
        `.trim(),
      },
    },
  },
};

export default meta;

/**
 * Tutorial Mode Example
 * Shows a step with interactive demo component
 */
export const TutorialModeExample: StoryObj = {
  render: () => {
    const [value, setValue] = React.useState("");
    const [submitted, setSubmitted] = React.useState(false);

    const DemoComponent = (
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          label="Enter a demo item title"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={() => setSubmitted(true)}
          disabled={!value}
        >
          Create Demo Item
        </Button>
        {submitted && (
          <Box sx={{ mt: 2, p: 2, bgcolor: "success.light", borderRadius: 1 }}>
            ✅ Demo item &quot;{value}&quot; created! Great job!
          </Box>
        )}
      </Box>
    );

    return (
      <Box sx={{ p: "20px", maxWidth: "800px", mx: "auto" }}>
        <Box
          sx={{
            mb: 3,
            p: 2,
            bgcolor: "info.light",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <span style={{ fontSize: "24px" }}>📖</span>
          <Box
            component="span"
            sx={{ fontWeight: "bold", color: "text.primary" }}
          >
            Tutorial Mode
          </Box>
          <Box component="span" sx={{ color: "text.secondary" }}>
            — Learn step-by-step with interactive guidance
          </Box>
        </Box>

        <Box component="h2" sx={{ color: "text.primary" }}>
          Create Your First Demo Item
        </Box>
        <Box component="p" sx={{ color: "text.secondary" }}>
          This fictional example shows how tutorial mode can walk someone
          through a simple action without relying on any real app workflow.
        </Box>

        <TutorialStep
          stepId="secret-documentation-explorer"
          title="Create a Demo Item"
          description="Practice completing a demo-only action with the interactive block below"
          demoComponent={DemoComponent}
          quizStoryId="🏠-getting-started-onboarding-task-completion-examples--auto-detect-task-completion"
          completionMode="manual"
        />

        <Box component="hr" sx={{ my: 5, borderColor: "divider" }} />

        <Box component="h2" sx={{ color: "text.primary" }}>
          Next Steps
        </Box>
        <Box component="p" sx={{ color: "text.secondary" }}>
          After completing the tutorial, try it yourself in quiz mode by
          clicking the &quot;Try it Yourself →&quot; button above.
        </Box>
      </Box>
    );
  },
};

/**
 * Quiz Mode Example
 * Shows quiz-mode behavior in a demo-only flow
 */
export const QuizModeExample: StoryObj = {
  render: () => {
    const [completed, setCompleted] = React.useState(false);

    return (
      <Box sx={{ p: "20px", maxWidth: "800px", mx: "auto" }}>
        <Box
          sx={{
            mb: 3,
            p: 2,
            bgcolor: "warning.light",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <span style={{ fontSize: "24px" }}>🎯</span>
          <Box
            component="span"
            sx={{ fontWeight: "bold", color: "text.primary" }}
          >
            Quiz Mode
          </Box>
          <Box component="span" sx={{ color: "text.secondary" }}>
            — Practice hands-on with minimal guidance
          </Box>
        </Box>

        <Box component="h2" sx={{ color: "text.primary" }}>
          Try the Demo Flow
        </Box>
        <Box component="p" sx={{ color: "text.secondary" }}>
          Practice the same demo action with minimal guidance. This is
          intentionally fictional and only demonstrates onboarding behavior.
        </Box>

        {!completed ? (
          <Box
            sx={{
              mt: 3,
              p: 3,
              border: "2px dashed",
              borderColor: "divider",
              borderRadius: 2,
              textAlign: "center",
            }}
          >
            <Box component="h3" sx={{ color: "text.primary" }}>
              Complete Demo Task
            </Box>
            <Box component="p" sx={{ color: "text.secondary" }}>
              Open the demo completion story and trigger completion.
            </Box>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2, mr: 2 }}
              onClick={() => {
                window.parent.location.href =
                  "?path=/story/🏠-getting-started-onboarding-task-completion-examples--auto-detect-task-completion";
              }}
            >
              Start Task
            </Button>
            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => setCompleted(true)}
            >
              Mark as Complete
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              mt: 3,
              p: 3,
              bgcolor: "success.light",
              borderRadius: 2,
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "48px" }}>✅</span>
            <Box component="h3" sx={{ color: "text.primary" }}>
              Task Completed!
            </Box>
            <Box component="p" sx={{ color: "text.secondary" }}>
              Great job! You&apos;ve successfully completed the quiz task.
            </Box>
          </Box>
        )}
      </Box>
    );
  },
  parameters: {
    layout: "fullscreen",
  },
};

/**
 * Multiple Tutorial Steps
 * Shows how to chain multiple steps together
 */
export const MultipleTutorialSteps: StoryObj = {
  render: () => {
    return (
      <Box sx={{ p: "20px", maxWidth: "800px", mx: "auto" }}>
        <Box component="h1" sx={{ color: "text.primary" }}>
          Complete Demo Onboarding Workflow
        </Box>
        <Box component="p" sx={{ color: "text.secondary" }}>
          Follow these fictional steps to see how multi-step onboarding behaves:
        </Box>

        <TutorialStep
          stepId="secret-documentation-explorer"
          title="1. Explore Docs"
          description="Open a docs page and review how onboarding hints appear"
          quizStoryId="🏠-getting-started-onboarding-task-completion-examples--display-onboarding-status"
        />

        <TutorialStep
          stepId="secret-shortcut-evangelist"
          title="2. Trigger an Interaction"
          description="Perform a tracked interaction to simulate in-flow progress"
          quizStoryId="🏠-getting-started-onboarding-task-completion-examples--event-emission-example"
        />

        <TutorialStep
          stepId="secret-keyboard-master"
          title="3. Finish the Challenge"
          description="Complete a final demo challenge to close out the flow"
          quizStoryId="🏠-getting-started-keyboard-shortcuts--default"
        />

        <Box sx={{ mt: 5, p: "20px", bgcolor: "info.light", borderRadius: 2 }}>
          <Box component="h3" sx={{ color: "text.primary", mt: 0 }}>
            🎉 Ready to Practice?
          </Box>
          <Box component="p" sx={{ color: "text.secondary", mb: 0 }}>
            Click the &quot;Try it Yourself →&quot; button on any step above to
            practice in quiz mode. Your progress will be tracked automatically!
          </Box>
        </Box>
      </Box>
    );
  },
};

/**
 * Tutorial Auto-completion
 * Step that completes automatically when rendered
 */
export const AutoCompleteTutorial: StoryObj = {
  render: () => {
    return (
      <Box sx={{ p: "20px", maxWidth: "800px", mx: "auto" }}>
        <Box component="h2" sx={{ color: "text.primary" }}>
          Auto-Completion Demo
        </Box>
        <Box component="p" sx={{ color: "text.secondary" }}>
          Some steps complete automatically by visiting a story. This page
          demonstrates that behavior using a bonus demo task.
        </Box>

        <TutorialStep
          stepId="secret-documentation-explorer"
          title="Explore Demo Documentation"
          description="Browse this onboarding section and observe auto completion"
          completionMode="auto"
        />

        <Box component="p" sx={{ mt: "20px", color: "text.secondary" }}>
          Check the Onboarding panel - this task should already be marked
          complete!
        </Box>
      </Box>
    );
  },
};
