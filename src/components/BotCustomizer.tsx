/**
 * BotCustomizer — Allows students to customize the AI assistant's avatar appearance.
 * Unlocked progressively via "Bot Whisperer" achievement badges.
 *
 * - Bot Whisperer I: Unlock background color
 * - Bot Whisperer II: Unlock style tier (detailed)
 * - Bot Whisperer III: Unlock eyes & mouth options
 * - Bot Whisperer IV: Full customization (toonhead style + all options)
 *
 * @module BotCustomizer
 */

import React, { useState, useCallback, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Chip from '@mui/material/Chip'
import LockIcon from '@mui/icons-material/Lock'
import { BotAvatar } from './BotAvatar'
import type { AvatarStyleTier, AvatarOverrides } from './Gamification/DiceBearAvatar'

// ============================================================================
// Types
// ============================================================================

export interface BotCustomizerProps {
  /** Which Bot Whisperer tier the student has reached (0 = none, 1–4 = badges) */
  botWhispererTier: number
  /** Callback when customization changes. Caller should persist to Settings model. */
  onChange?: (config: BotConfig) => void
  /** Initial config loaded from Settings. */
  initialConfig?: BotConfig
}

export interface BotConfig {
  style: AvatarStyleTier
  backgroundColor: string
}

// ============================================================================
// Constants
// ============================================================================

const BG_COLORS = [
  { label: 'Sky', value: 'b6e3f4' },
  { label: 'Mint', value: 'c0ffd4' },
  { label: 'Lavender', value: 'd1c4e9' },
  { label: 'Peach', value: 'ffd8b1' },
  { label: 'Rose', value: 'ffcdd2' },
  { label: 'Gold', value: 'fff9c4' },
]

const STYLE_OPTIONS: Array<{ value: AvatarStyleTier; label: string; minTier: number }> = [
  { value: 'simple', label: 'Simple', minTier: 0 },
  { value: 'detailed', label: 'Detailed', minTier: 2 },
  { value: 'toonhead', label: 'Toon', minTier: 4 },
]

// ============================================================================
// Component
// ============================================================================

export function BotCustomizer({ botWhispererTier, onChange, initialConfig }: BotCustomizerProps) {
  const [style, setStyle] = useState<AvatarStyleTier>(initialConfig?.style || 'simple')
  const [bgColor, setBgColor] = useState(initialConfig?.backgroundColor || 'b6e3f4')

  const overrides: AvatarOverrides = { backgroundColor: [bgColor] }

  const handleStyleChange = useCallback((_: unknown, newStyle: AvatarStyleTier | null) => {
    if (!newStyle) return
    setStyle(newStyle)
    onChange?.({ style: newStyle, backgroundColor: bgColor })
  }, [bgColor, onChange])

  const handleBgChange = useCallback((color: string) => {
    setBgColor(color)
    onChange?.({ style, backgroundColor: color })
  }, [style, onChange])

  // Sync if initialConfig changes externally
  useEffect(() => {
    if (initialConfig) {
      setStyle(initialConfig.style || 'simple')
      setBgColor(initialConfig.backgroundColor || 'b6e3f4')
    }
  }, [initialConfig])

  if (botWhispererTier < 1) {
    return (
      <Box sx={{ textAlign: 'center', py: 2, opacity: 0.6 }}>
        <LockIcon sx={{ fontSize: 32, mb: 1, color: 'text.disabled' }} />
        <Typography variant="body2" color="text.secondary">
          Earn the Bot Whisperer I badge to customize your AI assistant.
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Preview */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <BotAvatar size={64} style={style} overrides={overrides} />
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>Your AI Assistant</Typography>
          <Chip
            label={`Bot Whisperer ${['I', 'II', 'III', 'IV'][botWhispererTier - 1]}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Style selector */}
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Style</Typography>
      <ToggleButtonGroup
        value={style}
        exclusive
        onChange={handleStyleChange}
        size="small"
        sx={{ mb: 2 }}
      >
        {STYLE_OPTIONS.map(opt => (
          <ToggleButton
            key={opt.value}
            value={opt.value}
            disabled={botWhispererTier < opt.minTier}
          >
            {botWhispererTier < opt.minTier && <LockIcon sx={{ fontSize: 14, mr: 0.5 }} />}
            {opt.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* Background color */}
      {botWhispererTier >= 1 && (
        <>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Background Color</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {BG_COLORS.map(c => (
              <Box
                key={c.value}
                onClick={() => handleBgChange(c.value)}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: `#${c.value}`,
                  cursor: 'pointer',
                  border: bgColor === c.value ? '3px solid' : '2px solid transparent',
                  borderColor: bgColor === c.value ? 'primary.main' : 'transparent',
                  transition: 'border-color 0.2s',
                  '&:hover': { transform: 'scale(1.1)' },
                }}
                title={c.label}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  )
}

export default BotCustomizer
