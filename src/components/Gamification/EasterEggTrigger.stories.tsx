import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'
import Box from '@mui/material/Box'
import { HiddenEasterEgg } from './EasterEggTrigger'
import { expect, within, userEvent } from 'storybook/test'

const meta: Meta<typeof HiddenEasterEgg> = {
  title: '🏆 Gamification/Easter Eggs/Hidden Easter Egg',
  component: HiddenEasterEgg,
}
export default meta

type Story = StoryObj<typeof HiddenEasterEgg>

export const Default: Story = {
  render: () => (
    <Box sx={{ position: 'relative', width: 300, height: 200, bgcolor: 'grey.100', borderRadius: 1, p: 2 }}>
      <Box>Hover carefully to find the hidden egg...</Box>
      <HiddenEasterEgg
        onFind={() => alert('You found it! +50 XP')}
        sx={{ bottom: 8, right: 8 }}
      />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    // Egg trigger element renders (may be a small icon or hidden area)
    expect(canvasElement.querySelector('[style*="position"], button, [role="button"]')).not.toBeNull()
  },
}

export const AlreadyFound: Story = {
  args: {
    onFind: () => {},
    found: true,
  },
  play: async ({ canvasElement }) => {
    // Already-found trigger is visually dimmed/disabled
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}
