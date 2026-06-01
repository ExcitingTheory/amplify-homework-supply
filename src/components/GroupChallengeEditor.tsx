/**
 * GroupChallengeEditor — Full creation/edit form for group challenges (boss battles).
 *
 * Includes title, target XP, deadline, bonus multiplier, campaign narrative fields,
 * active toggle, and a progress display with countdown timer.
 *
 * @module GroupChallengeEditor
 */

import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import InputAdornment from '@mui/material/InputAdornment'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import SaveIcon from '@mui/icons-material/Save'
import TimerIcon from '@mui/icons-material/Timer'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import ImageIcon from '@mui/icons-material/Image'
import { generateImage } from '../../app/actions/generate'
import getCachedUrl from '../utils/getCachedUrl'

// ============================================================================
// Types
// ============================================================================

export interface GroupChallengeEditorData {
  title: string
  targetXP: number
  deadline?: string // ISO datetime
  startDate?: string // ISO datetime
  bonusMultiplier: number
  setting?: string
  stakes?: string
  systemPromptSeed?: string
  active: boolean
  featuredImage?: string
}

export interface GroupChallengeEditorProps {
  /** Initial data for editing (omit for create mode) */
  initialData?: Partial<GroupChallengeEditorData> & { currentXP?: number }
  /** Called when form is submitted */
  onSubmit: (data: GroupChallengeEditorData) => void
  /** Disable during submission */
  submitting?: boolean
}

// ============================================================================
// Helpers
// ============================================================================

function formatCountdown(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (days > 0) return `${days}d ${hours}h remaining`
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}

// ============================================================================
// Component
// ============================================================================

export function GroupChallengeEditor({
  initialData,
  onSubmit,
  submitting = false,
}: GroupChallengeEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [targetXP, setTargetXP] = useState(initialData?.targetXP ?? 1000)
  const [deadline, setDeadline] = useState(initialData?.deadline || '')
  const [startDate, setStartDate] = useState(initialData?.startDate || '')
  const [bonusMultiplier, setBonusMultiplier] = useState(initialData?.bonusMultiplier ?? 1.5)
  const [setting, setSetting] = useState(initialData?.setting || '')
  const [stakes, setStakes] = useState(initialData?.stakes || '')
  const [systemPromptSeed, setSystemPromptSeed] = useState(initialData?.systemPromptSeed || '')
  const [active, setActive] = useState(initialData?.active ?? true)
  const [countdown, setCountdown] = useState('')
  const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage || '')
  const [featuredImageUrl, setFeaturedImageUrl] = useState('')
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageGenerating, setImageGenerating] = useState(false)

  const currentXP = initialData?.currentXP ?? 0
  const progress = targetXP > 0 ? Math.min(100, (currentXP / targetXP) * 100) : 0
  const isValid = title.trim().length > 0 && targetXP > 0

  // Resolve existing featured image URL
  useEffect(() => {
    if (featuredImage && !featuredImageUrl) {
      getCachedUrl(featuredImage).then(setFeaturedImageUrl).catch(() => {})
    }
  }, [featuredImage, featuredImageUrl])

  // Live countdown timer
  useEffect(() => {
    if (!deadline) {
      setCountdown('')
      return
    }
    setCountdown(formatCountdown(deadline))
    const interval = setInterval(() => {
      setCountdown(formatCountdown(deadline))
    }, 60_000)
    return () => clearInterval(interval)
  }, [deadline])

  const handleGenerateImage = async () => {
    const prompt = imagePrompt.trim() || `Fantasy battle scene: ${title}. ${setting}`
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    onSubmit({
      title,
      targetXP,
      deadline: deadline || undefined,
      startDate: startDate || undefined,
      bonusMultiplier,
      setting: setting || undefined,
      stakes: stakes || undefined,
      systemPromptSeed: systemPromptSeed || undefined,
      active,
      featuredImage: featuredImage || undefined,
    })
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Typography variant="h6">
              {initialData?.title ? 'Edit Group Challenge' : 'Create Group Challenge'}
            </Typography>

            {/* Progress display (only in edit mode with current XP) */}
            {initialData?.currentXP != null && (
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Progress: {currentXP} / {targetXP} XP
                  </Typography>
                  {countdown && (
                    <Chip
                      icon={<TimerIcon />}
                      label={countdown}
                      size="small"
                      color={countdown === 'Expired' ? 'error' : 'default'}
                    />
                  )}
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
            )}

            {/* Active toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
              }
              label="Active"
            />

            {/* Core fields */}
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., The Algorithm Dragon"
            />

            <TextField
              label="Target XP (HP)"
              type="number"
              value={targetXP}
              onChange={(e) => setTargetXP(Math.max(1, parseInt(e.target.value) || 0))}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">⚡</InputAdornment>,
              }}
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Start Date"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>

            <TextField
              label="Bonus Multiplier"
              type="number"
              value={bonusMultiplier}
              onChange={(e) => setBonusMultiplier(Math.max(1, parseFloat(e.target.value) || 1))}
              inputProps={{ step: 0.1, min: 1 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">×</InputAdornment>,
              }}
              helperText="XP multiplier applied to all contributions during the challenge"
            />

            <Divider>
              <Chip label="Campaign Narrative" icon={<EmojiEventsIcon />} />
            </Divider>

            {/* Campaign narrative fields */}
            <TextField
              label="Setting"
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              multiline
              rows={2}
              placeholder="e.g., A world where bugs rule the codebase..."
              helperText="The narrative setting for this challenge"
            />

            <TextField
              label="Stakes"
              value={stakes}
              onChange={(e) => setStakes(e.target.value)}
              multiline
              rows={2}
              placeholder="e.g., If the dragon wins, everyone loses a streak freeze..."
              helperText="What happens if the challenge is not completed"
            />

            <TextField
              label="System Prompt Seed"
              value={systemPromptSeed}
              onChange={(e) => setSystemPromptSeed(e.target.value)}
              multiline
              rows={2}
              placeholder="Context for AI-generated narrative responses..."
              helperText="Used to seed AI chat context during the challenge"
            />

            {/* Featured Image Generation */}
            <Divider>
              <Chip label="Featured Image" icon={<ImageIcon />} />
            </Divider>

            <TextField
              label="Image Prompt"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              multiline
              rows={2}
              placeholder={`e.g., Fantasy battle scene: ${title || 'The Algorithm Dragon'}. ${setting || 'A world where bugs rule the codebase...'}`}
              helperText="Describe the featured image you want to generate (leave blank for auto-prompt from title + setting)"
            />

            <Button
              variant="outlined"
              startIcon={imageGenerating ? <CircularProgress size={16} /> : <ImageIcon />}
              onClick={handleGenerateImage}
              disabled={imageGenerating || (!imagePrompt.trim() && !title.trim())}
            >
              {imageGenerating ? 'Generating...' : featuredImage ? 'Regenerate Image' : 'Generate Featured Image'}
            </Button>

            {featuredImageUrl && (
              <Box sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <img
                  src={featuredImageUrl}
                  alt="Featured"
                  style={{ width: '100%', maxHeight: 300, objectFit: 'cover' }}
                />
              </Box>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={!isValid || submitting}
            >
              {initialData?.title ? 'Save Challenge' : 'Create Challenge'}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}
