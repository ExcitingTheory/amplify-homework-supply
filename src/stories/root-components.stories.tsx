/**
 * @fileoverview Stories for root-level components (src/components/*.{jsx,tsx})
 * that don't yet have Storybook coverage.
 *
 * @module stories/root-components.stories
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

// Components
import AuthFormSkeleton from '../components/AuthFormSkeleton';
import AppSkeleton from '../components/AppSkeleton';
import { BotAvatar } from '../components/BotAvatar';
import { BotCustomizer } from '../components/BotCustomizer';
import CommunityUnitCard from '../components/CommunityUnitCard';
import LazyCardMedia from '../components/LazyCardMedia';
import { PrefetchButton } from '../components/PrefetchButton';
import SharedUnitCard from '../components/SharedUnitCard';
import ShowDeletedToggle from '../components/ShowDeletedToggle';
import { ToolbarScrollButton } from '../components/ToolbarScrollButton';

// Cast JSX component for TypeScript compatibility
const TypedToolbarScrollButton: React.FC<any> = ToolbarScrollButton;

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: '🧩 UI Components/App Primitives',
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// AuthFormSkeleton
// ---------------------------------------------------------------------------

export const AuthFormSkeletonStory: Story = {
  name: 'AuthFormSkeleton',
  render: () => <AuthFormSkeleton />,
  parameters: {
    docs: { description: { story: 'Skeleton displayed while Cognito auth state is resolving for unauthenticated users.' } },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

// ---------------------------------------------------------------------------
// AppSkeleton
// ---------------------------------------------------------------------------

export const AppSkeletonStory: Story = {
  name: 'AppSkeleton',
  render: () => <AppSkeleton />,
  parameters: {
    layout: 'fullscreen',
    docs: { description: { story: 'Full-page skeleton shown during initial app hydration with drawer and toolbar placeholders.' } },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

// ---------------------------------------------------------------------------
// BotAvatar
// ---------------------------------------------------------------------------

export const BotAvatarDefault: Story = {
  name: 'BotAvatar / Default',
  render: () => <BotAvatar />,
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const BotAvatarLarge: Story = {
  name: 'BotAvatar / Large',
  render: () => <BotAvatar size={64} style="detailed" />,
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

// ---------------------------------------------------------------------------
// BotCustomizer
// ---------------------------------------------------------------------------

export const BotCustomizerTier0: Story = {
  name: 'BotCustomizer / Locked (Tier 0)',
  render: () => <BotCustomizer botWhispererTier={0} onChange={fn()} />,
  parameters: {
    docs: { description: { story: 'No Bot Whisperer badges earned yet — all customizations locked.' } },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const BotCustomizerTier2: Story = {
  name: 'BotCustomizer / Tier 2',
  render: () => <BotCustomizer botWhispererTier={2} onChange={fn()} />,
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const BotCustomizerTier4: Story = {
  name: 'BotCustomizer / Full Unlock',
  render: () => (
    <BotCustomizer
      botWhispererTier={4}
      onChange={fn()}
      initialConfig={{ style: 'toonhead', backgroundColor: 'ffd8b1' }}
    />
  ),
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

// ---------------------------------------------------------------------------
// CommunityUnitCard
// ---------------------------------------------------------------------------

export const CommunityUnitCardDefault: Story = {
  name: 'CommunityUnitCard',
  render: () => (
    <CommunityUnitCard
      unit={{
        id: 'unit-community-1',
        name: 'Japanese Greetings for Beginners',
        description: 'Learn basic Japanese greetings and introductions used in everyday conversations.',
        owner: 'teacher-sato',
        publishedAt: '2024-03-15T10:00:00Z',
      }}
      onFork={fn()}
    />
  ),
  parameters: { layout: 'padded' },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const CommunityUnitCardForking: Story = {
  name: 'CommunityUnitCard / Forking',
  render: () => (
    <CommunityUnitCard
      unit={{
        id: 'unit-community-2',
        name: 'Kanji Radicals Deep Dive',
        description: 'Comprehensive guide to the 214 kangxi radicals.',
        owner: 'teacher-tanaka',
      }}
      onFork={fn()}
      forking
    />
  ),
  parameters: { layout: 'padded' },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

// ---------------------------------------------------------------------------
// LazyCardMedia
// ---------------------------------------------------------------------------

export const LazyCardMediaStory: Story = {
  name: 'LazyCardMedia',
  render: () => (
    <div style={{ width: 320, height: 200, border: '1px solid #ccc', borderRadius: 8, overflow: 'hidden' }}>
      <LazyCardMedia
        s3Key="public/images/sample-thumbnail.jpg"
        identityId="us-east-1:identity-teacher-1"
        fileId="file-sample-1"
        level="protected"
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Lazy-loaded card image using IntersectionObserver. Loads presigned URL only when visible.' } },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

// ---------------------------------------------------------------------------
// PrefetchButton
// ---------------------------------------------------------------------------

export const PrefetchButtonDefault: Story = {
  name: 'PrefetchButton',
  render: () => (
    <PrefetchButton href="/units" variant="contained" color="primary">
      Go to Units
    </PrefetchButton>
  ),
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const PrefetchButtonOutlined: Story = {
  name: 'PrefetchButton / Outlined',
  render: () => (
    <PrefetchButton href="/sections" variant="outlined">
      View Sections
    </PrefetchButton>
  ),
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

// ---------------------------------------------------------------------------
// SharedUnitCard
// ---------------------------------------------------------------------------

export const SharedUnitCardEdit: Story = {
  name: 'SharedUnitCard / Edit Permission',
  render: () => (
    <SharedUnitCard
      unit={{
        id: 'unit-shared-1',
        name: 'Collaborative Lesson: Travel Phrases',
        description: 'Shared unit with full edit access.',
        owner: 'teacher-sato',
        _collaboratorPermission: 'EDIT',
      }}
      onOpen={fn()}
    />
  ),
  parameters: { layout: 'padded' },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const SharedUnitCardRead: Story = {
  name: 'SharedUnitCard / Read-Only',
  render: () => (
    <SharedUnitCard
      unit={{
        id: 'unit-shared-2',
        name: 'Reference: Grammar Notes',
        description: 'Shared unit with read-only access.',
        owner: 'teacher-tanaka',
        _collaboratorPermission: 'READ',
      }}
      onOpen={fn()}
    />
  ),
  parameters: { layout: 'padded' },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

// ---------------------------------------------------------------------------
// ShowDeletedToggle
// ---------------------------------------------------------------------------

export const ShowDeletedToggleOff: Story = {
  name: 'ShowDeletedToggle / Off',
  render: () => {
    const [show, setShow] = React.useState(false);
    return <ShowDeletedToggle showDeleted={show} setShowDeleted={setShow} />;
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const ShowDeletedToggleOn: Story = {
  name: 'ShowDeletedToggle / On',
  render: () => {
    const [show, setShow] = React.useState(true);
    return <ShowDeletedToggle showDeleted={show} setShowDeleted={setShow} />;
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

// ---------------------------------------------------------------------------
// ToolbarScrollButton
// ---------------------------------------------------------------------------

export const ToolbarScrollButtonLeft: Story = {
  name: 'ToolbarScrollButton / Left',
  render: () => <TypedToolbarScrollButton direction="left" onClick={fn()} ariaLabel="Scroll left" />,
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const ToolbarScrollButtonRight: Story = {
  name: 'ToolbarScrollButton / Right',
  render: () => <TypedToolbarScrollButton direction="right" onClick={fn()} ariaLabel="Scroll right" />,
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const ToolbarScrollButtonDisabled: Story = {
  name: 'ToolbarScrollButton / Disabled',
  render: () => <TypedToolbarScrollButton direction="left" onClick={fn()} disabled ariaLabel="No more" />,
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};
