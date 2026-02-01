/**
 * Example stories demonstrating Tutorial Mode and Quiz Mode
 */

import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Button, TextField, Box } from '@mui/material';
import TutorialStep from '../../.storybook/components/TutorialStep';
import QuizMode from '../../.storybook/components/QuizMode';

const meta: Meta = {
  title: 'Onboarding/Learning Modes',
  tags: ['autodocs'],
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
          label="Enter a unit title"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={() => setSubmitted(true)}
          disabled={!value}
        >
          Create Unit
        </Button>
        {submitted && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
            ✅ Unit "{value}" created!
          </Box>
        )}
      </Box>
    );

    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h2>Creating Your First Unit</h2>
        <p>
          Units are the building blocks of your lessons. Follow the tutorial below to learn
          how to create one.
        </p>

        <TutorialStep
          stepId="instructor-create-unit"
          title="Create a Unit"
          description="Practice creating a unit with the interactive demo below"
          demoComponent={DemoComponent}
          quizStoryId="pages-units--default"
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
 * Directs users to Application Pages to practice with the real app
 */
export const QuizModeExample: StoryObj = {
  render: () => {
    return (
      <QuizMode
        taskId="instructor-create-unit"
        requiredActions={['onClick:create-unit']}
      />
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
        <h1>Complete Onboarding Workflow</h1>
        <p>Follow these steps to set up your first class:</p>

        <TutorialStep
          stepId="instructor-setup-class"
          title="1. Create a Section"
          description="Set up a class section for your students"
          quizStoryId="pages-application-pages--sections"
        />

        <TutorialStep
          stepId="instructor-create-unit"
          title="2. Create a Unit"
          description="Build your first learning module"
          quizStoryId="pages-units--default"
        />

        <TutorialStep
          stepId="instructor-create-assignment"
          title="3. Create an Assignment"
          description="Assign the unit to your section with a due date"
          quizStoryId="pages-application-pages--section-detail"
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
        <h2>Reading Documentation</h2>
        <p>
          Some steps complete automatically just by viewing them. This step will mark itself
          as complete when you land on this page.
        </p>

        <TutorialStep
          stepId="developer-explore-components"
          title="Explore Component Documentation"
          description="Browse the Storybook sidebar and understand the component library"
          completionMode="auto"
        />

        <p style={{ marginTop: '20px', color: '#666' }}>
          Check the Onboarding panel - this task should already be marked complete!
        </p>
      </div>
    );
  },
};
