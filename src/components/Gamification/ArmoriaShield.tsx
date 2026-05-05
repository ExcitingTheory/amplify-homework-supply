/**
 * ArmoriaShield — Renders an SVG guild shield from stored crestSvg string,
 * or falls back to GuildCrest initials avatar.
 *
 * When `armoriaUnlocked` is true and `crestSvg` is null, shows an "Edit Crest" button.
 *
 * @module ArmoriaShield
 */

import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { GuildCrest } from './GuildCrest'

export interface ArmoriaShieldProps {
  guildId: string
  guildName: string
  /** SVG markup of the designed coat of arms (null = not designed yet) */
  crestSvg?: string | null
  /** Whether the Armoria editor has been unlocked for this guild */
  armoriaUnlocked?: boolean
  /** Size in pixels for the shield container */
  size?: number
  /** Called when user clicks "Edit Crest" */
  onEditCrest?: () => void
  /** Show guild name below shield */
  showName?: boolean
}

export function ArmoriaShield({
  guildId,
  guildName,
  crestSvg,
  armoriaUnlocked = false,
  size = 96,
  onEditCrest,
  showName = true,
}: ArmoriaShieldProps) {
  // If we have a custom SVG, render it
  if (crestSvg) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
        <Box
          sx={{
            width: size,
            height: size,
            '& svg': { width: '100%', height: '100%' },
          }}
          dangerouslySetInnerHTML={{ __html: crestSvg }}
          aria-label={`${guildName} coat of arms`}
          role="img"
        />
        {showName && (
          <Box component="span" sx={{ fontWeight: 600, fontSize: '0.875rem', textAlign: 'center' }}>
            {guildName}
          </Box>
        )}
        {armoriaUnlocked && onEditCrest && (
          <Button size="small" onClick={onEditCrest} variant="text">
            Edit Crest
          </Button>
        )}
      </Box>
    )
  }

  // No custom SVG — show initials fallback + optional edit button
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
      <GuildCrest
        guildId={guildId}
        guildName={guildName}
        size={size >= 80 ? 'large' : size >= 50 ? 'medium' : 'small'}
        showName={showName}
      />
      {armoriaUnlocked && onEditCrest && (
        <Button size="small" onClick={onEditCrest} variant="outlined" sx={{ mt: 0.5 }}>
          Design Coat of Arms
        </Button>
      )}
    </Box>
  )
}

export default ArmoriaShield
