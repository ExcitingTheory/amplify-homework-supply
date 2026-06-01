/**
 * BossBattleForm — Creation form for group challenges (boss battles).
 * Collects title, target XP (HP), deadline, bonus multiplier, narrative fields,
 * and preset consequence stakes (switches).
 *
 * @module BossBattleForm
 */

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Collapse from '@mui/material/Collapse'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'
import AddIcon from '@mui/icons-material/Add'
import ImageIcon from '@mui/icons-material/Image'
import { generateImage } from '../../../app/actions/generate'
import getCachedUrl from '../../utils/getCachedUrl'

// ============================================================================
// Types
// ============================================================================

/** Badge rarity tiers (mapped from badge criteria difficulty) */
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

/** Preset consequence stakes for a boss battle failure */
export interface BattleStakes {
  /** Lose one level */
  loseLevel: boolean
  /** Lose XP points (amount configurable) */
  loseXP: boolean
  /** Amount of XP to lose (only applies when loseXP is true) */
  xpLossAmount: number
  /** Consume one streak freeze */
  loseStreakFreeze: boolean
  /** Reset current streak to 0 */
  resetStreak: boolean
  /** Lose the most recently earned badge */
  loseBadge: boolean
  /** Lose a badge of a specific rarity tier */
  loseBadgeByRarity: boolean
  /** Which rarity tier to target */
  badgeRarityTarget: BadgeRarity
  /** Each missed streak day costs XP */
  streakMissXPPenalty: boolean
  /** XP cost per missed streak day */
  streakMissXPPerDay: number
  /** Scramble cosmetic settings (name casing, border, flair) — not avatar color */
  loseCosmetics: boolean
  /** Duration in days for the cosmetic scramble */
  cosmeticPenaltyDays: number
}

export const DEFAULT_STAKES: BattleStakes = {
  loseLevel: false,
  loseXP: false,
  xpLossAmount: 50,
  loseStreakFreeze: true,
  resetStreak: false,
  loseBadge: false,
  loseBadgeByRarity: false,
  badgeRarityTarget: 'common',
  streakMissXPPenalty: false,
  streakMissXPPerDay: 10,
  loseCosmetics: false,
  cosmeticPenaltyDays: 3,
}

export interface BossBattleFormData {
  title: string
  targetXP: number
  startDate?: string // ISO datetime string
  deadline?: string // ISO datetime string (end date)
  bonusMultiplier: number
  setting?: string
  stakes: string // JSON-serialized BattleStakes
  featuredImage?: string
}

export interface BossBattleFormProps {
  /** Called when form is submitted with valid data */
  onSubmit: (data: BossBattleFormData) => void
  /** Pre-fill form for editing an existing battle */
  initialValues?: Partial<BossBattleFormData>
  /** Disable form during submission */
  submitting?: boolean
}

// ============================================================================
// Component
// ============================================================================

