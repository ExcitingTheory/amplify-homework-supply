import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { WorkbookInviteShare } from './WorkbookInviteShare';
import type { PresenceUser } from '../../yjs/workbookHooks';
import { expect } from 'storybook/test'

const meta: Meta<typeof WorkbookInviteShare> = {
  title: '📓 Workbook/WorkbookInviteShare',
  component: WorkbookInviteShare,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof WorkbookInviteShare>;

const mockUsers: PresenceUser[] = [
  { clientId: 1, username: 'alice', role: 'student', displayName: 'Alice Johnson', color: '#1976d2', isIdle: false },
  { clientId: 2, username: 'bob', role: 'student', displayName: 'Bob Smith', color: '#9c27b0', isIdle: false },
  { clientId: 3, username: 'charlie', role: 'student', displayName: 'Charlie Brown', color: '#388e3c', isIdle: true },
];

export const Connected: Story = {
  args: {
    users: mockUsers,
    workbookId: 'workbook-abc-123',
    isConnected: true,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const Disconnected: Story = {
  args: {
    users: mockUsers.slice(0, 1),
    workbookId: 'workbook-abc-123',
    isConnected: false,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const NoParticipants: Story = {
  args: {
    users: [],
    workbookId: 'workbook-solo-456',
    isConnected: true,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const ManyParticipants: Story = {
  args: {
    users: Array.from({ length: 8 }, (_, i) => ({
      clientId: i + 1,
      username: `user-${i}`,
      role: 'student' as const,
      displayName: `Student ${i + 1}`,
      color: `hsl(${i * 45}, 70%, 50%)`,
      isIdle: i > 5,
    })),
    workbookId: 'workbook-group-789',
    isConnected: true,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};
