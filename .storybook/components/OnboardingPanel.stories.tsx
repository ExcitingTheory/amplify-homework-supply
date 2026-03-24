/**
 * @fileoverview Storybook stories for the OnboardingPanel component
 * 
 * Provides the getting-started-onboarding--docs story that the E2E tests expect.
 * This is the main onboarding entry point with persona selection and task tracking.
 */

import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, Container } from '@mui/material';
import OnboardingPanel from './OnboardingPanel';

const meta: Meta<typeof OnboardingPanel> = {
  title: 'Getting Started/Onboarding',
  component: OnboardingPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Welcome to Homework Supply

The interactive onboarding system helps you learn the platform through:

- **Persona Selection**: Choose your role (Instructor, Learner, Developer, or Translator)
- **Tutorial Mode**: Step-by-step guidance with interactive demos
- **Quiz Mode**: Hands-on practice with minimal guidance

## Getting Started

1. Select your persona to see relevant onboarding tasks
2. Complete tasks to track your progress
3. Switch between Tutorial and Quiz modes to learn at your pace
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OnboardingPanel>;

/**
 * Main Docs story - Entry point for onboarding
 * 
 * This story renders the full OnboardingPanel with:
 * - Welcome message and persona selection
 * - Task lists organized by category
 * - Progress tracking
 * - Mode switching (Tutorial/Quiz)
 */
export const Docs: Story = {
  render: () => {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#1a1a1a',
          color: '#e0e0e0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ color: '#fff', textAlign: 'center', mb: 4 }}
          >
            Welcome to Homework Supply
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: '#999', textAlign: 'center', mb: 4 }}
          >
            Select your role to begin the interactive onboarding experience
          </Typography>
          <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
            <OnboardingPanel />
          </Box>
        </Container>
      </Box>
    );
  },
};

/**
 * Persona Selection - Clean state for testing persona selection
 * This story clears localStorage to ensure the persona selection UI is shown.
 * Use this for E2E tests that need to test persona selection.
 */
export const PersonaSelection: Story = {
  render: () => {
    // Clear any persisted persona to show selection screen
    if (typeof window !== 'undefined') {
      localStorage.removeItem('onboarding-persona');
      localStorage.removeItem('onboarding-completed-tasks');
    }
    
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#1a1a1a',
          color: '#e0e0e0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ color: '#fff', textAlign: 'center', mb: 4 }}
          >
            Welcome to Homework Supply
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: '#999', textAlign: 'center', mb: 4 }}
          >
            Select your role to begin the interactive onboarding experience
          </Typography>
          <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
            <OnboardingPanel />
          </Box>
        </Container>
      </Box>
    );
  },
};

/**
 * Instructor Onboarding - Pre-selected instructor persona
 */
export const InstructorOnboarding: Story = {
  render: () => {
    // Pre-set instructor persona in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding-persona', 'instructor');
    }
    
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#1a1a1a',
          color: '#e0e0e0',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            Instructor Onboarding
          </Typography>
          <Box sx={{ maxWidth: 800 }}>
            <OnboardingPanel />
          </Box>
        </Container>
      </Box>
    );
  },
};

/**
 * Learner Onboarding - Pre-selected learner persona
 */
export const LearnerOnboarding: Story = {
  render: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding-persona', 'learner');
    }
    
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#1a1a1a',
          color: '#e0e0e0',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            Learner Onboarding
          </Typography>
          <Box sx={{ maxWidth: 800 }}>
            <OnboardingPanel />
          </Box>
        </Container>
      </Box>
    );
  },
};

/**
 * Developer Onboarding - Pre-selected developer persona
 */
export const DeveloperOnboarding: Story = {
  render: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding-persona', 'developer');
    }
    
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#1a1a1a',
          color: '#e0e0e0',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            Developer Onboarding
          </Typography>
          <Box sx={{ maxWidth: 800 }}>
            <OnboardingPanel />
          </Box>
        </Container>
      </Box>
    );
  },
};
