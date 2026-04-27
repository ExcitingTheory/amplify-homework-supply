import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { CommentThreadDrawer } from './CommentThreadDrawer'
import { CommentGutterIcon } from './CommentGutterIcon'
import { BlockHistoryTimeline } from './BlockHistoryTimeline'
import type { CommentThread } from '../../yjs/WorkbookCollaborationProvider'
import type { HistoryEntry } from '../../yjs/WorkbookCollaborationProvider'

// =============================================================================
// CommentGutterIcon Stories
// =============================================================================

const gutterMeta: Meta<typeof CommentGutterIcon> = {
  title: 'Workbook/CommentGutterIcon',
  component: CommentGutterIcon,
}
export default gutterMeta

type GutterStory = StoryObj<typeof CommentGutterIcon>

export const NoComments: GutterStory = {
  args: {
    commentCount: 0,
    unresolvedCount: 0,
    onClick: () => console.log('open'),
  },
}

export const WithComments: GutterStory = {
  args: {
    commentCount: 5,
    unresolvedCount: 3,
    onClick: () => console.log('open'),
  },
}

export const AllResolved: GutterStory = {
  args: {
    commentCount: 4,
    unresolvedCount: 0,
    onClick: () => console.log('open'),
  },
}

// =============================================================================
// CommentThreadDrawer Stories
// =============================================================================

const drawerMeta: Meta<typeof CommentThreadDrawer> = {
  title: 'Workbook/CommentThreadDrawer',
  component: CommentThreadDrawer,
}

const sampleThreads: CommentThread[] = [
  {
    id: 'thread-1',
    blockId: 'block-abc',
    author: 'instructor1',
    displayName: 'Prof. Smith',
    text: 'Great answer, but can you elaborate on the process?',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    resolved: false,
    replies: [
      {
        author: 'student1',
        displayName: 'Alice',
        text: 'I added more detail about the electron transport chain.',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
  },
  {
    id: 'thread-2',
    blockId: 'block-abc',
    author: 'instructor1',
    displayName: 'Prof. Smith',
    text: 'Check your spelling on "mitochondria".',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    resolved: true,
    replies: [],
  },
]

export const DrawerOpen: StoryObj<typeof CommentThreadDrawer> = {
  render: () => (
    <CommentThreadDrawer
      open={true}
      onClose={() => {}}
      blockId="block-abc"
      threads={sampleThreads}
      onAddComment={(text) => console.log('Add comment:', text)}
      onReply={(key, text) => console.log('Reply:', key, text)}
      onResolve={(key, resolved) => console.log('Resolve:', key, resolved)}
      currentUsername="student1"
    />
  ),
  parameters: { ...drawerMeta },
}

export const DrawerEmpty: StoryObj<typeof CommentThreadDrawer> = {
  render: () => (
    <CommentThreadDrawer
      open={true}
      onClose={() => {}}
      blockId="block-xyz"
      threads={[]}
      onAddComment={(text) => console.log('Add:', text)}
      onReply={() => {}}
      onResolve={() => {}}
    />
  ),
  parameters: { ...drawerMeta },
}

// =============================================================================
// BlockHistoryTimeline Stories
// =============================================================================

const historyMeta: Meta<typeof BlockHistoryTimeline> = {
  title: 'Workbook/BlockHistoryTimeline',
  component: BlockHistoryTimeline,
}

const sampleEntries: HistoryEntry[] = [
  {
    blockId: 'block-1',
    userId: 'student1',
    displayName: 'Alice',
    fieldChanged: 'userAnswer',
    oldValue: 'Osmosis is...',
    newValue: 'Osmosis is the movement of water through a semi-permeable membrane from low to high concentration.',
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    blockId: 'block-1',
    userId: 'student1',
    displayName: 'Alice',
    fieldChanged: 'complete',
    oldValue: false,
    newValue: true,
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    blockId: 'block-1',
    userId: 'instructor1',
    displayName: 'Prof. Smith',
    fieldChanged: 'accuracy',
    oldValue: 0,
    newValue: 85,
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
]

export const HistoryStory: StoryObj<typeof BlockHistoryTimeline> = {
  render: () => <BlockHistoryTimeline entries={sampleEntries} />,
  parameters: { ...historyMeta },
}

export const HistoryEmpty: StoryObj<typeof BlockHistoryTimeline> = {
  render: () => <BlockHistoryTimeline entries={[]} />,
  parameters: { ...historyMeta },
}
