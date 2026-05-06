/**
 * Quick Tour - Instructor Workflow
 * Animated screenshot walkthrough showing how instructors create and assign content.
 */
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, Container, Alert } from '@mui/material';
import { AnimatedDemo, DemoStep } from '../components/AnimatedDemo';

const meta: Meta = {
  title: '🏠 Getting Started/Quick Tour/Instructor Workflow',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { disable: true },
  },
};
export default meta;
type Story = StoryObj;

/**
 * Steps showing the instructor content creation flow.
 * Screenshots should be placed in public/docs/tour/ and referenced here.
 * Replace placeholder paths with actual Playwright/Chromatic captures.
 */
const instructorSteps: DemoStep[] = [
  {
    screenshot: '/docs/tour/instructor-01-dashboard.png',
    cursorTarget: [15, 35],
    click: true,
    caption: 'Step 1: From the dashboard, click "Create Unit" to start a new lesson',
    annotation: 'Create Unit',
    annotationOffset: [-50, -45],
    duration: 3000,
  },
  {
    screenshot: '/docs/tour/instructor-02-editor.png',
    cursorTarget: [50, 30],
    click: true,
    caption: 'Step 2: The rich editor opens — add text, headings, and media blocks',
    annotation: 'Lexical Editor',
    annotationOffset: [-50, -45],
    duration: 3000,
  },
  {
    screenshot: '/docs/tour/instructor-03-quiz-block.png',
    cursorTarget: [50, 60],
    click: true,
    caption: 'Step 3: Insert a Quiz block — students will answer these for a grade',
    annotation: 'Quiz Block',
    annotationOffset: [-40, -45],
    duration: 3000,
  },
  {
    screenshot: '/docs/tour/instructor-04-ai-chat.png',
    cursorTarget: [85, 40],
    click: true,
    caption: 'Step 4: Open AI Chat to generate additional questions and content',
    annotation: 'AI Assistant',
    annotationOffset: [-50, -45],
    duration: 3000,
  },
  {
    screenshot: '/docs/tour/instructor-05-assign.png',
    cursorTarget: [50, 50],
    click: true,
    caption: 'Step 5: Assign the unit to a Section with a due date',
    annotation: 'Create Assignment',
    annotationOffset: [-60, -45],
    duration: 3000,
  },
  {
    screenshot: '/docs/tour/instructor-06-grades.png',
    cursorTarget: [50, 45],
    caption: 'Step 6: Monitor student progress and grades in real-time',
    duration: 3000,
  },
];

export const InstructorWorkflow: Story = {
  render: () => (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6 }}>
      <Container maxWidth="md">
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
          Instructor Workflow
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
          Create a lesson and assign it to students in 6 steps
        </Typography>

        <Alert severity="info" sx={{ mb: 4 }}>
          This demo uses screenshots from the live application. The animated cursor shows where
          you would click to perform each action.
        </Alert>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <AnimatedDemo
            steps={instructorSteps}
            width="100%"
            autoPlay={true}
            loop={true}
            speed={1}
          />
        </Box>

        {/* Summary after demo */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Key Takeaways
          </Typography>
          <Box component="ul" sx={{ pl: 3, '& li': { mb: 1 } }}>
            <li><Typography>Units are the core content container — think of them as interactive documents</Typography></li>
            <li><Typography>The editor supports multiple graded block types (Quiz, Answer, Meaning Association, Custom Answer)</Typography></li>
            <li><Typography>AI can generate content, questions, and vocabulary from a simple prompt</Typography></li>
            <li><Typography>Sections are classes — assign units to them with optional due dates</Typography></li>
            <li><Typography>Grades update in real-time as students complete work</Typography></li>
          </Box>
        </Box>
      </Container>
    </Box>
  ),
};
