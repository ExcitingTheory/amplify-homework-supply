import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button, Box, Typography, Card, CardContent, Stack } from '@mui/material';
import SpotlightOverlay, { SpotlightStep } from './SpotlightOverlay';

const meta: Meta<typeof SpotlightOverlay> = {
  title: '🏠 Getting Started/Onboarding/Spotlight Overlay',
  component: SpotlightOverlay,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Spotlight Overlay Component

A guided tour overlay that highlights specific UI elements with a spotlight effect.

## Features

- **Semi-transparent Overlay**: Dims non-focused areas (40-60% opacity)
- **Spotlight Effect**: Transparent "hole" highlights the target element
- **Tooltip/Coachmark**: Contextual instructions near the highlighted area
- **Navigation**: Next, Skip, and Complete buttons for user control
- **Two Modes**:
  - **Tutorial Mode**: Shows detailed step-by-step instructions
  - **Quiz Mode**: Minimal guidance, testing user knowledge
- **Responsive**: Automatically adjusts to window resize and scroll
- **Flexible Targeting**: Supports CSS selectors or manual positioning

## Usage

\`\`\`tsx
import { SpotlightOverlay, SpotlightStep } from './SpotlightOverlay';

const steps: SpotlightStep[] = [
  {
    id: 'step-1',
    targetSelector: '#create-button',
    title: 'Create Your First Item',
    description: 'Click this button to get started',
    tooltipPosition: 'right',
    actions: ['Click the "Create" button', 'Fill in the form'],
  },
];

<SpotlightOverlay
  steps={steps}
  currentStepIndex={0}
  isOpen={true}
  mode="tutorial"
  onNext={() => console.log('Next')}
  onComplete={() => console.log('Done')}
  onClose={() => console.log('Close')}
/>
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SpotlightOverlay>;

/**
 * Demo UI Component for examples
 */
const DemoUI: React.FC<{ onStart: () => void; buttonText?: string }> = ({ onStart, buttonText = 'Start Tutorial' }) => (
  <Box sx={{ p: 4, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Welcome to the Tutorial
          </Typography>
          <Typography variant="body1" paragraph>
            Click the button below to start the interactive guided tour.
          </Typography>
          <Button 
            id="start-tour-button"
            variant="contained" 
            color="primary" 
            onClick={onStart}
          >
            {buttonText}
          </Button>
        </CardContent>
      </Card>

      <Card id="feature-card-1">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Feature 1: Create Content
          </Typography>
          <Typography variant="body2" paragraph>
            Use this section to create new content for your application.
          </Typography>
          <Button id="create-button" variant="outlined">
            Create New
          </Button>
        </CardContent>
      </Card>

      <Card id="feature-card-2">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Feature 2: Manage Settings
          </Typography>
          <Typography variant="body2" paragraph>
            Configure your preferences and application settings here.
          </Typography>
          <Button id="settings-button" variant="outlined">
            Open Settings
          </Button>
        </CardContent>
      </Card>

      <Card id="feature-card-3">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Feature 3: View Analytics
          </Typography>
          <Typography variant="body2" paragraph>
            Monitor your progress and view detailed analytics.
          </Typography>
          <Button id="analytics-button" variant="outlined">
            View Analytics
          </Button>
        </CardContent>
      </Card>
    </Stack>
  </Box>
);

/**
 * Tutorial Mode - Full guided tour with detailed instructions
 */
export const TutorialMode: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const steps: SpotlightStep[] = [
      {
        id: 'welcome',
        title: 'Welcome to the Tutorial',
        description: 'Let\'s walk through the key features of this application together.',
        tooltipPosition: 'center',
        actions: [
          'Follow along with each step',
          'Complete the actions as instructed',
          'Click "Next" to continue',
        ],
      },
      {
        id: 'create-content',
        targetSelector: '#create-button',
        title: 'Create New Content',
        description: 'This button allows you to create new content. Try clicking it now.',
        tooltipPosition: 'right',
        actions: [
          'Look at the highlighted "Create New" button',
          'Click it to open the creation dialog',
          'Fill in your content details',
        ],
      },
      {
        id: 'settings',
        targetSelector: '#settings-button',
        title: 'Configure Settings',
        description: 'Manage your application preferences from the settings panel.',
        tooltipPosition: 'right',
        actions: [
          'Click "Open Settings"',
          'Review the available options',
          'Make your preferred changes',
        ],
      },
      {
        id: 'analytics',
        targetSelector: '#analytics-button',
        title: 'View Your Analytics',
        description: 'Monitor your progress and performance metrics here.',
        tooltipPosition: 'right',
        actions: [
          'Click "View Analytics"',
          'Explore the charts and data',
          'Track your improvement over time',
        ],
        isLast: true,
      },
    ];

    return (
      <>
        <DemoUI onStart={() => setIsOpen(true)} />
        <SpotlightOverlay
          steps={steps}
          currentStepIndex={currentStep}
          isOpen={isOpen}
          mode="tutorial"
          onNext={() => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))}
          onSkip={() => setIsOpen(false)}
          onComplete={() => {
            alert('Tutorial completed! 🎉');
            setIsOpen(false);
            setCurrentStep(0);
          }}
          onClose={() => {
            setIsOpen(false);
            setCurrentStep(0);
          }}
        />
      </>
    );
  },
};

/**
 * Quiz Mode - Minimal guidance for testing knowledge
 */
export const QuizMode: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const steps: SpotlightStep[] = [
      {
        id: 'task-1',
        targetSelector: '#create-button',
        title: 'Create Your First Item',
        description: 'Try creating a new item without looking at the instructions.',
        tooltipPosition: 'right',
      },
      {
        id: 'task-2',
        targetSelector: '#settings-button',
        title: 'Open Settings',
        description: 'Can you find and open the settings panel?',
        tooltipPosition: 'right',
      },
      {
        id: 'task-3',
        targetSelector: '#analytics-button',
        title: 'Check Your Analytics',
        description: 'View your analytics dashboard.',
        tooltipPosition: 'right',
        isLast: true,
      },
    ];

    return (
      <>
        <DemoUI onStart={() => setIsOpen(true)} buttonText="Start Quiz" />
        <SpotlightOverlay
          steps={steps}
          currentStepIndex={currentStep}
          isOpen={isOpen}
          mode="quiz"
          onNext={() => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))}
          onSkip={() => setIsOpen(false)}
          onComplete={() => {
            alert('Quiz completed! 🎯');
            setIsOpen(false);
            setCurrentStep(0);
          }}
          onClose={() => {
            setIsOpen(false);
            setCurrentStep(0);
          }}
        />
      </>
    );
  },
};

/**
 * Single Step - Simplest use case
 */
export const SingleStep: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    const steps: SpotlightStep[] = [
      {
        id: 'single',
        targetSelector: '#start-tour-button',
        title: 'Click Here to Begin',
        description: 'This button will start your interactive tutorial.',
        tooltipPosition: 'bottom',
        actions: ['Click the "Start Tutorial" button'],
        isLast: true,
      },
    ];

    return (
      <>
        <DemoUI onStart={() => alert('Tutorial started!')} />
        <SpotlightOverlay
          steps={steps}
          currentStepIndex={0}
          isOpen={isOpen}
          mode="tutorial"
          onComplete={() => setIsOpen(false)}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
  },
};

/**
 * No Target Element - Center screen positioning
 */
export const NoTargetElement: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    const steps: SpotlightStep[] = [
      {
        id: 'intro',
        title: 'Getting Started',
        description: 'This is a centered message with no specific target element.',
        tooltipPosition: 'center',
        actions: [
          'Read these instructions',
          'Understand the basics',
          'Click Next to continue',
        ],
        isLast: true,
      },
    ];

    return (
      <>
        <DemoUI onStart={() => {}} />
        <SpotlightOverlay
          steps={steps}
          currentStepIndex={0}
          isOpen={isOpen}
          mode="tutorial"
          onComplete={() => setIsOpen(false)}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
  },
};

/**
 * Manual Positioning - Using absolute coordinates
 */
export const ManualPositioning: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    const steps: SpotlightStep[] = [
      {
        id: 'manual',
        targetPosition: {
          top: 200,
          left: 300,
          width: 200,
          height: 100,
        },
        title: 'Custom Position',
        description: 'This spotlight uses manual positioning instead of a selector.',
        tooltipPosition: 'right',
        isLast: true,
      },
    ];

    return (
      <>
        <DemoUI onStart={() => {}} />
        <SpotlightOverlay
          steps={steps}
          currentStepIndex={0}
          isOpen={isOpen}
          mode="tutorial"
          onComplete={() => setIsOpen(false)}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
  },
};
