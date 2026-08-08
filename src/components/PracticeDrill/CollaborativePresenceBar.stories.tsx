import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import CollaborativePresenceBar from './CollaborativePresenceBar';
import type { PracticeUser, GroupStats, ParticipantProgress } from '../../yjs/PracticeCollaborationProvider';
import { expect } from 'storybook/test'

const meta: Meta<typeof CollaborativePresenceBar> = {
  title: '🎯 Practice Drills/Components/Collaborative Presence Bar',
  component: CollaborativePresenceBar,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof CollaborativePresenceBar>;

const mockParticipants: PracticeUser[] = [
  { username: 'alice', displayName: 'Alice', color: '#1976d2' },
  { username: 'bob', displayName: 'Bob', color: '#9c27b0' },
  { username: 'charlie', displayName: 'Charlie', color: '#388e3c' },
  { username: 'diana', displayName: 'Diana', color: '#f57c00' },
];

const mockGroupStats: GroupStats = { totalParticipants: 4, averageAccuracy: 65, blocksCompletedTotal: 12, blockAccuracies: {}, lastUpdated: new Date().toISOString() };
const mockOwnProgress: ParticipantProgress = { username: 'alice', blocksCompleted: 3, blocksAttempted: 5, lastActiveAt: new Date().toISOString() };

export const Connected: Story = {
  args: {
    participants: mockParticipants.slice(1),
    currentUser: mockParticipants[0],
    groupStats: mockGroupStats,
    ownProgress: mockOwnProgress,
    roomCode: 'ABCD-1234',
    isConnected: true,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const Disconnected: Story = {
  args: {
    ...Connected.args,
    isConnected: false,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const TwoParticipants: Story = {
  args: {
    participants: [mockParticipants[1]],
    currentUser: mockParticipants[0],
    groupStats: { ...mockGroupStats, totalParticipants: 2, averageAccuracy: 50, blocksCompletedTotal: 5 },
    ownProgress: { ...mockOwnProgress, blocksCompleted: 2, blocksAttempted: 5 },
    roomCode: 'WXYZ-5678',
    isConnected: true,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const ManyParticipants: Story = {
  args: {
    participants: Array.from({ length: 9 }, (_, i) => ({
      username: `user-${i + 1}`,
      displayName: `Student ${i + 2}`,
      color: `hsl(${(i + 1) * 36}, 70%, 50%)`,
    })),
    currentUser: { username: 'user-0', displayName: 'Student 1', color: 'hsl(0, 70%, 50%)' },
    groupStats: { ...mockGroupStats, totalParticipants: 10, averageAccuracy: 72, blocksCompletedTotal: 35 },
    ownProgress: { ...mockOwnProgress, blocksCompleted: 4, blocksAttempted: 5 },
    roomCode: 'MEGA-GROUP',
    isConnected: true,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const AllComplete: Story = {
  args: {
    participants: mockParticipants.slice(1),
    currentUser: mockParticipants[0],
    groupStats: { ...mockGroupStats, totalParticipants: 4, averageAccuracy: 95, blocksCompletedTotal: 20 },
    ownProgress: { ...mockOwnProgress, blocksCompleted: 5, blocksAttempted: 5 },
    roomCode: 'DONE-1234',
    isConnected: true,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};
