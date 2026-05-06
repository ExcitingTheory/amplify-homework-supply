/**
 * AvatarUnlockEditor — Instructor UI for configuring which DiceBear avatar
 * styles unlock at which student levels.
 *
 * Shows a preview of each style with a level number input. Instructors can
 * add/remove styles and reorder the unlock schedule.
 *
 * @module AvatarUnlockEditor
 */

import React, { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import SaveIcon from '@mui/icons-material/Save'
import RestoreIcon from '@mui/icons-material/Restore'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'

import { DiceBearAvatar } from './DiceBearAvatar'
import {
  ALL_AVATAR_STYLES,
  STYLE_CONFIG,
} from './DiceBearAvatar'
import type { AvatarStyleTier, AvatarUnlockConfig, AvatarUnlockEntry, FeatureUnlockLevels } from './DiceBearAvatar'

// ============================================================================
// Types
// ============================================================================

export interface AvatarUnlockEditorProps {
  /** Current config (from section's xpConfig.avatarUnlocks) */
  config?: AvatarUnlockConfig | null
  /** Called when instructor saves changes */
  onSave: (config: AvatarUnlockConfig) => void
  /** Optional section name for display */
  sectionName?: string
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_UNLOCKS: AvatarUnlockEntry[] = [
  { minLevel: 1, tier: 'simple' },
  { minLevel: 2, tier: 'detailed' },
  { minLevel: 3, tier: 'toonhead' },
]

// ============================================================================
// Component
// ============================================================================

export function AvatarUnlockEditor({ config, onSave, sectionName }: AvatarUnlockEditorProps) {
  const [unlocks, setUnlocks] = useState<AvatarUnlockEntry[]>(
    () => config?.unlocks?.length ? [...config.unlocks].sort((a, b) => a.minLevel - b.minLevel) : DEFAULT_UNLOCKS,
  )
  const [glowOnLevelUp, setGlowOnLevelUp] = useState(config?.glowOnLevelUp ?? true)
  const [featureUnlockLevels, setFeatureUnlockLevels] = useState<FeatureUnlockLevels>(
    () => config?.featureUnlockLevels ?? { hairAndClothing: 2, accessories: 3 },
  )
  const [dirty, setDirty] = useState(false)

  // First style start level — only this is manually editable
  const [startLevel, setStartLevel] = useState<number>(
    () => unlocks.length > 0 ? unlocks[0].minLevel : 1,
  )

  const usedStyles = new Set(unlocks.map((u) => u.tier))
  const availableStyles = ALL_AVATAR_STYLES.filter((s) => !usedStyles.has(s))

  // Compute cascaded levels: each style starts after the previous style's accessories unlock
  const hairOffset = featureUnlockLevels.hairAndClothing ?? 2
  const accOffset = featureUnlockLevels.accessories ?? 3
  const computedUnlocks: AvatarUnlockEntry[] = []
  for (let i = 0; i < unlocks.length; i++) {
    if (i === 0) {
      computedUnlocks.push({ ...unlocks[i], minLevel: startLevel })
    } else {
      const prevStart = computedUnlocks[i - 1].minLevel
      computedUnlocks.push({ ...unlocks[i], minLevel: prevStart + accOffset + 1 })
    }
  }

  const handleStyleChange = useCallback((index: number, tier: AvatarStyleTier) => {
    setUnlocks((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], tier }
      return next
    })
    setDirty(true)
  }, [])

  const handleAdd = useCallback(() => {
    if (availableStyles.length === 0) return
    setUnlocks((prev) => [...prev, { minLevel: 0, tier: availableStyles[0] }])
    setDirty(true)
  }, [availableStyles])

  const handleRemove = useCallback((index: number) => {
    setUnlocks((prev) => prev.filter((_, i) => i !== index))
    setDirty(true)
  }, [])

  const handleReset = useCallback(() => {
    setUnlocks(DEFAULT_UNLOCKS)
    setStartLevel(1)
    setGlowOnLevelUp(true)
    setFeatureUnlockLevels({ hairAndClothing: 2, accessories: 3 })
    setDirty(true)
  }, [])

  const handleSave = useCallback(() => {
    // Save with computed levels
    onSave({ unlocks: computedUnlocks, glowOnLevelUp, featureUnlockLevels })
    setDirty(false)
  }, [computedUnlocks, glowOnLevelUp, featureUnlockLevels, onSave])

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Avatar Style Unlocks
        {sectionName && (
          <Chip label={sectionName} size="small" sx={{ ml: 1 }} variant="outlined" />
        )}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Each avatar style unlocks progressively. The next style begins after the previous
        style&apos;s full customization is complete. Only the starting level needs to be set —
        everything else cascades automatically from the offsets below.
      </Typography>

      {/* Starting level input */}
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Starting Level"
          type="number"
          size="small"
          value={startLevel}
          onChange={(e) => {
            setStartLevel(Math.max(1, parseInt(e.target.value, 10) || 1))
            setDirty(true)
          }}
          inputProps={{ min: 1, max: 20 }}
          helperText="Level at which the first avatar style unlocks"
          sx={{ width: 140 }}
        />
      </Box>

      <Stack spacing={1}>
        {computedUnlocks.flatMap((entry, index) => {
          const styleStart = entry.minLevel
          const hairLevel = styleStart + hairOffset
          const accLevel = styleStart + accOffset
          const styleName = STYLE_CONFIG[entry.tier]?.displayName ?? entry.tier

          return [
            // Colors & Face card
            <Paper
              key={`${entry.tier}-${index}-colors`}
              variant="outlined"
              sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <DiceBearAvatar seed="preview-student" size={40} style={entry.tier} />
              <Chip size="small" label={`Level ${styleStart}`} color="success" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {styleName} — Colors &amp; Face
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Background, skin tone, eyebrows, eyes, mouth
                </Typography>
              </Box>
              {/* Style selector on first phase only */}
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Style</InputLabel>
                <Select
                  value={entry.tier}
                  label="Style"
                  onChange={(e) => handleStyleChange(index, e.target.value as AvatarStyleTier)}
                >
                  <MenuItem value={entry.tier}>{styleName}</MenuItem>
                  {availableStyles.map((s) => (
                    <MenuItem key={s} value={s}>
                      {STYLE_CONFIG[s]?.displayName ?? s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Tooltip title="Remove this style">
                <span>
                  <IconButton size="small" onClick={() => handleRemove(index)} disabled={unlocks.length <= 1}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Paper>,

            // Hair & Clothing card
            <Paper
              key={`${entry.tier}-${index}-hair`}
              variant="outlined"
              sx={{ p: 1.5, pl: 4, display: 'flex', alignItems: 'center', gap: 2, borderLeft: '3px solid', borderLeftColor: 'primary.main' }}
            >
              <Chip size="small" label={`Level ${hairLevel}`} color="primary" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {styleName} — Hair &amp; Clothing
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Hair color, clothes color, hair/top, clothing
                </Typography>
              </Box>
            </Paper>,

            // Accessories card
            <Paper
              key={`${entry.tier}-${index}-acc`}
              variant="outlined"
              sx={{ p: 1.5, pl: 4, display: 'flex', alignItems: 'center', gap: 2, borderLeft: '3px solid', borderLeftColor: 'secondary.main', mb: index < computedUnlocks.length - 1 ? 2 : 0 }}
            >
              <Chip size="small" label={`Level ${accLevel}`} color="secondary" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {styleName} — Accessories
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Facial hair, accessories, extras
                </Typography>
              </Box>
            </Paper>,
          ]
        })}
      </Stack>

      {/* Add new unlock */}
      {availableStyles.length > 0 && (
        <Button
          startIcon={<AddIcon />}
          onClick={handleAdd}
          size="small"
          sx={{ mt: 1.5 }}
        >
          Add Style Unlock ({availableStyles.length} available)
        </Button>
      )}

      {/* Glow ring toggle */}
      <Box sx={{ mt: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={glowOnLevelUp}
              onChange={(_, checked) => {
                setGlowOnLevelUp(checked)
                setDirty(true)
              }}
            />
          }
          label="Enable glow ring powerup on level-up (24hr)"
        />
      </Box>

      {/* Feature unlock levels */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Customization Feature Unlock Offsets
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          Colors (background, skin tone) and basic face features are always available when a style is unlocked.
          These offsets control how many levels after unlocking a style the additional customizations become available.
          For example, if a style unlocks at Level 3 and the offset is +2, hair/clothing unlocks at Level 5.
        </Typography>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Hair & Clothing offset"
            type="number"
            size="small"
            value={featureUnlockLevels.hairAndClothing ?? 2}
            onChange={(e) => {
              setFeatureUnlockLevels((prev) => ({
                ...prev,
                hairAndClothing: Math.max(1, parseInt(e.target.value, 10) || 2),
              }))
              setDirty(true)
            }}
            inputProps={{ min: 1, max: 20 }}
            helperText="+N levels: hair color, clothes color, hair/top, clothing"
            sx={{ width: 220 }}
          />
          <TextField
            label="Accessories offset"
            type="number"
            size="small"
            value={featureUnlockLevels.accessories ?? 3}
            onChange={(e) => {
              setFeatureUnlockLevels((prev) => ({
                ...prev,
                accessories: Math.max(1, parseInt(e.target.value, 10) || 3),
              }))
              setDirty(true)
            }}
            inputProps={{ min: 1, max: 20 }}
            helperText="+N levels: facial hair, accessories, extras"
            sx={{ width: 220 }}
          />
        </Stack>
      </Box>

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

export default AvatarUnlockEditor
