/**
 * Quick Tour - Student Workflow
 * Animated screenshot walkthrough showing how students complete assignments.
 */
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, Container, Alert } from '@mui/material';
import { AnimatedDemo, DemoStep } from '../components/AnimatedDemo';

const meta: Meta = {
  title: '🏠 Getting Started/Quick Tour/Student Workflow',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { disable: true },
  },
};
export default meta;
type Story = StoryObj;

const studentSteps: DemoStep[] = [
  {
    screenshot: '/docs/tour/student-01-join.png',
    cursorTarget: [50, 50],
    click: true,
    caption: 'Step 1: Join a class using the instructor\'s join code',
    annotation: 'Enter Join Code',
    annotationOffset: [-55, -45],
    duration: 3000,
  },
  {
    screenshot: '/docs/tour/student-02-assignments.png',
    cursorTarget: [40, 40],
    click: true,
    caption: 'Step 2: View your assigned work with due dates and status',
    annotation: 'Open Assignment',
    annotationOffset: [-55, -45],
    duration: 3000,
  },
  {
    screenshot: '/docs/tour/student-03-workbook.png',
    cursorTarget: [50, 55],
    click: true,
    caption: 'Step 3: Work through the lesson — read content and answer graded blocks',
    annotation: 'Answer Question',
    annotationOffset: [-55, -45],
    duration: 3000,
  },
  {
    screenshot: '/docs/tour/student-04-feedback.png',
    cursorTarget: [50, 40],
    caption: 'Step 4: Get immediate feedback on each answer with accuracy scores',
    annotation: 'AI Feedback',
    annotationOffset: [-45, -45],
    duration: 3000,
  },
  {
    screenshot: '/docs/tour/student-05-submit.png',
    cursorTarget: [70, 85],
    click: true,
    caption: 'Step 5: Submit completed work — your grade is calculated automatically',
    annotation: 'Submit',
    annotationOffset: [-30, -45],
    duration: 3000,
  },
  {
    screenshot: '/docs/tour/student-06-xp.png',
    cursorTarget: [50, 30],
    caption: 'Step 6: Earn XP, badges, and track your streak!',
    duration: 3000,
  },
];

export const StudentWorkflow: Story = {
  render: () => (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6 }}>
      <Container maxWidth="md">
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
          Student Workflow
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
          Join a class and complete an assignment in 6 steps
        </Typography>

        <Alert severity="info" sx={{ mb: 4 }}>
          The animated cursor demonstrates the typical student flow from joining
          a class to earning rewards.
        </Alert>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <AnimatedDemo
            steps={studentSteps}
            width="100%"
            autoPlay={true}
            loop={true}
            speed={1}
          />
        </Box>

        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Key Takeaways
          </Typography>
          <Box component="ul" sx={{ pl: 3, '& li': { mb: 1 } }}>
            <li><Typography>Join codes are 6-character strings shared by your instructor</Typography></li>
            <li><Typography>The workbook is interactive — answers are saved in real-time</Typography></li>
            <li><Typography>Each graded block contributes to your overall accuracy score</Typography></li>
            <li><Typography>AI provides hints and feedback if you're stuck</Typography></li>
            <li><Typography>XP and badges reward completion and accuracy</Typography></li>
          </Box>
        </Box>
      </Container>
    </Box>
  ),
};
