/**
 * @fileoverview Stories for root-level components that require context providers
 * (AppShell, GlobalSearchBar, GradeReviewDrawer, JobsDashboard, etc.)
 *
 * @module stories/root-components-with-providers.stories
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import AppShell from '../components/AppShell';
import { GradeReviewDrawer } from '../components/GradeReviewDrawer';
import RecordingStudioEnhancedModal from '../components/RecordingStudioEnhancedModal';
import CollaboratorManager from '../components/CollaboratorManager';

import { seedIndexPageData } from '../../.storybook/__mocks__/index-page-examples';
import { setMockUser } from '../../.storybook/__mocks__/aws-amplify-auth';
import { FilesProvider } from '../context/fileContext';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: '🧩 UI Components/App Primitives (With Providers)',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// AppShell
// ---------------------------------------------------------------------------

export const AppShellDefault: Story = {
  name: 'AppShell / Default',
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        userId: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com' },
        groups: ['section-jpn-101-learners'],
      });
      seedIndexPageData('student');
      return <Story />;
    },
  ],
  render: () => (
    <AppShell toolbarChildren={null}>
      <div style={{ padding: 24 }}>
        <h2>Page Content</h2>
        <p>This is the main content area rendered inside AppShell.</p>
      </div>
    </AppShell>
  ),
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'student-alice-sub', email: 'alice@example.com' } },
      session: { username: 'student-alice-sub', identityId: 'identity-alice', groups: ['section-jpn-101-learners'] },
    },
    docs: { description: { story: 'Responsive shell with persistent sidebar on desktop, modal drawer on mobile.' } },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

// ---------------------------------------------------------------------------
// GradeReviewDrawer
// ---------------------------------------------------------------------------

export const GradeReviewDrawerOpen: Story = {
  name: 'GradeReviewDrawer / Open',
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'teacher-1',
        userId: 'teacher-1',
        attributes: { sub: 'teacher-1', email: 'teacher@example.com' },
        groups: ['Instructors'],
      });
      seedIndexPageData('instructor');
      return (
        <FilesProvider>
          <Story />
        </FilesProvider>
      );
    },
  ],
  render: () => (
    <GradeReviewDrawer
      open={true}
      onClose={fn()}
      gradeId="grade-alice-unit-1"
      unitId="unit-japanese-1"
      studentName="Alice Johnson"
      gradeIds={['grade-alice-unit-1', 'grade-bob-unit-1', 'grade-carol-unit-1']}
      currentIndex={0}
      onNavigate={fn()}
    />
  ),
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'teacher-1', email: 'teacher@example.com' } },
      session: { username: 'teacher-1', identityId: 'identity-teacher-1', groups: ['Instructors'] },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const GradeReviewDrawerClosed: Story = {
  name: 'GradeReviewDrawer / Closed',
  render: () => (
    <GradeReviewDrawer
      open={false}
      onClose={fn()}
      gradeId={null}
      unitId={null}
      studentName=""
      gradeIds={[]}
      currentIndex={0}
      onNavigate={fn()}
    />
  ),
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

// ---------------------------------------------------------------------------
// CollaboratorManager
// ---------------------------------------------------------------------------

export const CollaboratorManagerOwner: Story = {
  name: 'CollaboratorManager / Owner View',
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'teacher-1',
        userId: 'teacher-1',
        attributes: { sub: 'teacher-1', email: 'teacher@example.com' },
        groups: ['Instructors'],
      });
      return <Story />;
    },
  ],
  render: () => (
    <CollaboratorManager
      unitId="unit-japanese-1"
      unitOwner="teacher-1"
      currentUsername="teacher-1"
      isOwnerOrAdmin={true}
    />
  ),
  parameters: {
    layout: 'centered',
    mockAuth: {
      user: { attributes: { sub: 'teacher-1', email: 'teacher@example.com' } },
      session: { username: 'teacher-1', identityId: 'identity-teacher-1', groups: ['Instructors'] },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const CollaboratorManagerReadOnly: Story = {
  name: 'CollaboratorManager / Read-Only (non-owner)',
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'teacher-2',
        userId: 'teacher-2',
        attributes: { sub: 'teacher-2', email: 'teacher2@example.com' },
        groups: ['Instructors'],
      });
      return <Story />;
    },
  ],
  render: () => (
    <CollaboratorManager
      unitId="unit-japanese-1"
      unitOwner="teacher-1"
      currentUsername="teacher-2"
      isOwnerOrAdmin={false}
    />
  ),
  parameters: {
    layout: 'centered',
    mockAuth: {
      user: { attributes: { sub: 'teacher-2', email: 'teacher2@example.com' } },
      session: { username: 'teacher-2', groups: ['Instructors'] },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

// ---------------------------------------------------------------------------
// RecordingStudioEnhancedModal
// ---------------------------------------------------------------------------

export const RecordingStudioEnhancedModalOpen: Story = {
  name: 'RecordingStudioEnhancedModal / Open',
  decorators: [
    (Story: React.FC) => {
      setMockUser({
        username: 'student-alice-sub',
        userId: 'student-alice-sub',
        attributes: { sub: 'student-alice-sub', email: 'alice@example.com' },
        groups: ['section-jpn-101-learners'],
      });
      return (
        <FilesProvider>
          <Story />
        </FilesProvider>
      );
    },
  ],
  render: () => (
    <RecordingStudioEnhancedModal
      open={true}
      onClose={fn()}
      onSave={fn()}
      title="Record Audio Response"
      gradeId="grade-alice-unit-1"
      nodeKey="answer-block-1"
    />
  ),
  parameters: {
    mockAuth: {
      user: { attributes: { sub: 'student-alice-sub', email: 'alice@example.com' } },
      session: { username: 'student-alice-sub', identityId: 'identity-alice', groups: ['section-jpn-101-learners'] },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const RecordingStudioEnhancedModalClosed: Story = {
  name: 'RecordingStudioEnhancedModal / Closed',
  render: () => (
    <RecordingStudioEnhancedModal
      open={false}
      onClose={fn()}
      onSave={fn()}
    />
  ),
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};
