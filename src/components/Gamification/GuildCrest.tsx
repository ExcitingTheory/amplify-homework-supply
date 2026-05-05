/**
 * GuildCrest — Generates a styled avatar from guild name initials
 * with a deterministic color from the guild ID hash.
 *
 * @module GuildCrest
 */

import React, { useMemo } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export interface GuildCrestProps {
  guildId: string
  guildName: string
  totalXP?: number
  size?: 'small' | 'medium' | 'large'
  showName?: boolean
}

const SIZE_MAP = {
  small: 40,
  medium: 64,
  large: 96,
}

/**
 * Simple hash to deterministic HSL color
 */
function hashToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
    hash |= 0
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 60%, 45%)`
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
}

export function GuildCrest({
  guildId,
  guildName,
  totalXP,
  size = 'medium',
  showName = true,
}: GuildCrestProps) {
  const bgColor = useMemo(() => hashToColor(guildId), [guildId])
  const initials = useMemo(() => getInitials(guildName), [guildName])
  const px = SIZE_MAP[size]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
      <Avatar
        sx={{
          width: px,
          height: px,
          bgcolor: bgColor,
          fontSize: px * 0.4,
          fontWeight: 700,
          border: '3px solid',
          borderColor: 'divider',
        }}
      >
        {initials}
      </Avatar>
      {showName && (
        <Typography variant="subtitle2" sx={{ fontWeight: 600, textAlign: 'center' }}>
          {guildName}
        </Typography>
      )}
      {totalXP != null && (
        <Typography variant="caption" color="text.secondary">
          {totalXP.toLocaleString()} XP
        </Typography>
      )}
    </Box>
  )
}

export default GuildCrest
