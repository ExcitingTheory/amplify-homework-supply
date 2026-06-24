/**
 * ThemeUnlockEditor — Instructor UI for configuring which editor themes
 * unlock at which student levels.
 *
 * Shows each theme with a level number input. Instructors can customize
 * the minimum level required for each cosmetic theme.
 *
 * @module ThemeUnlockEditor
 */

import React, { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import SaveIcon from '@mui/icons-material/Save'
import RestoreIcon from '@mui/icons-material/Restore'

// ============================================================================
// Types
// ============================================================================

/** A single theme → minimum level mapping */
export interface ThemeUnlockEntry {
  themeId: string
  minLevel: number
}

/** Instructor-configurable theme unlock schedule */
export interface ThemeUnlockConfig {
  unlocks: ThemeUnlockEntry[]
}

export interface ThemeUnlockEditorProps {
  /** Current config (from PlatformSettings) */
  config?: ThemeUnlockConfig | null
  /** Called when instructor saves changes */
  onSave: (config: ThemeUnlockConfig) => void
  /** Optional section name for display */
  sectionName?: string
}

// ============================================================================
// Defaults — match CosmeticSelector's DEFAULT_EDITOR_THEMES
// ============================================================================

const DEFAULT_THEME_UNLOCKS: ThemeUnlockEntry[] = [
  { themeId: 'default', minLevel: 1 },
  { themeId: 'midnight', minLevel: 2 },
  { themeId: 'forest', minLevel: 3 },
  { themeId: 'sunset', minLevel: 4 },
  { themeId: 'aurora', minLevel: 5 },
  { themeId: 'custom', minLevel: 2 },
]

const THEME_DISPLAY_NAMES: Record<string, string> = {
  default: 'Default',
  midnight: 'Midnight',
  forest: 'Forest',
  sunset: 'Sunset',
  aurora: 'Aurora',
  custom: 'Custom (User-mixed)',
}

const THEME_COLORS: Record<string, { bg: string; accent: string }> = {
  default: { bg: '#ffffff', accent: '#1976d2' },
  midnight: { bg: '#1a1a2e', accent: '#00bcd4' },
  forest: { bg: '#1b2d1b', accent: '#66bb6a' },
  sunset: { bg: '#2d1b1b', accent: '#ff7043' },
  aurora: { bg: '#0d1b2a', accent: '#ab47bc' },
  custom: { bg: '#f5f5f5', accent: '#ff4081' },
}

// ============================================================================
// Component
// ============================================================================

export function ThemeUnlockEditor({ config, onSave, sectionName }: ThemeUnlockEditorProps) {
  const [unlocks, setUnlocks] = useState<ThemeUnlockEntry[]>(
    () => config?.unlocks?.length
      ? [...config.unlocks].sort((a, b) => a.minLevel - b.minLevel)
      : DEFAULT_THEME_UNLOCKS,
  )
  const [dirty, setDirty] = useState(false)

  const handleLevelChange = useCallback((themeId: string, newLevel: number) => {
    setUnlocks((prev) =>
      prev.map((entry) =>
        entry.themeId === themeId
          ? { ...entry, minLevel: Math.max(1, newLevel) }
          : entry,
      ),
    )
    setDirty(true)
  }, [])

  const handleReset = useCallback(() => {
    setUnlocks(DEFAULT_THEME_UNLOCKS)
    setDirty(true)
  }, [])

  const handleSave = useCallback(() => {
    onSave({ unlocks })
    setDirty(false)
  }, [unlocks, onSave])

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Theme Unlock Levels
        {sectionName && (
          <Chip label={sectionName} size="small" sx={{ ml: 1 }} variant="outlined" />
        )}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Configure the minimum student level required to unlock each cosmetic theme.
        The &quot;Default&quot; theme is always available. The &quot;Custom&quot; option
        lets students mix their own colors once unlocked.
      </Typography>

      <Stack spacing={1}>
        {unlocks.map((entry) => {
          const colors = THEME_COLORS[entry.themeId] || { bg: '#ccc', accent: '#666' }
          const name = THEME_DISPLAY_NAMES[entry.themeId] || entry.themeId
          const isDefault = entry.themeId === 'default'

          return (
            <Paper
              key={entry.themeId}
              variant="outlined"
              sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}
            >
              {/* Theme color preview */}
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  bgcolor: colors.bg,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: colors.accent }} />
              </Box>

              {/* Theme name */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>{name}</Typography>
              </Box>

              {/* Level input */}
              <TextField
                size="small"
                type="number"
                label="Min Level"
                value={entry.minLevel}
                onChange={(e) => handleLevelChange(entry.themeId, parseInt(e.target.value, 10) || 1)}
                disabled={isDefault}
                inputProps={{ min: 1, max: 20 }}
                sx={{ width: 100 }}
              />

              {/* Current level chip */}
              <Chip
                size="small"
                label={isDefault ? 'Always' : `Lvl ${entry.minLevel}`}
                color={isDefault ? 'success' : 'default'}
                variant="outlined"
              />
            </Paper>
          )
        })}
      </Stack>

      {/* Action buttons */}
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!dirty}
          size="small"
        >
          Save
        </Button>
        <Button
          variant="outlined"
          startIcon={<RestoreIcon />}
          onClick={handleReset}
          size="small"
        >
          Reset to Defaults
        </Button>
      </Box>
    </Box>
  )
}

export default ThemeUnlockEditor
