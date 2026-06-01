/**
 * MentionChip — Renders an inline @mention as a styled chip.
 */

import React from 'react'
import { Chip } from '@mui/material'
import SmartToyIcon from '@mui/icons-material/SmartToy'

export interface MentionChipProps {
  name: string
  onClick?: () => void
}

export function MentionChip({ name, onClick }: MentionChipProps) {
  const isBot = name.toLowerCase() === 'kai'

  return (
    <Chip
      component="span"
      label={`@${name}`}
      size="small"
      icon={isBot ? <SmartToyIcon /> : undefined}
      color={isBot ? 'secondary' : 'primary'}
      variant="outlined"
      onClick={onClick}
      clickable={!!onClick}
      sx={{
        height: 20,
        fontSize: '0.8rem',
        verticalAlign: 'middle',
        mx: 0.25,
        cursor: onClick ? 'pointer' : 'default',
      }}
    />
  )
}
