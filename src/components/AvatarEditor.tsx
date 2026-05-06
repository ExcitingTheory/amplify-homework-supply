/**
 * AvatarEditor — Inline DiceBear avatar display with a "Customize" button
 * that opens the AvatarCustomizer dialog.
 *
 * Reads/writes avatar style + overrides to Settings.metadata via SettingsContext.
 *
 * @module AvatarEditor
 */

import React, { useState, useCallback, useRef } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Skeleton from '@mui/material/Skeleton'
import EditIcon from '@mui/icons-material/Edit'
import SettingsContext from '../context/settingsContext'
import { useAvatarConfig } from '../hooks/useAvatarConfig'
import { useXP } from '../context/gamificationContext'
import { DiceBearAvatar } from './Gamification/DiceBearAvatar'
import { AvatarCustomizer } from './Gamification/AvatarCustomizer'
import type { AvatarStyleTier, AvatarOverrides } from './Gamification/DiceBearAvatar'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface AvatarEditorProps {
  /** Avatar seed (defaults to session username from settings) */
  seed?: string
  /** Display size in pixels */
  size?: number
  /** Override level (defaults to useXP level) */
  level?: number
  /** Called after a successful save */
  onSave?: (overrides: AvatarOverrides, style: AvatarStyleTier) => void
}

export function AvatarEditor({ seed, size = 128, level: levelProp, onSave }: AvatarEditorProps) {
  const { settings, updateSettings } = React.useContext(SettingsContext) || {}
  const { style: currentStyle, overrides: savedOverrides, seed: configSeed, isLoaded, glowRing } = useAvatarConfig()
  const { level: xpLevel } = useXP()
  const numericLevel = levelProp ?? xpLevel?.level ?? 1

  const [customizerOpen, setCustomizerOpen] = useState(false)

  // Use a ref for metadata to avoid stale closures — settings can change
  // between when the customizer opens and when the user clicks Save
  const rawMetadata = settings?.metadata
  const metadataRef = useRef<Record<string, unknown>>({})
  metadataRef.current = typeof rawMetadata === 'string'
    ? (() => { try { return JSON.parse(rawMetadata) } catch { return {} } })()
    : (rawMetadata || {}) as Record<string, unknown>

  const avatarSeed = seed || configSeed || 'student'

  // Local optimistic state — used immediately after save so user sees their
  // configured avatar without waiting for the round-trip subscription
  const [localOverrides, setLocalOverrides] = useState<AvatarOverrides | null>(null)
  const [localStyle, setLocalStyle] = useState<AvatarStyleTier | null>(null)

  // Reset local state when settings propagate from backend
  React.useEffect(() => {
    if (localOverrides && savedOverrides && JSON.stringify(localOverrides) === JSON.stringify(savedOverrides)) {
      setLocalOverrides(null)
      setLocalStyle(null)
    }
  }, [savedOverrides, localOverrides])

  const displayStyle = localStyle || currentStyle
  const displayOverrides = localOverrides || savedOverrides

  const handleSave = useCallback(async (overrides: AvatarOverrides, style: AvatarStyleTier) => {
    // Optimistic update — show the new avatar immediately
    setLocalOverrides(overrides)
    setLocalStyle(style)

    if (updateSettings) {
      try {
        await updateSettings({
          metadata: { ...metadataRef.current, avatarStyle: style, avatarOverrides: overrides },
        })
      } catch (err) {
        console.error('[AvatarEditor] save error:', err)
        // Revert optimistic update on failure
        setLocalOverrides(null)
        setLocalStyle(null)
      }
    }
    onSave?.(overrides, style)
  }, [updateSettings, onSave])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 2 }}>
      {!isLoaded ? (
        <Skeleton variant="circular" width={size} height={size} />
      ) : (
        <DiceBearAvatar
          seed={avatarSeed}
          style={displayStyle}
          size={size}
          overrides={displayOverrides}
          glowRing={glowRing}
          onClick={() => setCustomizerOpen(true)}
        />
      )}
      <Button
        variant="outlined"
        size="small"
        startIcon={<EditIcon />}
        onClick={() => setCustomizerOpen(true)}
      >
        Customize Avatar
      </Button>
      <AvatarCustomizer
        open={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        level={numericLevel}
        seed={avatarSeed}
        selectedStyle={displayStyle}
        overrides={displayOverrides}
        onSave={handleSave}
      />
    </Box>
  )
}

export default AvatarEditor
