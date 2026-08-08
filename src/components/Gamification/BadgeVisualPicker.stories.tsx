import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { BadgeVisualPicker } from './BadgeVisualPicker'
import { fn } from 'storybook/test'

const meta: Meta<typeof BadgeVisualPicker> = {
  title: '🏆 Gamification/Instructor/Badge Visual Picker',
  component: BadgeVisualPicker,
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof BadgeVisualPicker>

/** Default — starts with a trophy icon on a green circle */
export const Default: Story = {
  args: {
    value: {
      iconName: 'GiTrophy',
      iconLib: 'gi',
      shape: 'circle',
      bgColor: '#4caf50',
      iconColor: '#ffffff',
      animation: 'draw',
    },
    onChange: fn(),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

/** Shield with fire gradient */
export const FireShield: Story = {
  args: {
    value: {
      iconName: 'GiFireShield',
      iconLib: 'gi',
      shape: 'shield',
      bgColor: '#f44336',
      gradient: {
        type: 'linear',
        angle: '135deg',
        stops: [
          { color: '#ff9800', position: '0%' },
          { color: '#f44336', position: '100%' },
        ],
      },
      iconColor: '#ffd700',
      animation: 'glow',
    },
    onChange: fn(),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

/** Diamond shape with cosmic gradient */
export const CosmicDiamond: Story = {
  args: {
    value: {
      iconName: 'GiCrystalBall',
      iconLib: 'gi',
      shape: 'diamond',
      bgColor: '#7c4dff',
      gradient: {
        type: 'radial',
        stops: [
          { color: '#7c4dff', position: '0%' },
          { color: '#1a237e', position: '100%' },
        ],
      },
      iconColor: '#ffffff',
      animation: 'spin-in',
    },
    onChange: fn(),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}