export function BossBattleForm({ onSubmit, initialValues, submitting = false }: BossBattleFormProps) {
  const isEditMode = !!initialValues

  const [title, setTitle] = useState(initialValues?.title || '')
  const [targetXP, setTargetXP] = useState<number | ''>(initialValues?.targetXP || '')
  const [startDate, setStartDate] = useState(initialValues?.startDate || '')
  const [deadline, setDeadline] = useState(initialValues?.deadline || '')
  const [bonusMultiplier, setBonusMultiplier] = useState(initialValues?.bonusMultiplier ?? 1.5)
  const [setting, setSetting] = useState(initialValues?.setting || '')
  const [stakes, setStakes] = useState<BattleStakes>(() => {
    if (initialValues?.stakes) {
      try { return { ...DEFAULT_STAKES, ...JSON.parse(initialValues.stakes) } } catch { /* ignore */ }
    }
    return { ...DEFAULT_STAKES }
  })
  const [featuredImage, setFeaturedImage] = useState(initialValues?.featuredImage || '')
  const [featuredImageUrl, setFeaturedImageUrl] = useState('')
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageGenerating, setImageGenerating] = useState(false)

  const isValid = title.trim().length > 0 && typeof targetXP === 'number' && targetXP > 0

  const handleGenerateImage = async () => {
    const prompt = imagePrompt.trim() || `Epic boss battle scene: ${title}. ${setting}`
    setImageGenerating(true)
    try {
      const result = await generateImage({ phrase: prompt, model: 'dall-e-3', size: '1792x1024' })
      setFeaturedImage(result.path)
      const url = await getCachedUrl(result.path)
      setFeaturedImageUrl(url)
    } catch (err) {
      console.error('Image generation failed:', err)
    } finally {
      setImageGenerating(false)
    }
  }

  const handleStakeToggle = (key: keyof Pick<BattleStakes,
    'loseLevel' | 'loseXP' | 'loseStreakFreeze' | 'resetStreak' | 'loseBadge' |
    'loseBadgeByRarity' | 'streakMissXPPenalty' | 'loseCosmetics'
  >) => {
    setStakes((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    onSubmit({
      title: title.trim(),
      targetXP: targetXP as number,
      startDate: startDate || undefined,
      deadline: deadline || undefined,
      bonusMultiplier,
      setting: setting.trim() || undefined,
      stakes: JSON.stringify(stakes),
      featuredImage: featuredImage || undefined,
    })

    // Only reset form in create mode
    if (!isEditMode) {
      setTitle('')
      setTargetXP('')
      setStartDate('')
      setDeadline('')
      setBonusMultiplier(1.5)
      setSetting('')
      setStakes({ ...DEFAULT_STAKES })
      setFeaturedImage('')
      setFeaturedImageUrl('')
      setImagePrompt('')
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2}>
        <TextField
          size="small"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          fullWidth
          placeholder="e.g. The Algorithm Dragon"
          disabled={submitting}
        />

        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            label="Target XP (HP)"
            type="number"
            value={targetXP}
            onChange={(e) => {
              const val = e.target.value
              setTargetXP(val === '' ? '' : Number(val))
            }}
            required
            placeholder="1000"
            InputProps={{
              startAdornment: <InputAdornment position="start">XP</InputAdornment>,
              inputProps: { min: 1 },
            }}
            sx={{ flex: 1 }}
            disabled={submitting}
          />

          <TextField
            size="small"
            label="Bonus Multiplier"
            type="number"
            value={bonusMultiplier}
            onChange={(e) => setBonusMultiplier(Number(e.target.value))}
            InputProps={{
              startAdornment: <InputAdornment position="start">×</InputAdornment>,
              inputProps: { min: 1, max: 10, step: 0.1 },
            }}
            sx={{ width: 140 }}
            disabled={submitting}
          />
        </Stack>

        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            label="Start Date"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
            disabled={submitting}
          />

          <TextField
            size="small"
            label="End Date (Deadline)"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
            disabled={submitting}
          />
        </Stack>

        <TextField
          size="small"
          label="Narrative Setting"
          value={setting}
          onChange={(e) => setSetting(e.target.value)}
          multiline
          rows={2}
          fullWidth
          placeholder="A world where bugs rule the codebase..."
          disabled={submitting}
        />

        {/* Stakes — Preset consequence switches */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Stakes (Consequences on Failure)
          </Typography>
          <Stack spacing={0}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={stakes.loseStreakFreeze}
                  onChange={() => handleStakeToggle('loseStreakFreeze')}
                  disabled={submitting}
                />
              }
              label="Lose a streak freeze"
            />
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={stakes.loseXP}
                  onChange={() => handleStakeToggle('loseXP')}
                  disabled={submitting}
                />
              }
              label="Lose XP points"
            />
            <Collapse in={stakes.loseXP}>
              <TextField
                size="small"
                label="XP Loss Amount"
                type="number"
                value={stakes.xpLossAmount}
                onChange={(e) =>
                  setStakes((prev) => ({ ...prev, xpLossAmount: Math.max(1, Number(e.target.value)) }))
                }
                InputProps={{
                  startAdornment: <InputAdornment position="start">−</InputAdornment>,
                  inputProps: { min: 1 },
                }}
                sx={{ ml: 5, mt: 0.5, mb: 1, width: 160 }}
                disabled={submitting}
              />
            </Collapse>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={stakes.loseLevel}
                  onChange={() => handleStakeToggle('loseLevel')}
                  disabled={submitting}
                />
              }
              label="Lose a level"
            />
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={stakes.resetStreak}
                  onChange={() => handleStakeToggle('resetStreak')}
                  disabled={submitting}
                />
              }
              label="Reset streak to zero"
            />
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={stakes.loseBadge}
                  onChange={() => handleStakeToggle('loseBadge')}
                  disabled={submitting}
                />
              }
              label="Lose most recent badge"
            />
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={stakes.loseBadgeByRarity}
                  onChange={() => handleStakeToggle('loseBadgeByRarity')}
                  disabled={submitting}
                />
              }
              label="Lose a badge by rarity"
            />
            <Collapse in={stakes.loseBadgeByRarity}>
              <TextField
                size="small"
                select
                label="Badge Rarity"
                value={stakes.badgeRarityTarget}
                onChange={(e) =>
                  setStakes((prev) => ({ ...prev, badgeRarityTarget: e.target.value as BadgeRarity }))
                }
                sx={{ ml: 5, mt: 0.5, mb: 1, width: 160 }}
                disabled={submitting}
              >
                <MenuItem value="common">Common</MenuItem>
                <MenuItem value="uncommon">Uncommon</MenuItem>
                <MenuItem value="rare">Rare</MenuItem>
                <MenuItem value="epic">Epic</MenuItem>
                <MenuItem value="legendary">Legendary</MenuItem>
              </TextField>
            </Collapse>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={stakes.streakMissXPPenalty}
                  onChange={() => handleStakeToggle('streakMissXPPenalty')}
                  disabled={submitting}
                />
              }
              label="Missed streaks cost XP"
            />
            <Collapse in={stakes.streakMissXPPenalty}>
              <TextField
                size="small"
                label="XP per missed day"
                type="number"
                value={stakes.streakMissXPPerDay}
                onChange={(e) =>
                  setStakes((prev) => ({ ...prev, streakMissXPPerDay: Math.max(1, Number(e.target.value)) }))
                }
                InputProps={{
                  startAdornment: <InputAdornment position="start">−</InputAdornment>,
                  inputProps: { min: 1 },
                }}
                sx={{ ml: 5, mt: 0.5, mb: 1, width: 180 }}
                disabled={submitting}
              />
            </Collapse>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={stakes.loseCosmetics}
                  onChange={() => handleStakeToggle('loseCosmetics')}
                  disabled={submitting}
                />
              }
              label="Scramble cosmetics (name, border, flair)"
            />
            <Collapse in={stakes.loseCosmetics}>
              <TextField
                size="small"
                label="Penalty duration (days)"
                type="number"
                value={stakes.cosmeticPenaltyDays}
                onChange={(e) =>
                  setStakes((prev) => ({ ...prev, cosmeticPenaltyDays: Math.max(1, Number(e.target.value)) }))
                }
                InputProps={{
                  inputProps: { min: 1, max: 30 },
                }}
                sx={{ ml: 5, mt: 0.5, mb: 1, width: 180 }}
                disabled={submitting}
              />
            </Collapse>
          </Stack>
        </Box>

        {/* Featured Image Generation */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Featured Image
          </Typography>
          <Stack spacing={1}>
            <TextField
              size="small"
              label="Image Prompt"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              multiline
              rows={2}
              fullWidth
              placeholder={`e.g., Epic boss battle: ${title || 'The Algorithm Dragon'}. ${setting || 'A world where bugs rule...'}`}
              helperText="Describe the image (leave blank for auto-prompt from title + setting)"
              disabled={submitting}
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={imageGenerating ? <CircularProgress size={14} /> : <ImageIcon />}
              onClick={handleGenerateImage}
              disabled={imageGenerating || submitting || (!imagePrompt.trim() && !title.trim())}
            >
              {imageGenerating ? 'Generating...' : featuredImage ? 'Regenerate' : 'Generate Image'}
            </Button>
            {featuredImageUrl && (
              <Box sx={{ borderRadius: 1, overflow: 'hidden' }}>
                <img
                  src={featuredImageUrl}
                  alt="Featured"
                  style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }}
                />
              </Box>
            )}
          </Stack>
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          disabled={!isValid || submitting}
        >
          {submitting
            ? (isEditMode ? 'Updating...' : 'Creating...')
            : (isEditMode ? 'Update Battle' : 'Create Boss Battle')}
        </Button>
      </Stack>
    </Box>
  )
}

export default BossBattleForm
