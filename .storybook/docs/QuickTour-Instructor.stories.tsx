/**
 * Quick Tour - Instructor Workflow
 * Live interactive demo using actual page components with play() interactions.
 */
import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { within, waitFor, userEvent, expect } from 'storybook/test';
import { Box } from '@mui/material';
import { setMockUser } from '@storybook-mocks/aws-amplify-auth';
import { clearMockData } from '@storybook-mocks/aws-amplify-data';
import { seedIndexPageData } from '@storybook-mocks/index-page-examples';
import { setNavigationState } from '@storybook-mocks/next-navigation';
import { PathParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js';
import { FilesProvider } from '../../src/context/fileContext';

// App Router pages — all marked 'use client', safe for Storybook.
// Server action imports are aliased to mocks in .storybook/main.ts.
import UnitsClient from '../../app/[locale]/units/UnitsClient.jsx';
import UnitEditorClient from '../../app/[locale]/unit/[id]/UnitEditorClient.jsx';
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
  loaders: [
    async () => {
      clearMockData();
      setMockUser({
        username: 'teacher-1',
        attributes: { sub: 'teacher-1', email: 'teacher@example.com' },
        groups: ['Instructors'],
      });
      setNavigationState({ pathname: '/units', params: {} });
      seedIndexPageData('instructor');
    },
  ],
  decorators: [
    (Story: React.FC) => <FilesProvider><Story /></FilesProvider>,
  ],
  render: () => (
    <Box>
      <UnitsClient initialUnits={[]} />
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
    initializeMockData: false,
    clearMockData: false,
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
  loaders: [
    async () => {
      clearMockData();
      setMockUser({
        username: 'teacher-1',
        attributes: { sub: 'teacher-1', email: 'teacher@example.com' },
        groups: ['Instructors'],
      });
      setNavigationState({ pathname: '/unit/unit-japanese-1', params: { id: 'unit-japanese-1' } });
      seedIndexPageData('instructor');
    },
  ],
  decorators: [
    (Story: React.FC) => <FilesProvider><Story /></FilesProvider>,
  ],
  render: () => (
    <Box>
      <PathParamsContext.Provider value={{ id: 'unit-japanese-1', locale: 'en' }}>
        <UnitEditorClient />
      </PathParamsContext.Provider>
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
    unitId: 'unit-japanese-1',
    initializeMockData: false,
    clearMockData: false,
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
  loaders: [
    async () => {
      clearMockData();
      setMockUser({
        username: 'teacher-1',
        attributes: { sub: 'teacher-1', email: 'teacher@example.com' },
        groups: ['Instructors'],
      });
      setNavigationState({ pathname: '/section/section-jpn-101', params: { id: 'section-jpn-101' } });
      seedIndexPageData('instructor');
    },
  ],
  decorators: [
    (Story: React.FC) => <FilesProvider><Story /></FilesProvider>,
  ],
  render: () => (
    <Box>
      <PathParamsContext.Provider value={{ id: 'section-jpn-101', locale: 'en' }}>
        <SectionDetailPage />
      </PathParamsContext.Provider>
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
    initializeMockData: false,
    clearMockData: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('View class roster and assignments', async () => {
      await waitFor(() => {
        expect(canvas.getAllByText(/Japanese/i).length).toBeGreaterThan(0);
      }, { timeout: 8000 });
    });
    await step('Review student grades', async () => {
      await new Promise(r => setTimeout(r, 2000));
    });
  },
};
