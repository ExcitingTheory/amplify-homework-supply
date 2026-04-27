import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Avatar, AvatarGroup, Box, Tooltip, Typography } from '@mui/material'

/**
 * Standalone rendering of WorkbookPresenceBar presentation.
 * Since the real component reads from UnitContext + Y.js provider,
 * this story replicates the visual output with mock users.
 */

interface MockUser {
  clientId: number
  username: string
  displayName: string
  color: string
  isIdle: boolean
}

function PresenceBarVisual({ users, max = 5 }: { users: MockUser[]; max?: number }) {
  if (users.length === 0) return <Typography variant="caption">No users connected</Typography>

  return (
    <Box display="flex" alignItems="center" gap={1} sx={{ py: 0.5, px: 1 }}>
      <AvatarGroup
        max={max}
        sx={{
          '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.75rem' },
        }}
      >
        {users.map((user) => (
          <Tooltip
            key={user.clientId}
            title={`${user.displayName}${user.isIdle ? ' (idle)' : ''}`}
          >
            <Avatar
              sx={{
                bgcolor: user.color,
                opacity: user.isIdle ? 0.4 : 1,
                transition: 'opacity 0.3s ease',
              }}
            >
              {user.displayName[0].toUpperCase()}
            </Avatar>
          </Tooltip>
        ))}
      </AvatarGroup>
      <Typography variant="caption" color="text.secondary">
        {users.length} {users.length === 1 ? 'user' : 'users'} connected
      </Typography>
    </Box>
  )
}

const meta: Meta<typeof PresenceBarVisual> = {
  title: 'Workbook/WorkbookPresenceBar',
  component: PresenceBarVisual,
}
export default meta

type Story = StoryObj<typeof PresenceBarVisual>

const mockUsers: MockUser[] = [
  { clientId: 1, username: 'alice', displayName: 'Alice', color: '#e91e63', isIdle: false },
  { clientId: 2, username: 'bob', displayName: 'Bob', color: '#2196f3', isIdle: false },
  { clientId: 3, username: 'charlie', displayName: 'Charlie', color: '#4caf50', isIdle: true },
]

export const ThreeUsers: Story = {
  args: { users: mockUsers },
}

export const SingleUser: Story = {
  args: {
    users: [{ clientId: 1, username: 'alice', displayName: 'Alice', color: '#e91e63', isIdle: false }],
  },
}

export const WithIdleUsers: Story = {
  args: {
    users: [
      { clientId: 1, username: 'alice', displayName: 'Alice', color: '#e91e63', isIdle: false },
      { clientId: 2, username: 'bob', displayName: 'Bob', color: '#2196f3', isIdle: true },
      { clientId: 3, username: 'charlie', displayName: 'Charlie', color: '#4caf50', isIdle: true },
    ],
  },
}

export const Overflow: Story = {
  args: {
    users: [
      { clientId: 1, username: 'alice', displayName: 'Alice', color: '#e91e63', isIdle: false },
      { clientId: 2, username: 'bob', displayName: 'Bob', color: '#2196f3', isIdle: false },
      { clientId: 3, username: 'charlie', displayName: 'Charlie', color: '#4caf50', isIdle: false },
      { clientId: 4, username: 'diana', displayName: 'Diana', color: '#ff9800', isIdle: false },
      { clientId: 5, username: 'eve', displayName: 'Eve', color: '#9c27b0', isIdle: false },
      { clientId: 6, username: 'frank', displayName: 'Frank', color: '#795548', isIdle: true },
      { clientId: 7, username: 'grace', displayName: 'Grace', color: '#607d8b', isIdle: false },
    ],
    max: 5,
  },
}

export const Empty: Story = {
  args: { users: [] },
}
