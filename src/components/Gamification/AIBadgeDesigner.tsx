'use client'

/**
 * AIBadgeDesigner — Chat-style AI badge generation flow.
 *
 * Instructors describe a badge concept in natural language, the AI generates
 * a BadgeVisualConfig (icon, colors, shape, animation), and the instructor
 * can preview, iterate, and accept the design.
 *
 * @module AIBadgeDesigner
 */

import React, { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import RefreshIcon from '@mui/icons-material/Refresh'
import CheckIcon from '@mui/icons-material/Check'
import { BadgeIcon } from './BadgeIcon'
import type { CustomBadgeVisual, CustomBadge } from './BadgeEditor'
import { resolveIcon } from './BadgeVisualPicker'
import type { BadgeShape, BadgeAnimationPreset, BadgeVisualConfig } from './badgeRegistry'

// Available icons by library — subset that the AI can reference
const AVAILABLE_ICONS: Record<string, string[]> = {
  gi: [
    'GiTrophy', 'GiCrown', 'GiDiamondHard', 'GiSwordsPower', 'GiShield',
    'GiTargetShot', 'GiRocket', 'GiFlame', 'GiSnowflake2', 'GiStarMedal',
    'GiBrain', 'GiPalette', 'GiCompass', 'GiBookCover', 'GiLaurelCrown',
    'GiMusicalNotes', 'GiMicroscope', 'GiAtom', 'GiChessKnight', 'GiKey',
    'GiLightBulb', 'GiScrollUnfurled', 'GiSpellBook', 'GiTeacher',
    'GiTreasureMap', 'GiUnicorn', 'GiWaterDrop', 'GiIdea', 'GiFlowerPot',
    'GiFire', 'GiGears', 'GiGlobe', 'GiHeartPlus', 'GiNinjaHead',
    'GiPaintBrush', 'GiQuillInk',
  ],
  fa: [
    'FaStar', 'FaHeart', 'FaBolt', 'FaGem', 'FaCrown', 'FaMedal',
    'FaAward', 'FaFire', 'FaRocket', 'FaBookOpen', 'FaGraduationCap',
    'FaPuzzlePiece', 'FaWandMagicSparkles', 'FaHandshake', 'FaBullseye',
    'FaLightbulb', 'FaCompass', 'FaPalette', 'FaDragon', 'FaFeather',
    'FaShieldHalved',
  ],
  md: [
    'MdEmojiEvents', 'MdWorkspacePremium', 'MdMilitaryTech',
    'MdAutoAwesome', 'MdDiamond', 'MdStars', 'MdPsychology',
    'MdSchool', 'MdScience', 'MdExplore', 'MdRocketLaunch',
    'MdLocalFireDepartment',
  ],
}

const SHAPES: BadgeShape[] = ['circle', 'hexagon', 'shield', 'diamond']
const ANIMATIONS: BadgeAnimationPreset[] = ['none', 'pulse', 'bounce-in', 'spin-in', 'glow', 'shake', 'draw']
const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const

/** Build the system prompt for badge generation */
function buildSystemPrompt(): string {
  const iconList = Object.entries(AVAILABLE_ICONS)
    .map(([lib, icons]) => `${lib}: ${icons.join(', ')}`)
    .join('\n')

  return `You are a badge designer for an educational platform. Given a description of a badge concept, generate a badge visual configuration as JSON.

Available icon names (by library):
${iconList}

Available shapes: ${SHAPES.join(', ')}
Available animations: ${ANIMATIONS.join(', ')}
Available rarities: ${RARITIES.join(', ')}

Respond with ONLY a JSON object (no markdown, no explanation) with these fields:
{
  "name": "Badge Name",
  "description": "Short achievement description",
  "iconName": "IconName",
  "iconLib": "gi|fa|md",
  "shape": "circle|hexagon|shield|star|diamond|square",
  "bgColor": "#hexcolor",
  "iconColor": "#hexcolor",
  "animation": "none|pulse|bounce|spin|glow|shake|float",
  "rarity": "common|uncommon|rare|epic|legendary",
  "gradient": { "from": "#hex", "to": "#hex", "direction": "to bottom" } // optional
}

Choose icons, colors, and animations that match the badge concept. Use vibrant, engaging colors appropriate for students. Match rarity to the difficulty/significance of the achievement.`
}

interface AIBadgeDesignerProps {
  /** Called when the user accepts a generated design */
  onAccept: (badge: Omit<CustomBadge, 'id' | 'event' | 'threshold'>) => void
  /** Optional: pre-fill the prompt */
  initialPrompt?: string
}

export default function AIBadgeDesigner({ onAccept, initialPrompt = '' }: AIBadgeDesignerProps) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    name: string
    description: string
    visual: CustomBadgeVisual
    rarity: CustomBadge['rarity']
  } | null>(null)

  const generate = useCallback(async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: buildSystemPrompt() },
            { role: 'user', content: prompt.trim() },
          ],
          // Use a simple completion, not streaming
          stream: false,
        }),
      })

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.status}`)
      }

      const data = await response.json()
      const text = data?.choices?.[0]?.message?.content
        || data?.content
        || (typeof data === 'string' ? data : JSON.stringify(data))

      // Extract JSON from the response (handle potential markdown wrapping)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No valid JSON in AI response')

      const parsed = JSON.parse(jsonMatch[0])

      // Validate required fields
      if (!parsed.iconName || !parsed.iconLib || !parsed.shape) {
        throw new Error('Missing required fields in generated badge')
      }

      // Validate icon exists in our catalog
      const libIcons = AVAILABLE_ICONS[parsed.iconLib]
      if (!libIcons?.includes(parsed.iconName)) {
        // Fall back to first icon in that library
        parsed.iconName = libIcons?.[0] || 'FaStar'
        parsed.iconLib = libIcons ? parsed.iconLib : 'fa'
      }

      setResult({
        name: parsed.name || 'Custom Badge',
        description: parsed.description || prompt.trim(),
        rarity: RARITIES.includes(parsed.rarity) ? parsed.rarity : 'uncommon',
        visual: {
          iconName: parsed.iconName,
          iconLib: parsed.iconLib,
          shape: SHAPES.includes(parsed.shape) ? parsed.shape : 'circle',
          bgColor: parsed.bgColor || '#6366f1',
          iconColor: parsed.iconColor || '#ffffff',
          animation: ANIMATIONS.includes(parsed.animation) ? parsed.animation : 'glow',
          gradient: parsed.gradient || undefined,
        },
      })
    } catch (err: any) {
      console.error('[AIBadgeDesigner] Generation error:', err)
      setError(err.message || 'Failed to generate badge')
    } finally {
      setGenerating(false)
    }
  }, [prompt])

  const handleAccept = useCallback(() => {
    if (!result) return
    onAccept({
      name: result.name,
      description: result.description,
      rarity: result.rarity,
      visual: result.visual,
    })
    // Reset for next design
    setResult(null)
    setPrompt('')
  }, [result, onAccept])

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1" fontWeight={600}>
          <AutoAwesomeIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'text-bottom' }} />
          AI Badge Designer
        </Typography>

        <TextField
          label="Describe your badge concept"
          placeholder="e.g., A badge for students who complete 10 reading assignments, with a book theme and gold colors"
          multiline
          rows={2}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={generating}
          fullWidth
        />

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
            onClick={generate}
            disabled={generating || !prompt.trim()}
          >
            {generating ? 'Generating...' : 'Generate Badge'}
          </Button>
          {result && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={generate}
              disabled={generating}
            >
              Regenerate
            </Button>
          )}
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        {result && (
          <Box
            sx={{
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
            }}
          >
            <Stack direction="row" spacing={3} alignItems="center">
              <Box sx={{ flexShrink: 0 }}>
                {(() => {
                  const visualIcon = resolveIcon(result.visual.iconName)
                  const previewConfig: BadgeVisualConfig | undefined = visualIcon
                    ? {
                        icon: visualIcon as BadgeVisualConfig['icon'],
                        name: result.name,
                        description: result.description,
                        bgColor: result.visual.bgColor,
                        gradient: result.visual.gradient,
                        iconColor: result.visual.iconColor,
                        shape: result.visual.shape,
                        animation: result.visual.animation,
                        category: 'core',
                        rarity: result.rarity,
                      }
                    : undefined
                  return previewConfig
                    ? <BadgeIcon config={previewConfig} size={80} earned />
                    : <BadgeIcon badgeType="FIRST_SUBMISSION" size={80} earned />
                })()}
              </Box>
              <Stack spacing={0.5} flex={1}>
                <Typography variant="h6">{result.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.description}
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  <Chip label={result.rarity} size="small" />
                  <Chip label={result.visual.shape} size="small" variant="outlined" />
                  <Chip label={result.visual.animation} size="small" variant="outlined" />
                </Stack>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                onClick={handleAccept}
              >
                Use This Badge
              </Button>
            </Stack>
          </Box>
        )}

        {!result && !generating && !error && (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Describe what the badge should represent and the AI will generate a visual design
            with appropriate icon, colors, shape, and animation.
          </Typography>
        )}
      </Stack>
    </Box>
  )
}
