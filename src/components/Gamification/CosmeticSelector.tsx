/**
 * CosmeticSelector — Picker for choosing avatar style and editor themes.
 *
 * @module CosmeticSelector
 */

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import LockIcon from '@mui/icons-material/Lock'
import CheckIcon from '@mui/icons-material/Check'
import PaletteIcon from '@mui/icons-material/Palette'
import FaceIcon from '@mui/icons-material/Face'
import { DiceBearAvatar, getStyleTierStatus } from './DiceBearAvatar'
import type { AvatarStyleTier, AvatarOverrides, AvatarUnlockConfig } from './DiceBearAvatar'
import { AvatarCustomizer } from './AvatarCustomizer'
import { ThemeMixer } from './ThemeMixer'
import type { CustomThemePaletteInput } from './ThemeMixer'

// ============================================================================
// Editor Theme Data
// ============================================================================

export interface EditorTheme {
  id: string
  name: string
  minLevel: number
  preview: { bg: string; text: string; accent: string }
}

export const DEFAULT_EDITOR_THEMES: EditorTheme[] = [
  { id: 'default', name: 'Default', minLevel: 1, preview: { bg: '#ffffff', text: '#333333', accent: '#1976d2' } },
  { id: 'midnight', name: 'Midnight', minLevel: 2, preview: { bg: '#1a1a2e', text: '#e0e0e0', accent: '#00bcd4' } },
  { id: 'forest', name: 'Forest', minLevel: 3, preview: { bg: '#1b2d1b', text: '#c8e6c9', accent: '#66bb6a' } },
  { id: 'sunset', name: 'Sunset', minLevel: 4, preview: { bg: '#2d1b1b', text: '#ffccbc', accent: '#ff7043' } },
  { id: 'aurora', name: 'Aurora', minLevel: 5, preview: { bg: '#0d1b2a', text: '#e0f7fa', accent: '#ab47bc' } },
  { id: 'custom', name: 'Custom', minLevel: 2, preview: { bg: '#f5f5f5', text: '#333333', accent: '#ff4081' } },
]

// ============================================================================
// CosmeticSelector — picker for avatar style + editor themes
// ============================================================================

export interface CosmeticSelectorProps {
  /** Current student level */
  level: number
  /** Currently selected theme ID */
  selectedThemeId?: string
  /** Available editor themes (defaults to DEFAULT_EDITOR_THEMES) */
  editorThemes?: EditorTheme[]
  /** Called when theme is selected */
  onThemeSelect?: (themeId: string) => void
  /** Current custom palette (when theme is 'custom') */
  customThemePalette?: CustomThemePaletteInput | null
  /** Called when user saves their custom palette from ThemeMixer */
  onCustomPaletteSave?: (palette: CustomThemePaletteInput) => void
  /** Avatar seed (e.g. username) for preview */
  avatarSeed?: string
  /** Currently selected avatar tier */
  selectedAvatarTier?: AvatarStyleTier
  /** Called when avatar tier is selected */
  onAvatarTierSelect?: (tier: AvatarStyleTier) => void
  /** Current avatar overrides */
  avatarOverrides?: AvatarOverrides
  /** Called when avatar overrides are saved from customizer */
  onAvatarOverridesSave?: (overrides: AvatarOverrides, style: AvatarStyleTier) => void
  /** Optional avatar unlock config from global settings */
  avatarUnlockConfig?: AvatarUnlockConfig | null
}

export function CosmeticSelector({
  level,
  selectedThemeId,
  editorThemes = DEFAULT_EDITOR_THEMES,
  onThemeSelect,
  customThemePalette,
  onCustomPaletteSave,
  avatarSeed = 'student',
  selectedAvatarTier,
  onAvatarTierSelect,
  avatarOverrides,
  onAvatarOverridesSave,
  avatarUnlockConfig,
}: CosmeticSelectorProps) {
  const [customizerOpen, setCustmizerOpen] = useState(false)
  const tierStatuses = getStyleTierStatus(level, avatarUnlockConfig)

  return (
    <Stack spacing={3}>
      {/* Avatar Style Selection */}
      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <FaceIcon sx={{ fontSize: 18 }} /> Avatar Style
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
          {tierStatuses.map(({ tier, unlocked, displayName }) => {
            const selected = selectedAvatarTier === tier
            return (
              <Card
                key={tier}
                variant="outlined"
                sx={{
                  width: 90,
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  opacity: unlocked ? 1 : 0.4,
                  border: selected ? '2px solid' : '1px solid',
                  borderColor: selected ? 'primary.main' : 'divider',
                  transition: 'border-color 0.2s',
                  textAlign: 'center',
                  py: 1,
                }}
                onClick={unlocked ? () => onAvatarTierSelect?.(tier) : undefined}
              >
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                  <DiceBearAvatar seed={avatarSeed} style={tier} size={40} locked={!unlocked} />
                </Box>
                <Typography variant="caption" noWrap>
                  {!unlocked && '🔒 '}{displayName}
                </Typography>
                {selected && <CheckIcon sx={{ fontSize: 12, color: 'primary.main' }} />}
              </Card>
            )
          })}
        </Stack>
        {/* Customization button */}
        {level >= 2 && (
          <Button size="small" variant="outlined" onClick={() => setCustmizerOpen(true)}>
            Customize Avatar
          </Button>
        )}
        <AvatarCustomizer
          open={customizerOpen}
          onClose={() => setCustmizerOpen(false)}
          level={level}
          seed={avatarSeed}
          selectedStyle={selectedAvatarTier}
          overrides={avatarOverrides}
          onSave={(overrides, style) => onAvatarOverridesSave?.(overrides, style)}
          avatarUnlockConfig={avatarUnlockConfig}
        />
      </Box>

      {/* Editor Theme Selection */}
      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PaletteIcon sx={{ fontSize: 18 }} /> Editor Theme
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {editorThemes.map((theme) => {
            const unlocked = level >= theme.minLevel
            const selected = selectedThemeId === theme.id
            return (
              <Card
                key={theme.id}
                variant="outlined"
                sx={{
                  width: 100,
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  opacity: unlocked ? 1 : 0.4,
                  border: selected ? '2px solid' : '1px solid',
                  borderColor: selected ? 'primary.main' : 'divider',
                  transition: 'border-color 0.2s',
                }}
                onClick={unlocked ? () => onThemeSelect?.(theme.id) : undefined}
              >
                <Box
                  sx={{
                    height: 36,
                    bgcolor: theme.preview.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                    px: 1,
                  }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: theme.preview.accent }} />
                  <Box sx={{ flex: 1, height: 3, bgcolor: theme.preview.text, borderRadius: 1, opacity: 0.5 }} />
                </Box>
                <CardContent sx={{ py: '4px !important', px: 1, textAlign: 'center' }}>
                  <Typography variant="caption" noWrap>
                    {!unlocked && '🔒 '}{theme.name}
                  </Typography>
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      </Box>

      {/* Custom Theme Mixer — shown when "Custom" is selected */}
      {selectedThemeId === 'custom' && (
        <Box sx={{ mt: 1 }}>
          <ThemeMixer
            value={customThemePalette}
            onSave={(palette) => onCustomPaletteSave?.(palette)}
          />
        </Box>
      )}
    </Stack>
  )
}

export default CosmeticSelector
