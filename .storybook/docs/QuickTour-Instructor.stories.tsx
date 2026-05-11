/**
 * Quick Tour - Instructor Workflow
 * Live interactive demo using actual page components with play() interactions.
 */
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, waitFor, userEvent } from 'storybook/test';
import { Box } from '@mui/material';
import { setMockUser } from '@storybook-mocks/aws-amplify-auth';
import { seedIndexPageData } from '@storybook-mocks/index-page-examples';
import { FilesProvider } from '../../src/context/fileContext';

// App Router pages — all marked 'use client', safe for Storybook.
// Server action imports are aliased to mocks in .storybook/main.ts.
import UnitsPage from '../../app/[locale]/units/page.jsx';
import UnitDetailPage from '../../app/[locale]/unit/[id]/page.jsx';
import SectionDetailPage from '../../app/[locale]/section/[id]/page.jsx';

const meta: Meta = {
  title: '🏠 Getting Started/Quick Tour/Instructor Workflow',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { disable: true },
    // Page components manage their own providers
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
    nextjs: {
      appDirectory: true,
    },
  },
};
export default meta;
type Story = StoryObj;

/**
 * Step 1 — Browse your Units library.
 */
export const Step1_UnitsLibrary: Story = {
  name: '1. Units Library',
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'teacher-1',
        attributes: { sub: 'teacher-1', email: 'teacher@example.com' },
        groups: ['Instructors'],
      });
      seedIndexPageData('instructor');
      return <FilesProvider><Story /></FilesProvider>;
    },
  ],
  render: () => (
    <Box>
      <UnitsPage />
    </Box>
  ),
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'teacher-1', email: 'teacher@example.com' } },
      session: { username: 'teacher-1', identityId: 'identity-teacher-1' },
    },
    nextjs: {
      navigation: { pathname: '/units' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('View the units library', async () => {
      await waitFor(() => {
        const matches = canvas.getAllByText(/Japanese/i);
        if (matches.length === 0) throw new Error('No Japanese text found');
      }, { timeout: 8000 });
    });
    await step('Instructor sees published and draft units', async () => {
      await new Promise(r => setTimeout(r, 1500));
    });
  },
};

/**
 * Step 2 — Open the Lexical editor to create/edit content.
 */
export const Step2_UnitEditor: Story = {
  name: '2. Unit Editor',
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'teacher-1',
        attributes: { sub: 'teacher-1', email: 'teacher@example.com' },
        groups: ['Instructors'],
      });
      seedIndexPageData('instructor');
      return <FilesProvider><Story /></FilesProvider>;
    },
  ],
  render: () => (
    <Box>
      <UnitDetailPage />
    </Box>
  ),
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'teacher-1', email: 'teacher@example.com' } },
      session: { username: 'teacher-1', identityId: 'identity-teacher-1' },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/unit/unit-japanese-1',
        segments: [['id', 'unit-japanese-1']],
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Wait for editor to load', async () => {
      await waitFor(() => {
        const matches = canvas.getAllByText(/Japanese/i);
        if (matches.length === 0) throw new Error('No Japanese text found');
      }, { timeout: 8000 });
    });
    await step('Explore the editor toolbar', async () => {
      await new Promise(r => setTimeout(r, 1500));
      try {
        const boldBtn = canvas.queryByTitle(/bold/i) || canvas.queryByLabelText(/bold/i);
        if (boldBtn) await userEvent.click(boldBtn);
      } catch { /* Toolbar might not be present in mock */ }
    });
  },
};

/**
 * Step 3 — View a Section with student roster and grades.
 */
export const Step3_SectionGrades: Story = {
  name: '3. Section & Grades',
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'teacher-1',
        attributes: { sub: 'teacher-1', email: 'teacher@example.com' },
        groups: ['Instructors'],
      });
      seedIndexPageData('instructor');
      return <FilesProvider><Story /></FilesProvider>;
    },
  ],
  render: () => (
    <Box>
      <SectionDetailPage />
    </Box>
  ),
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'teacher-1', email: 'teacher@example.com' } },
      session: { username: 'teacher-1', identityId: 'identity-teacher-1' },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/section/section-jpn-101',
        segments: [['id', 'section-jpn-101']],
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('View class roster and assignments', async () => {
      await waitFor(() => {
        canvas.getByText(/Japanese/i);
      }, { timeout: 8000 });
    });
    await step('Review student grades', async () => {
      await new Promise(r => setTimeout(r, 2000));
    });
  },
};
