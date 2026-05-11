/**
 * Quick Tour - Student Workflow
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
import HomePage from '../../app/[locale]/page.jsx';
import SectionDetailPage from '../../app/[locale]/section/[id]/page.jsx';
import WorkbookClient from '../../app/[locale]/workbook/[id]/WorkbookClient';

const meta: Meta = {
  title: '🏠 Getting Started/Quick Tour/Student Workflow',
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
 * Step 1 — Student dashboard with assignments and progress.
 */
export const Step1_Dashboard: Story = {
  name: '1. Student Dashboard',
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com', name: 'Alice Johnson' },
        groups: ['Learners'],
      });
      seedIndexPageData('student');
      return <FilesProvider><Story /></FilesProvider>;
    },
  ],
  render: () => (
    <Box>
      <HomePage />
    </Box>
  ),
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'student-alice-sub', email: 'alice@example.com', name: 'Alice Johnson' } },
      session: { username: 'student-alice-sub', identityId: 'identity-alice' },
    },
    nextjs: {
      navigation: { pathname: '/' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('View student dashboard', async () => {
      await waitFor(() => {
        const matches = canvas.getAllByText(/Japanese/i);
        if (matches.length === 0) throw new Error('No content found');
      }, { timeout: 8000 });
    });
    await step('Student sees their assignments and progress', async () => {
      await new Promise(r => setTimeout(r, 1500));
    });
  },
};

/**
 * Step 2 — Join a section and view class assignments.
 */
export const Step2_JoinSection: Story = {
  name: '2. Section & Assignments',
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com', name: 'Alice Johnson' },
        groups: ['Learners'],
      });
      seedIndexPageData('student');
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
      user: { attributes: { sub: 'student-alice-sub', email: 'alice@example.com', name: 'Alice Johnson' } },
      session: { username: 'student-alice-sub', identityId: 'identity-alice' },
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
    await step('View section assignments', async () => {
      await waitFor(() => {
        const matches = canvas.getAllByText(/Japanese/i);
        if (matches.length === 0) throw new Error('No Japanese text found');
      }, { timeout: 8000 });
    });
    await step('Student can see due dates and progress', async () => {
      await new Promise(r => setTimeout(r, 1500));
    });
  },
};

/**
 * Step 3 — Complete a workbook with graded blocks.
 */
export const Step3_Workbook: Story = {
  name: '3. Workbook',
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com', name: 'Alice Johnson' },
        groups: ['Learners'],
      });
      seedIndexPageData('student');
      return <FilesProvider><Story /></FilesProvider>;
    },
  ],
  render: () => (
    <Box>
      <WorkbookClient />
    </Box>
  ),
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'student-alice-sub', email: 'alice@example.com', name: 'Alice Johnson' } },
      session: { username: 'student-alice-sub', identityId: 'identity-alice' },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/workbook/unit-japanese-1',
        segments: [['id', 'unit-japanese-1']],
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Wait for workbook to load', async () => {
      await waitFor(() => {
        canvas.getByText(/Japanese/i);
      }, { timeout: 8000 });
    });
    await step('Student interacts with graded content', async () => {
      await new Promise(r => setTimeout(r, 2000));
    });
  },
};
