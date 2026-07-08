/**
 * Example stories demonstrating Tutorial Mode and Quiz Mode
 */

import React from 'react';
import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button, TextField, Box } from '@mui/material';
import TutorialStep from '../../.storybook/components/TutorialStep';
import QuizMode from '../../.storybook/components/QuizMode';

const meta: Meta = {
  title: '🏠 Getting Started/Onboarding/Learning Modes',
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
    const [value, setValue] = React.useState('');
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
          <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
            ✅ Demo item "{value}" created! Great job!
          </Box>
        )}
      </Box>
    );

    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <Box sx={{ mb: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: '24px' }}>📖</span>
          <span style={{ fontWeight: 'bold' }}>Tutorial Mode</span>
          <span style={{ color: '#666' }}>— Learn step-by-step with interactive guidance</span>
        </Box>

        <h2>Create Your First Demo Item</h2>
        <p>
          This fictional example shows how tutorial mode can walk someone through
          a simple action without relying on any real app workflow.
        </p>

        <TutorialStep
          stepId="secret-documentation-explorer"
          title="Create a Demo Item"
          description="Practice completing a demo-only action with the interactive block below"
          demoComponent={DemoComponent}
          quizStoryId="🏠-getting-started-onboarding-task-completion-examples--auto-detect-task-completion"
          completionMode="manual"
        />

        <hr style={{ margin: '40px 0' }} />

        <h2>Next Steps</h2>
        <p>
          After completing the tutorial, try it yourself in quiz mode by clicking
          the "Try it Yourself →" button above.
        </p>
      </div>
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
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <Box sx={{ mb: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: '24px' }}>🎯</span>
          <span style={{ fontWeight: 'bold' }}>Quiz Mode</span>
          <span style={{ color: '#666' }}>— Practice hands-on with minimal guidance</span>
        </Box>

        <h2>Try the Demo Flow</h2>
        <p>
          Practice the same demo action with minimal guidance.
          This is intentionally fictional and only demonstrates onboarding behavior.
        </p>

        {!completed ? (
          <Box sx={{ mt: 3, p: 3, border: '2px dashed #ccc', borderRadius: 2, textAlign: 'center' }}>
            <h3>Complete Demo Task</h3>
            <p style={{ color: '#666' }}>Open the demo completion story and trigger completion.</p>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2, mr: 2 }}
              onClick={() => {
                // Simulate navigation
                window.parent.location.href = '?path=/story/🏠-getting-started-onboarding-task-completion-examples--auto-detect-task-completion';
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
          <Box sx={{ mt: 3, p: 3, bgcolor: '#e8f5e9', borderRadius: 2, textAlign: 'center' }}>
            <span style={{ fontSize: '48px' }}>✅</span>
            <h3>Task Completed!</h3>
            <p>Great job! You've successfully completed the quiz task.</p>
          </Box>
        )}
      </div>
    );
  },
  parameters: {
    layout: 'fullscreen',
  },
};

/**
 * Multiple Tutorial Steps
 * Shows how to chain multiple steps together
 */
export const MultipleTutorialSteps: StoryObj = {
  render: () => {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Complete Demo Onboarding Workflow</h1>
        <p>Follow these fictional steps to see how multi-step onboarding behaves:</p>

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

        <div style={{ marginTop: '40px', padding: '20px', background: '#e3f2fd', borderRadius: '8px' }}>
          <h3>🎉 Ready to Practice?</h3>
          <p>
            Click the "Try it Yourself →" button on any step above to practice in quiz mode.
            Your progress will be tracked automatically!
          </p>
        </div>
      </div>
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
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h2>Auto-Completion Demo</h2>
        <p>
          Some steps complete automatically by visiting a story.
          This page demonstrates that behavior using a bonus demo task.
        </p>

        <TutorialStep
          stepId="secret-documentation-explorer"
          title="Explore Demo Documentation"
          description="Browse this onboarding section and observe auto completion"
          completionMode="auto"
        />

        <p style={{ marginTop: '20px', color: '#666' }}>
          Check the Onboarding panel - this task should already be marked complete!
        </p>
      </div>
    );
  },
};
