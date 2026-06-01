import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { BadgeClaimPanel } from './BadgeClaimPanel'

const meta: Meta<typeof BadgeClaimPanel> = {
  title: '🏠 Getting Started/Onboarding/Badge Claim Panel',
  component: BadgeClaimPanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Badge Claim Panel

Allows users to sign their onboarding progress into a JWT and transfer
it to the main app via WebRTC for badge verification.

## Flow

1. Complete onboarding tasks (instructor, learner, translator paths)
2. Click "Sign Badges" to create a signed JWT (stored in localStorage)
3. Click "Start Transfer" to open a WebRTC signaling session
4. Enter the 6-character session code on the main app's Documentation Badges panel
5. The JWT is transmitted peer-to-peer and verified by the server
        `,
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof BadgeClaimPanel>

export const Default: Story = {}
