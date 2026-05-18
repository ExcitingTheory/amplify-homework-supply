/**
 * AvatarCustomizer — Progressive customization dialog for DiceBear avatars.
 * Unlocks features based on student level:
 *   L1: Background color, skin tone, basic face (eyebrows, eyes, mouth)
 *   L2: + hair color, clothes color, hair/top, clothing
 *   L3: + facial hair, accessories, full toon head features, style selector
 *
 * Color customization is ALWAYS available from L1. Detail features unlock
 * progressively within each style.
 *
 * Options are limited to the documented DiceBear API for each style.
 *
 * @module AvatarCustomizer
 */

import React, { useState, useMemo, useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import LockIcon from '@mui/icons-material/Lock'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import { DiceBearAvatar, getUnlockedStyleTier, getUnlockedStyles, STYLE_CONFIG } from './DiceBearAvatar'
import type { AvatarStyleTier, AvatarOverrides, AvatarUnlockConfig, FeatureUnlockLevels } from './DiceBearAvatar'
import { GLOW_COLOR_PRESETS, DEFAULT_GLOW_COLORS } from './AvatarGlowRing'
import type { GlowRingConfig } from './AvatarGlowRing'

// ============================================================================
// Types
// ============================================================================

export interface AvatarCustomizerProps {
  /** Whether the dialog is open */
  open: boolean
  /** Close callback */
  onClose: () => void
  /** Current student level */
  level: number
  /** Avatar seed (username or studentId) */
  seed: string
  /** Currently selected style */
  selectedStyle?: AvatarStyleTier
  /** Current overrides (persisted in settings) */
  overrides?: AvatarOverrides
  /** Called when overrides change — parent persists to Settings.metadata */
  onSave: (overrides: AvatarOverrides, style: AvatarStyleTier, glowRing?: GlowRingConfig | null) => void
  /** Full avatar unlock config (from section xpConfig) — used for relative feature unlock calculation */
  avatarUnlockConfig?: AvatarUnlockConfig | null
  /** Current glow ring config */
  glowRing?: GlowRingConfig | null
}

// ============================================================================
// Documented option constants (from DiceBear v9.x docs)
// ============================================================================

const BACKGROUND_COLORS = [
  'b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf',
  'd1f4d1', 'fff3b0', 'f0f0f0',
]

// -- Avataaars Neutral (simple) --
const NEUTRAL_EYEBROWS = [
  { id: 'angry', label: 'Angry' },
  { id: 'angryNatural', label: 'Angry Natural' },
  { id: 'default', label: 'Default' },
  { id: 'defaultNatural', label: 'Default Natural' },
  { id: 'flatNatural', label: 'Flat Natural' },
  { id: 'frownNatural', label: 'Frown Natural' },
  { id: 'raisedExcited', label: 'Raised Excited' },
  { id: 'raisedExcitedNatural', label: 'Raised Excited Natural' },
  { id: 'sadConcerned', label: 'Sad Concerned' },
  { id: 'sadConcernedNatural', label: 'Sad Concerned Natural' },
  { id: 'unibrowNatural', label: 'Unibrow Natural' },
  { id: 'upDown', label: 'Up Down' },
  { id: 'upDownNatural', label: 'Up Down Natural' },
]

const NEUTRAL_EYES = [
  { id: 'closed', label: 'Closed' },
  { id: 'cry', label: 'Cry' },
  { id: 'default', label: 'Default' },
  { id: 'eyeRoll', label: 'Eye Roll' },
  { id: 'happy', label: 'Happy' },
  { id: 'hearts', label: 'Hearts' },
  { id: 'side', label: 'Side' },
  { id: 'squint', label: 'Squint' },
  { id: 'surprised', label: 'Surprised' },
  { id: 'wink', label: 'Wink' },
  { id: 'winkWacky', label: 'Wink Wacky' },
  { id: 'xDizzy', label: 'X Dizzy' },
]

const NEUTRAL_MOUTH = [
  { id: 'concerned', label: 'Concerned' },
  { id: 'default', label: 'Default' },
  { id: 'disbelief', label: 'Disbelief' },
  { id: 'eating', label: 'Eating' },
  { id: 'grimace', label: 'Grimace' },
  { id: 'sad', label: 'Sad' },
  { id: 'screamOpen', label: 'Scream' },
  { id: 'serious', label: 'Serious' },
  { id: 'smile', label: 'Smile' },
  { id: 'tongue', label: 'Tongue' },
  { id: 'twinkle', label: 'Twinkle' },
  { id: 'vomit', label: 'Vomit' },
]

// -- Avataaars (detailed) — same face options + clothing/hair/accessories --
const DETAILED_SKIN_COLORS = [
  '614335', 'ae5d29', 'd08b5b', 'edb98a', 'f8d25c', 'fd9841', 'ffdbb4',
]

const DETAILED_HAIR_COLORS = [
  '2c1b18', '4a312c', '724133', 'a55728', 'b58143', 'c93305', 'd6b370',
  'e8e1e1', 'ecdcbf', 'f59797',
]

const DETAILED_CLOTHES_COLORS = [
  '3c4f5c', '65c9ff', '262e33', '5199e4', '25557c', '929598',
  'a7ffc4', 'b1e2ff', 'e6e6e6', 'ff5c5c', 'ff488e', 'ffafb9',
  'ffdeb5', 'ffffb1', 'ffffff',
]

const DETAILED_TOP = [
  { id: 'bigHair', label: 'Big Hair' },
  { id: 'bob', label: 'Bob' },
  { id: 'bun', label: 'Bun' },
  { id: 'curly', label: 'Curly' },
  { id: 'curvy', label: 'Curvy' },
  { id: 'dreads', label: 'Dreads' },
  { id: 'dreads01', label: 'Dreads 01' },
  { id: 'dreads02', label: 'Dreads 02' },
  { id: 'frida', label: 'Frida' },
  { id: 'frizzle', label: 'Frizzle' },
  { id: 'fro', label: 'Fro' },
  { id: 'froBand', label: 'Fro Band' },
  { id: 'hat', label: 'Hat' },
  { id: 'hijab', label: 'Hijab' },
  { id: 'longButNotTooLong', label: 'Long' },
  { id: 'miaWallace', label: 'Mia Wallace' },
  { id: 'shaggy', label: 'Shaggy' },
  { id: 'shaggyMullet', label: 'Shaggy Mullet' },
  { id: 'shavedSides', label: 'Shaved Sides' },
  { id: 'shortCurly', label: 'Short Curly' },
  { id: 'shortFlat', label: 'Short Flat' },
  { id: 'shortRound', label: 'Short Round' },
  { id: 'shortWaved', label: 'Short Waved' },
  { id: 'sides', label: 'Sides' },
  { id: 'straight01', label: 'Straight 01' },
  { id: 'straight02', label: 'Straight 02' },
  { id: 'straightAndStrand', label: 'Straight & Strand' },
  { id: 'theCaesar', label: 'The Caesar' },
  { id: 'theCaesarAndSidePart', label: 'Caesar & Side Part' },
  { id: 'turban', label: 'Turban' },
  { id: 'winterHat1', label: 'Winter Hat 1' },
  { id: 'winterHat02', label: 'Winter Hat 2' },
  { id: 'winterHat03', label: 'Winter Hat 3' },
  { id: 'winterHat04', label: 'Winter Hat 4' },
]

const DETAILED_CLOTHING = [
  { id: 'blazerAndShirt', label: 'Blazer & Shirt' },
  { id: 'blazerAndSweater', label: 'Blazer & Sweater' },
  { id: 'collarAndSweater', label: 'Collar & Sweater' },
  { id: 'graphicShirt', label: 'Graphic Shirt' },
  { id: 'hoodie', label: 'Hoodie' },
  { id: 'overall', label: 'Overall' },
  { id: 'shirtCrewNeck', label: 'Crew Neck' },
  { id: 'shirtScoopNeck', label: 'Scoop Neck' },
  { id: 'shirtVNeck', label: 'V-Neck' },
]

const DETAILED_FACIAL_HAIR = [
  { id: 'beardLight', label: 'Light Beard' },
  { id: 'beardMajestic', label: 'Majestic Beard' },
  { id: 'beardMedium', label: 'Medium Beard' },
  { id: 'moustacheFancy', label: 'Fancy Moustache' },
  { id: 'moustacheMagnum', label: 'Magnum Moustache' },
]

const DETAILED_ACCESSORIES = [
  { id: 'eyepatch', label: 'Eyepatch' },
  { id: 'kurt', label: 'Kurt' },
  { id: 'prescription01', label: 'Glasses 01' },
  { id: 'prescription02', label: 'Glasses 02' },
  { id: 'round', label: 'Round Glasses' },
  { id: 'sunglasses', label: 'Sunglasses' },
  { id: 'wayfarers', label: 'Wayfarers' },
]

// -- Toon Head --
const TOONHEAD_SKIN_COLORS = [
  '5c3829', 'a36b4f', 'b98e6a', 'c68e7a', 'f1c3a5',
]

const TOONHEAD_HAIR_COLORS = [
  '2c1b18', '724133', 'a55728', 'b58143', 'd6b370',
]

const TOONHEAD_CLOTHES_COLORS = [
  '0b3286', '147f3c', '731ac3', '151613', '545454',
  'b11f1f', 'e8e9e6', 'eab308', 'ec4899', 'f97316',
]

const TOONHEAD_EYEBROWS = [
  { id: 'angry', label: 'Angry' },
  { id: 'happy', label: 'Happy' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'raised', label: 'Raised' },
  { id: 'sad', label: 'Sad' },
]

const TOONHEAD_EYES = [
  { id: 'bow', label: 'Bow' },
  { id: 'happy', label: 'Happy' },
  { id: 'humble', label: 'Humble' },
  { id: 'wide', label: 'Wide' },
  { id: 'wink', label: 'Wink' },
]

const TOONHEAD_HAIR = [
  { id: 'bun', label: 'Bun' },
  { id: 'sideComed', label: 'Side Combed' },
  { id: 'spiky', label: 'Spiky' },
  { id: 'undercut', label: 'Undercut' },
]

const TOONHEAD_MOUTH = [
  { id: 'agape', label: 'Agape' },
  { id: 'angry', label: 'Angry' },
  { id: 'laugh', label: 'Laugh' },
  { id: 'sad', label: 'Sad' },
  { id: 'smile', label: 'Smile' },
]

const TOONHEAD_BEARD = [
  { id: 'chin', label: 'Chin' },
  { id: 'chinMoustache', label: 'Chin + Moustache' },
  { id: 'fullBeard', label: 'Full Beard' },
  { id: 'longBeard', label: 'Long Beard' },
  { id: 'moustacheTwirl', label: 'Moustache Twirl' },
]

const TOONHEAD_CLOTHES = [
  { id: 'dress', label: 'Dress' },
  { id: 'openJacket', label: 'Open Jacket' },
  { id: 'shirt', label: 'Shirt' },
  { id: 'tShirt', label: 'T-Shirt' },
  { id: 'turtleNeck', label: 'Turtleneck' },
]

const TOONHEAD_REAR_HAIR = [
  { id: 'longStraight', label: 'Long Straight' },
  { id: 'longWavy', label: 'Long Wavy' },
  { id: 'neckHigh', label: 'Neck High' },
  { id: 'shoulderHigh', label: 'Shoulder High' },
]

// ============================================================================
// Sub-components
// ============================================================================

function ColorPalette({
  colors,
  selected,
  onSelect,
  label,
}: {
  colors: string[]
  selected?: string
  onSelect: (color: string) => void
  label: string
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
        {colors.map((color) => (
          <Box
            key={color}
            onClick={() => onSelect(color)}
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: `#${color}`,
              cursor: 'pointer',
              border: selected === color ? '3px solid' : '2px solid transparent',
              borderColor: selected === color ? 'primary.main' : 'transparent',
              outline: '1px solid rgba(0,0,0,0.1)',
              transition: 'border-color 0.15s',
              '&:hover': { transform: 'scale(1.15)' },
            }}
          />
        ))}
      </Stack>
    </Box>
  )
}

