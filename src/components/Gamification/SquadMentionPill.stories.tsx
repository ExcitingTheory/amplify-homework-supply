import type { Meta, StoryObj } from '@storybook/react'
import { SquadMentionPill, renderSquadMentions } from './SquadMentionPill'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

const meta: Meta<typeof SquadMentionPill> = {
  title: 'Gamification/SquadMentionPill',
  component: SquadMentionPill,
  tags: ['autodocs'],
  args: {
    squadId: 'squad-alpha-001',
    squadName: 'Iron Dragons',
    totalXP: 4250,
    size: 'small',
  },
}

export default meta
type Story = StoryObj<typeof SquadMentionPill>

export const Default: Story = {}

export const Medium: Story = {
  args: { size: 'medium' },
}

export const WithSvgCrest: Story = {
  args: {
    crestSvg:
      '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#2196F3"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="30">⚔</text></svg>',
  },
}

export const Clickable: Story = {
  args: {
    onClick: (id: string) => alert(`Navigate to squad: ${id}`),
  },
}

export const MultipleInline: Story = {
  render: () => (
    <Typography variant="body1" component="div" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5 }}>
      The battle between{' '}
      <SquadMentionPill squadId="squad-1" squadName="Iron Dragons" totalXP={4250} />
      {' '}and{' '}
      <SquadMentionPill squadId="squad-2" squadName="Pixel Wolves" totalXP={3980} />
      {' '}rages on!
    </Typography>
  ),
}

export const ParsedFromTemplate: Story = {
  render: () => {
    const template =
      'The {{@squad:squad-1:Iron Dragons}} defeated the {{@squad:squad-2:Pixel Wolves}} in an epic showdown!'
    const squads = [
      { id: 'squad-1', name: 'Iron Dragons', totalXP: 4250 },
      { id: 'squad-2', name: 'Pixel Wolves', totalXP: 3980 },
    ]
    const rendered = renderSquadMentions(template, { squads })

    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="caption" color="text.secondary">Template:</Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
            {template}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Rendered:</Typography>
          <Typography variant="body1" component="div" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5 }}>
            {rendered}
          </Typography>
        </Box>
      </Stack>
    )
  },
}
