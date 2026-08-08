import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ArmoriaShield } from './ArmoriaShield'
import { expect } from 'storybook/test'

const meta: Meta<typeof ArmoriaShield> = {
  title: '🏆 Gamification/Avatars & Cosmetics/Armoria Shield',
  component: ArmoriaShield,
  argTypes: {
    size: { control: { type: 'range', min: 40, max: 200 } },
  },
}

export default meta
type Story = StoryObj<typeof ArmoriaShield>

export const FallbackInitials: Story = {
  args: {
    squadId: 'squad-abc-123',
    squadName: 'Phoenix Squad',
    crestSvg: null,
    armoriaUnlocked: false,
    size: 96,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

export const UnlockedNoDesign: Story = {
  args: {
    squadId: 'squad-abc-123',
    squadName: 'Phoenix Squad',
    crestSvg: null,
    armoriaUnlocked: true,
    size: 96,
    onEditCrest: () => alert('Open editor'),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">
  <path d="M10,2 L90,2 L90,60 Q90,95 50,98 Q10,95 10,60 Z" fill="#0f47af" stroke="#333" stroke-width="2"/>
  <text x="50" y="58" text-anchor="middle" font-size="30" fill="#ffd700">⚜</text>
</svg>`

export const CustomCrest: Story = {
  args: {
    squadId: 'squad-abc-123',
    squadName: 'Phoenix Squad',
    crestSvg: sampleSvg,
    armoriaUnlocked: true,
    size: 96,
    onEditCrest: () => alert('Open editor'),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

export const LargeSize: Story = {
  args: {
    squadId: 'squad-xyz-789',
    squadName: 'Dragon Knights',
    crestSvg: sampleSvg,
    armoriaUnlocked: true,
    size: 160,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}