function OptionGrid({
  options,
  selected,
  onSelect,
  label,
}: {
  options: Array<{ id: string; label: string }>
  selected?: string[]
  onSelect: (id: string) => void
  label: string
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
        <Chip
          label="Random"
          size="small"
          variant={!selected || selected.length === 0 ? 'filled' : 'outlined'}
          color={!selected || selected.length === 0 ? 'primary' : 'default'}
          onClick={() => onSelect('')}
        />
        {options.map((opt) => (
          <Chip
            key={opt.id}
            label={opt.label}
            size="small"
            variant={selected?.includes(opt.id) ? 'filled' : 'outlined'}
            color={selected?.includes(opt.id) ? 'primary' : 'default'}
            onClick={() => onSelect(opt.id)}
          />
        ))}
      </Stack>
    </Box>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function AvatarCustomizer({
  open,
  onClose,
  level,
  seed,
  selectedStyle,
  overrides = {},
  onSave,
  avatarUnlockConfig,
  glowRing,
}: AvatarCustomizerProps) {
  const highestTier = useMemo(() => getUnlockedStyleTier(level, avatarUnlockConfig), [level, avatarUnlockConfig])
  const unlockedStyles = useMemo(() => getUnlockedStyles(level, avatarUnlockConfig), [level, avatarUnlockConfig])

  const [style, setStyle] = useState<AvatarStyleTier>(selectedStyle || highestTier)
  const [draft, setDraft] = useState<AvatarOverrides>(overrides)
  const [glowDraft, setGlowDraft] = useState<GlowRingConfig | null>(glowRing ?? null)

  // Reset draft when dialog opens with new overrides
  React.useEffect(() => {
    if (open) {
      setDraft(overrides)
      setStyle(selectedStyle || highestTier)
      setGlowDraft(glowRing ?? null)
    }
  }, [open, overrides, selectedStyle, highestTier, glowRing])

  const handleColorSelect = useCallback((field: keyof AvatarOverrides, color: string) => {
    setDraft((prev) => ({ ...prev, [field]: [color] }))
  }, [])

  const handleOptionSelect = useCallback((field: string, id: string) => {
    setDraft((prev) => {
      if (!id) {
        const next = { ...prev }
        delete (next as any)[field]
        if (field === 'facialHair') delete next.facialHairProbability
        if (field === 'beard') delete next.beardProbability
        if (field === 'rearHair') delete next.rearHairProbability
        if (field === 'accessories') delete next.accessoriesProbability
        return next
      }
      return {
        ...prev,
        [field]: [id],
        ...(field === 'facialHair' ? { facialHairProbability: 100 } : {}),
        ...(field === 'beard' ? { beardProbability: 100 } : {}),
        ...(field === 'rearHair' ? { rearHairProbability: 100 } : {}),
        ...(field === 'accessories' ? { accessoriesProbability: 100 } : {}),
      }
    })
  }, [])

  const handleReset = useCallback(() => {
    setDraft({})
  }, [])

  const handleSave = useCallback(() => {
    onSave(draft, style, glowDraft)
    onClose()
  }, [draft, style, glowDraft, onSave, onClose])

  // Progressive feature gates — relative to the selected style's unlock level
  // e.g., if style unlocks at L3 and offset is 2, hair/clothing requires L5
  const styleMinLevel = useMemo(() => {
    const unlocks = avatarUnlockConfig?.unlocks
    if (!unlocks?.length) return 1
    const entry = unlocks.find((e) => e.tier === style)
    return entry?.minLevel ?? 1
  }, [avatarUnlockConfig, style])

  const hairClothesOffset = avatarUnlockConfig?.featureUnlockLevels?.hairAndClothing ?? 2
  const accessoriesOffset = avatarUnlockConfig?.featureUnlockLevels?.accessories ?? 3
  const hairClothesLevel = styleMinLevel + hairClothesOffset
  const accessoriesLevel = styleMinLevel + accessoriesOffset
  const canCustomizeHairClothes = level >= hairClothesLevel
  const canCustomizeAccessories = level >= accessoriesLevel

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Customize Avatar
        <Tooltip title="Reset to random">
          <IconButton onClick={handleReset} size="small">
            <RestartAltIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Live preview */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <DiceBearAvatar seed={seed} style={style} size={96} overrides={draft} glowRing={glowDraft} />
          </Box>

          {/* Style selector — show when multiple styles unlocked */}
          {unlockedStyles.length > 1 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Avatar Style
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {(['simple', 'detailed', 'toonhead'] as AvatarStyleTier[]).map((tier) => {
                  const isUnlocked = unlockedStyles.includes(tier)
                  return (
                    <Chip
                      key={tier}
                      label={STYLE_CONFIG[tier].displayName}
                      size="small"
                      variant={style === tier ? 'filled' : 'outlined'}
                      color={style === tier ? 'primary' : 'default'}
                      disabled={!isUnlocked}
                      icon={!isUnlocked ? <LockIcon sx={{ fontSize: 14 }} /> : undefined}
                      onClick={() => isUnlocked && setStyle(tier)}
                    />
                  )
                })}
              </Stack>
            </Box>
          )}

          {/* ── Simple (avataaars-neutral): colors always, face features always ── */}
          {style === 'simple' && (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Colors</Typography>
              <ColorPalette
                colors={BACKGROUND_COLORS}
                selected={draft.backgroundColor?.[0]}
                onSelect={(c) => handleColorSelect('backgroundColor', c)}
                label="Background"
              />
              <ColorPalette
                colors={DETAILED_SKIN_COLORS}
                selected={draft.skinColor?.[0]}
                onSelect={(c) => handleColorSelect('skinColor', c)}
                label="Skin Tone"
              />

              <Typography variant="subtitle2" sx={{ mt: 1 }}>Face</Typography>
              <OptionGrid
                options={NEUTRAL_EYEBROWS}
                selected={draft.eyebrows}
                onSelect={(id) => handleOptionSelect('eyebrows', id)}
                label="Eyebrows"
              />
              <OptionGrid
                options={NEUTRAL_EYES}
                selected={draft.eyes}
                onSelect={(id) => handleOptionSelect('eyes', id)}
                label="Eyes"
              />
              <OptionGrid
                options={NEUTRAL_MOUTH}
                selected={draft.mouth}
                onSelect={(id) => handleOptionSelect('mouth', id)}
                label="Mouth"
              />
              {!canCustomizeHairClothes && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <LockIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  Reach Level {hairClothesLevel} to unlock hair, clothing, and more color options
                </Typography>
              )}
            </Stack>
          )}

          {/* ── Detailed (avataaars): colors always, features gated progressively ── */}
          {style === 'detailed' && (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Colors</Typography>
              <ColorPalette
                colors={BACKGROUND_COLORS}
                selected={draft.backgroundColor?.[0]}
                onSelect={(c) => handleColorSelect('backgroundColor', c)}
                label="Background"
              />
              <ColorPalette
                colors={DETAILED_SKIN_COLORS}
                selected={draft.skinColor?.[0]}
                onSelect={(c) => handleColorSelect('skinColor', c)}
                label="Skin Tone"
              />
              {canCustomizeHairClothes && (
                <>
                  <ColorPalette
                    colors={DETAILED_HAIR_COLORS}
                    selected={draft.hairColor?.[0]}
                    onSelect={(c) => handleColorSelect('hairColor', c)}
                    label="Hair Color"
                  />
                  <ColorPalette
                    colors={DETAILED_CLOTHES_COLORS}
                    selected={(draft.clothesColor?.[0]) as string | undefined}
                    onSelect={(c) => handleColorSelect('clothesColor', c)}
                    label="Clothes Color"
                  />
                </>
              )}

              <Typography variant="subtitle2" sx={{ mt: 1 }}>Face</Typography>
              <OptionGrid
                options={NEUTRAL_EYEBROWS}
                selected={draft.eyebrows}
                onSelect={(id) => handleOptionSelect('eyebrows', id)}
                label="Eyebrows"
              />
              <OptionGrid
                options={NEUTRAL_EYES}
                selected={draft.eyes}
                onSelect={(id) => handleOptionSelect('eyes', id)}
                label="Eyes"
              />
              <OptionGrid
                options={NEUTRAL_MOUTH}
                selected={draft.mouth}
                onSelect={(id) => handleOptionSelect('mouth', id)}
                label="Mouth"
              />

              {canCustomizeHairClothes && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>Hair &amp; Clothing</Typography>
                  <OptionGrid
                    options={DETAILED_TOP}
                    selected={draft.top}
                    onSelect={(id) => handleOptionSelect('top', id)}
                    label="Hair / Top"
                  />
                  <OptionGrid
                    options={DETAILED_CLOTHING}
                    selected={draft.clothing}
                    onSelect={(id) => handleOptionSelect('clothing', id)}
                    label="Clothing"
                  />
                </>
              )}

              {canCustomizeAccessories && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>Accessories &amp; Extras</Typography>
                  <OptionGrid
                    options={DETAILED_FACIAL_HAIR}
                    selected={draft.facialHair}
                    onSelect={(id) => handleOptionSelect('facialHair', id)}
                    label="Facial Hair"
                  />
                  <OptionGrid
                    options={DETAILED_ACCESSORIES}
                    selected={draft.accessories}
                    onSelect={(id) => handleOptionSelect('accessories', id)}
                    label="Accessories"
                  />
                </>
              )}

              {!canCustomizeHairClothes && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <LockIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  Reach Level {hairClothesLevel} to unlock hair, clothing, and more colors
                </Typography>
              )}
              {canCustomizeHairClothes && !canCustomizeAccessories && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <LockIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  Reach Level {accessoriesLevel} to unlock facial hair and accessories
                </Typography>
              )}
            </Stack>
          )}

          {/* ── Toon Head: colors always, detail features progressive ── */}
          {style === 'toonhead' && (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Colors</Typography>
              <ColorPalette
                colors={BACKGROUND_COLORS}
                selected={draft.backgroundColor?.[0]}
                onSelect={(c) => handleColorSelect('backgroundColor', c)}
                label="Background"
              />
              <ColorPalette
                colors={TOONHEAD_SKIN_COLORS}
                selected={draft.skinColor?.[0]}
                onSelect={(c) => handleColorSelect('skinColor', c)}
                label="Skin Tone"
              />
              <ColorPalette
                colors={TOONHEAD_HAIR_COLORS}
                selected={draft.hairColor?.[0]}
                onSelect={(c) => handleColorSelect('hairColor', c)}
                label="Hair Color"
              />
              <ColorPalette
                colors={TOONHEAD_CLOTHES_COLORS}
                selected={(draft.clothesColor as string[] | undefined)?.[0]}
                onSelect={(c) => handleColorSelect('clothesColor', c)}
                label="Clothes Color"
              />

              <Typography variant="subtitle2" sx={{ mt: 1 }}>Face</Typography>
              <OptionGrid
                options={TOONHEAD_EYES}
                selected={draft.eyes}
                onSelect={(id) => handleOptionSelect('eyes', id)}
                label="Eyes"
              />
              <OptionGrid
                options={TOONHEAD_EYEBROWS}
                selected={draft.eyebrows}
                onSelect={(id) => handleOptionSelect('eyebrows', id)}
                label="Eyebrows"
              />
              <OptionGrid
                options={TOONHEAD_MOUTH}
                selected={draft.mouth}
                onSelect={(id) => handleOptionSelect('mouth', id)}
                label="Mouth"
              />

              <Typography variant="subtitle2" sx={{ mt: 1 }}>Hair &amp; Clothing</Typography>
              <OptionGrid
                options={TOONHEAD_HAIR}
                selected={draft.hair}
                onSelect={(id) => handleOptionSelect('hair', id)}
                label="Hair"
              />
              <OptionGrid
                options={TOONHEAD_REAR_HAIR}
                selected={draft.rearHair}
                onSelect={(id) => handleOptionSelect('rearHair', id)}
                label="Rear Hair"
              />
              <OptionGrid
                options={TOONHEAD_CLOTHES}
                selected={draft.clothes}
                onSelect={(id) => handleOptionSelect('clothes', id)}
                label="Clothes"
              />

              <Typography variant="subtitle2" sx={{ mt: 1 }}>Extras</Typography>
              <OptionGrid
                options={TOONHEAD_BEARD}
                selected={draft.beard}
                onSelect={(id) => handleOptionSelect('beard', id)}
                label="Beard"
              />
            </Stack>
          )}

          {/* ── Gradient Ring Editor ── */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={glowDraft?.active ?? false}
                  onChange={(_, checked) => {
                    if (checked) {
                      setGlowDraft({
                        colors: glowDraft?.colors ?? [...DEFAULT_GLOW_COLORS],
                        speed: glowDraft?.speed ?? 4,
                        thickness: glowDraft?.thickness ?? 3,
                        active: true,
                        expiresAt: null,
                      })
                    } else {
                      setGlowDraft(glowDraft ? { ...glowDraft, active: false } : null)
                    }
                  }}
                />
              }
              label={<Typography variant="subtitle2">Gradient Ring</Typography>}
            />
            {glowDraft?.active && (
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Choose a preset or pick custom colors
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {Object.entries(GLOW_COLOR_PRESETS).map(([name, colors]) => {
                    const isSelected = glowDraft.colors.join(',') === colors.join(',')
                    return (
                      <Chip
                        key={name}
                        label={name.charAt(0).toUpperCase() + name.slice(1)}
                        size="small"
                        variant={isSelected ? 'filled' : 'outlined'}
                        color={isSelected ? 'primary' : 'default'}
                        onClick={() => setGlowDraft({ ...glowDraft, colors: [...colors] })}
                        avatar={
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              background: `conic-gradient(${colors.slice(0, 4).join(', ')})`,
                            }}
                          />
                        }
                      />
                    )
                  })}
                </Stack>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Custom color stops
                  </Typography>
                  <Stack direction="row" gap={0.5} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                    {glowDraft.colors.map((color, i) => (
                      <Box
                        key={i}
                        sx={{
                          position: 'relative',
                          width: 32,
                          height: 32,
                        }}
                      >
                        <Box
                          component="input"
                          type="color"
                          value={color}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const newColors = [...glowDraft.colors]
                            newColors[i] = e.target.value
                            setGlowDraft({ ...glowDraft, colors: newColors })
                          }}
                          sx={{
                            width: 32,
                            height: 32,
                            border: '2px solid',
                            borderColor: 'divider',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            padding: 0,
                            appearance: 'none',
                            '&::-webkit-color-swatch-wrapper': { padding: 0 },
                            '&::-webkit-color-swatch': { borderRadius: '50%', border: 'none' },
                          }}
                        />
                      </Box>
                    ))}
                    {glowDraft.colors.length < 8 && (
                      <IconButton
                        size="small"
                        onClick={() => setGlowDraft({ ...glowDraft, colors: [...glowDraft.colors, '#ffffff'] })}
                        sx={{ width: 32, height: 32 }}
                      >
                        +
                      </IconButton>
                    )}
                    {glowDraft.colors.length > 2 && (
                      <IconButton
                        size="small"
                        onClick={() => setGlowDraft({ ...glowDraft, colors: glowDraft.colors.slice(0, -1) })}
                        sx={{ width: 32, height: 32 }}
                      >
                        −
                      </IconButton>
                    )}
                  </Stack>
                </Box>
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AvatarCustomizer
