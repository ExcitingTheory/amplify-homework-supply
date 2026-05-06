import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { DiceBearAvatar } from './DiceBearAvatar'
import { AvatarGlowRing, DEFAULT_GLOW_COLORS, GLOW_COLOR_PRESETS } from './AvatarGlowRing'
import type { GlowRingConfig } from './AvatarGlowRing'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// ============================================================================
// Standalone GlowRing stories
// ============================================================================

const glowMeta: Meta<typeof AvatarGlowRing> = {
  title: 'Gamification/AvatarGlowRing',
  component: AvatarGlowRing,
  parameters: { layout: 'centered' },
}

export default glowMeta
type Story = StoryObj<typeof AvatarGlowRing>

const activeConfig: GlowRingConfig = {
  colors: DEFAULT_GLOW_COLORS,
  speed: 4,
  thickness: 3,
  active: true,
  expiresAt: null, // permanent
}

export const Default: Story = {
  render: () => (
    <AvatarGlowRing size={96} config={activeConfig}>
      <DiceBearAvatar seed="demo-student" size={96} style="detailed" />
    </AvatarGlowRing>
  ),
}

export const AllPresets: Story = {
  name: 'Color Presets',
  render: () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, p: 2 }}>
      {Object.entries(GLOW_COLOR_PRESETS).map(([name, colors]) => (
        <Box key={name} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <AvatarGlowRing
            size={72}
            config={{ colors, speed: 4, thickness: 3, active: true, expiresAt: null }}
          >
            <DiceBearAvatar seed={`preset-${name}`} size={72} style="detailed" />
          </AvatarGlowRing>
          <Typography variant="caption">{name}</Typography>
        </Box>
      ))}
    </Box>
  ),
}

export const FastSpin: Story = {
  name: 'Fast Rotation',
  render: () => (
    <AvatarGlowRing
      size={96}
      config={{ ...activeConfig, speed: 1.5 }}
    >
      <DiceBearAvatar seed="speedy" size={96} style="toonhead" />
    </AvatarGlowRing>
  ),
}

export const ThickRing: Story = {
  name: 'Thick Ring',
  render: () => (
    <AvatarGlowRing
      size={96}
      config={{ ...activeConfig, thickness: 6, colors: GLOW_COLOR_PRESETS.fire }}
    >
      <DiceBearAvatar seed="thickboy" size={96} style="simple" />
    </AvatarGlowRing>
  ),
}

export const Expired: Story = {
  name: 'Expired (No Ring)',
  render: () => (
    <AvatarGlowRing
      size={96}
      config={{ ...activeConfig, expiresAt: '2020-01-01T00:00:00Z' }}
    >
      <DiceBearAvatar seed="expired" size={96} style="detailed" />
    </AvatarGlowRing>
  ),
}

export const Inactive: Story = {
  name: 'Inactive',
  render: () => (
    <AvatarGlowRing
      size={96}
      config={{ ...activeConfig, active: false }}
    >
      <DiceBearAvatar seed="inactive" size={96} style="detailed" />
    </AvatarGlowRing>
  ),
}

export const SmallToolbarSize: Story = {
  name: 'Small (Toolbar Size)',
  render: () => (
    <AvatarGlowRing
      size={28}
      config={{ ...activeConfig, thickness: 2 }}
    >
      <DiceBearAvatar seed="toolbar" size={28} style="simple" />
    </AvatarGlowRing>
  ),
}

export const ViaAvatarProp: Story = {
  name: 'Via DiceBearAvatar glowRing prop',
  render: () => (
    <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <Box sx={{ textAlign: 'center' }}>
        <DiceBearAvatar
          seed="with-glow"
          size={96}
          style="detailed"
          glowRing={{ colors: GLOW_COLOR_PRESETS.aurora, speed: 3, thickness: 3, active: true, expiresAt: null }}
        />
        <Typography variant="caption" display="block" mt={1}>With glow</Typography>
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        <DiceBearAvatar seed="no-glow" size={96} style="detailed" />
        <Typography variant="caption" display="block" mt={1}>Without glow</Typography>
      </Box>
    </Box>
  ),
}
