/**
 * BadgeEditor — Instructor UI for customizing badge criteria.
 *
 * Shows all hardcoded badges with their current event trigger and threshold,
 * and allows creating custom badges from available events.
 *
 * @module BadgeEditor
 */

import React, { useState, useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Slider from '@mui/material/Slider'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Collapse from '@mui/material/Collapse'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SaveIcon from '@mui/icons-material/Save'
import UndoIcon from '@mui/icons-material/Undo'
import PaletteIcon from '@mui/icons-material/Palette'
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard'
import { BadgeIcon } from './BadgeIcon'
import { BADGE_REGISTRY, type BadgeVisualConfig } from './badgeRegistry'
import { BadgeVisualPicker, resolveIcon } from './BadgeVisualPicker'

// ============================================================================
// Constants — available XP events that can trigger badges
// ============================================================================

export const BADGE_EVENTS = [
  { value: 'HOMEWORK_SUBMITTED', label: 'Homework Submitted' },
  { value: 'AI_FEEDBACK_REVISED', label: 'AI Feedback Revised' },
  { value: 'ON_TIME_SUBMISSION', label: 'On-Time Submission' },
  { value: 'PERFECT_SCORE', label: 'Perfect Score' },
  { value: 'STREAK_7DAY', label: '7-Day Streak' },
  { value: 'STREAK_14DAY', label: '14-Day Streak' },
  { value: 'STREAK_30DAY', label: '30-Day Streak' },
  { value: 'PEER_REVIEW_GIVEN', label: 'Peer Review Given' },
  { value: 'PRACTICE_DRILL_COMPLETED', label: 'Practice Drill Completed' },
  { value: 'COMEBACK', label: 'Comeback (streak resumed)' },
  { value: 'EASTER_EGG', label: 'Easter Egg Found' },
  { value: 'NAILED_IT', label: 'Nailed It (100% accuracy)' },
  { value: 'PEER_REVIEW_HOSTED', label: 'Peer Review Hosted' },
  { value: 'PEER_REVIEW_TOP_REVIEWER', label: 'Peer Review Top Reviewer (bonus XP)' },
  { value: 'PRACTICE_DRILL_ACCURACY_BONUS', label: 'Drill Accuracy Bonus' },
  { value: 'STREAK_3DAY', label: '3-Day Streak' },
] as const

export type BadgeEventType = (typeof BADGE_EVENTS)[number]['value']

export const RARITY_OPTIONS: BadgeVisualConfig['rarity'][] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
]

/**
 * Default criteria for hardcoded badges.
 * Maps badge type → { event, threshold, comparator }
 */
export const DEFAULT_BADGE_CRITERIA: Record<
  string,
  { event: string; threshold: number; comparator: 'gte' | 'any' | 'xp_gte' }
> = {
  FIRST_SUBMISSION: { event: 'HOMEWORK_SUBMITTED', threshold: 1, comparator: 'any' },
  GOOD_EYE: { event: 'AI_FEEDBACK_REVISED', threshold: 1, comparator: 'any' },
  QUICK_DRAW: { event: 'ON_TIME_SUBMISSION', threshold: 1, comparator: 'any' },
  SHARPSHOOTER: { event: 'PERFECT_SCORE', threshold: 3, comparator: 'gte' },
  CONSISTENT: { event: 'STREAK_7DAY', threshold: 1, comparator: 'any' },
  TEAM_PLAYER: { event: 'PEER_REVIEW_GIVEN', threshold: 3, comparator: 'gte' },
  DEEP_THINKER: { event: 'AI_FEEDBACK_REVISED', threshold: 5, comparator: 'gte' },
  TOP_OF_CLASS: { event: '', threshold: 500, comparator: 'xp_gte' },
  PERFECTIONIST: { event: 'PERFECT_SCORE', threshold: 5, comparator: 'gte' },
  DRILL_MASTER: { event: 'PRACTICE_DRILL_COMPLETED', threshold: 10, comparator: 'gte' },
  COMEBACK_KID: { event: 'COMEBACK', threshold: 1, comparator: 'any' },
  STREAK_14: { event: 'STREAK_14DAY', threshold: 1, comparator: 'any' },
  STREAK_30: { event: 'STREAK_30DAY', threshold: 1, comparator: 'any' },
  EASTER_EGG_HUNTER: { event: 'EASTER_EGG', threshold: 3, comparator: 'gte' },
}

// ============================================================================
// Types
// ============================================================================

export interface BadgeOverride {
  badgeType: string
  event?: string
  threshold?: number
  rarity?: BadgeVisualConfig['rarity']
}

/** Buffs granted when a badge is earned */
export interface BadgeBuff {
  /** Temporary XP multiplier (e.g. 1.5 = +50% XP) */
  xpMultiplier?: number
  /** Duration of XP multiplier in hours (0 = permanent) */
  xpMultiplierDurationHours?: number
  /** Number of streak freezes awarded */
  streakFreezes?: number
  /** Unit/content IDs that become unlocked when badge is earned */
  contentUnlockIds?: string[]
}

/** Visual configuration for a custom badge */
export interface CustomBadgeVisual {
  /** react-icons icon name (e.g. 'GiTrophy', 'FaStar') — resolved at render time */
  iconName: string
  /** Icon library prefix (e.g. 'gi', 'fa', 'md', 'hi') */
  iconLib: string
  /** Badge shape */
  shape: BadgeVisualConfig['shape']
  /** Solid background color */
  bgColor: string
  /** Optional gradient */
  gradient?: BadgeVisualConfig['gradient']
  /** Icon color */
  iconColor: string
  /** Animation preset */
  animation: BadgeVisualConfig['animation']
}

export interface CustomBadge {
  id: string
  name: string
  description: string
  event: string
  threshold: number
  rarity: BadgeVisualConfig['rarity']
  /** Visual design (icon, shape, colors) */
  visual?: CustomBadgeVisual
  /** Buffs granted on earning this badge */
  buffs?: BadgeBuff
}

export interface BadgeEditorProps {
  /** Current overrides for hardcoded badges (changed thresholds, rarity, etc.) */
  overrides?: BadgeOverride[]
  /** Custom badges created by the instructor */
  customBadges?: CustomBadge[]
  /** Called when a hardcoded badge's criteria is changed */
  onOverrideChange?: (override: BadgeOverride) => void
  /** Called when a hardcoded badge's override is reset to defaults */
  onOverrideReset?: (badgeType: string) => void
  /** Called when a new custom badge is created */
  onAddCustomBadge?: (badge: Omit<CustomBadge, 'id'>) => void
  /** Called when a custom badge is deleted */
  onDeleteCustomBadge?: (badgeId: string) => void
}

// ============================================================================
// Sub-components
// ============================================================================

function HardcodedBadgeRow({
  badgeType,
  config,
  defaults,
  override,
  onOverrideChange,
  onOverrideReset,
}: {
  badgeType: string
  config: BadgeVisualConfig
  defaults: { event: string; threshold: number; comparator: string }
  override?: BadgeOverride
  onOverrideChange?: (override: BadgeOverride) => void
  onOverrideReset?: (badgeType: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hasOverride = !!override
  const currentThreshold = override?.threshold ?? defaults.threshold
  const currentRarity = override?.rarity ?? config.rarity

  const eventLabel = useMemo(() => {
    const ev = override?.event ?? defaults.event
    if (!ev) return 'Total XP'
    return BADGE_EVENTS.find((e) => e.value === ev)?.label ?? ev
  }, [override?.event, defaults.event])

  const criteriaText = useMemo(() => {
    if (defaults.comparator === 'xp_gte') return `Earn ≥ ${currentThreshold} total XP`
    if (defaults.comparator === 'any') return `${eventLabel} (any occurrence)`
    return `${eventLabel} × ${currentThreshold}`
  }, [defaults.comparator, currentThreshold, eventLabel])

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1,
        borderColor: hasOverride ? 'warning.main' : 'divider',
        borderWidth: hasOverride ? 1.5 : 1,
      }}
    >
      <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <BadgeIcon badgeType={badgeType} size={36} earned animate={false} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="subtitle2" fontWeight={600} noWrap>
                {config.name}
              </Typography>
              {hasOverride && (
                <Chip label="Modified" size="small" color="warning" sx={{ height: 18, fontSize: '0.6rem' }} />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {criteriaText}
            </Typography>
          </Box>
          <Chip label={currentRarity} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', textTransform: 'capitalize' }} />
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            <ExpandMoreIcon
              fontSize="small"
              sx={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </IconButton>
        </Stack>
        <Collapse in={expanded}>
          <Divider sx={{ my: 1 }} />
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            {defaults.comparator !== 'any' && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {defaults.comparator === 'xp_gte' ? 'XP Threshold' : 'Event Count Required'}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Slider
                    size="small"
                    value={currentThreshold}
                    onChange={(_e, val) => {
                      onOverrideChange?.({
                        badgeType,
                        threshold: val as number,
                        rarity: currentRarity !== config.rarity ? currentRarity : undefined,
                        event: override?.event,
                      })
                    }}
                    min={defaults.comparator === 'xp_gte' ? 100 : 1}
                    max={defaults.comparator === 'xp_gte' ? 2000 : 50}
                    step={defaults.comparator === 'xp_gte' ? 50 : 1}
                    valueLabelDisplay="auto"
                    sx={{ flex: 1 }}
                  />
                  <Typography variant="body2" fontWeight={600} sx={{ minWidth: 40, textAlign: 'right' }}>
                    {currentThreshold}
                  </Typography>
                </Stack>
              </Box>
            )}
            <FormControl size="small" fullWidth>
              <InputLabel>Rarity</InputLabel>
              <Select
                value={currentRarity}
                label="Rarity"
                onChange={(e) => {
                  onOverrideChange?.({
                    badgeType,
                    rarity: e.target.value as BadgeVisualConfig['rarity'],
                    threshold: currentThreshold !== defaults.threshold ? currentThreshold : undefined,
                    event: override?.event,
                  })
                }}
              >
                {RARITY_OPTIONS.map((r) => (
                  <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {hasOverride && (
              <Button
                size="small"
                variant="text"
                startIcon={<UndoIcon />}
                onClick={() => onOverrideReset?.(badgeType)}
                color="warning"
              >
                Reset to Default
              </Button>
            )}
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function BadgeEditor({
  overrides = [],
  customBadges = [],
  onOverrideChange,
  onOverrideReset,
  onAddCustomBadge,
  onDeleteCustomBadge,
}: BadgeEditorProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newEvent, setNewEvent] = useState('')
  const [newThreshold, setNewThreshold] = useState(1)
  const [newRarity, setNewRarity] = useState<BadgeVisualConfig['rarity']>('common')
  const [showVisualEditor, setShowVisualEditor] = useState(false)
  const [showBuffEditor, setShowBuffEditor] = useState(false)
  const [newVisual, setNewVisual] = useState<CustomBadgeVisual>({
    iconName: 'GiTrophy',
    iconLib: 'gi',
    shape: 'circle',
    bgColor: '#4caf50',
    iconColor: '#ffffff',
    animation: 'draw',
  })
  const [newBuffs, setNewBuffs] = useState<BadgeBuff>({})

  const overrideMap = useMemo(
    () => new Map(overrides.map((o) => [o.badgeType, o])),
    [overrides],
  )

  // Only show badges that have criteria (exclude avatar/bot-whisperer/storybook-only)
  const editableBadges = useMemo(
    () =>
      Object.entries(DEFAULT_BADGE_CRITERIA)
        .filter(([type]) => BADGE_REGISTRY[type])
        .map(([type, criteria]) => ({
          type,
          config: BADGE_REGISTRY[type],
          criteria,
        })),
    [],
  )

  const handleCreate = () => {
    if (!newName.trim() || !newEvent) return
    const badge: Omit<CustomBadge, 'id'> = {
      name: newName.trim(),
      description: newDescription.trim(),
      event: newEvent,
      threshold: newThreshold,
      rarity: newRarity,
    }
    if (showVisualEditor) badge.visual = { ...newVisual }
    const hasBuffs = (newBuffs.xpMultiplier && newBuffs.xpMultiplier !== 1) ||
      (newBuffs.streakFreezes && newBuffs.streakFreezes > 0) ||
      (newBuffs.contentUnlockIds && newBuffs.contentUnlockIds.length > 0)
    if (hasBuffs) badge.buffs = { ...newBuffs }
    onAddCustomBadge?.(badge)
    // Reset form
    setNewName('')
    setNewDescription('')
    setNewEvent('')
    setNewThreshold(1)
    setNewRarity('common')
    setShowVisualEditor(false)
    setShowBuffEditor(false)
    setNewVisual({ iconName: 'GiTrophy', iconLib: 'gi', shape: 'circle', bgColor: '#4caf50', iconColor: '#ffffff', animation: 'draw' })
    setNewBuffs({})
    setShowCreateForm(false)
  }

  return (
    <Box>
      {/* ---- Hardcoded Badge Customization ---- */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
        Badge Criteria
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        Adjust the difficulty and rarity of built-in badges. Modified badges are highlighted.
      </Typography>
      {editableBadges.map(({ type, config, criteria }) => (
        <HardcodedBadgeRow
          key={type}
          badgeType={type}
          config={config}
          defaults={criteria}
          override={overrideMap.get(type)}
          onOverrideChange={onOverrideChange}
          onOverrideReset={onOverrideReset}
        />
      ))}

      <Divider sx={{ my: 2 }} />

      {/* ---- Custom Badges ---- */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Custom Badges ({customBadges.length})
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'New Badge'}
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        Create badges awarded when students reach a specific event count.
      </Typography>

      <Collapse in={showCreateForm}>
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Stack spacing={1.5}>
              <TextField
                size="small"
                label="Badge Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Grammar Guru"
                fullWidth
              />
              <TextField
                size="small"
                label="Description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What does this badge reward?"
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Trigger Event</InputLabel>
                <Select
                  value={newEvent}
                  label="Trigger Event"
                  onChange={(e) => setNewEvent(e.target.value)}
                >
                  {BADGE_EVENTS.map((ev) => (
                    <MenuItem key={ev.value} value={ev.value}>
                      {ev.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Times Required: {newThreshold}
                </Typography>
                <Slider
                  size="small"
                  value={newThreshold}
                  onChange={(_e, val) => setNewThreshold(val as number)}
                  min={1}
                  max={50}
                  step={1}
                  valueLabelDisplay="auto"
                />
              </Box>
              <FormControl size="small" fullWidth>
                <InputLabel>Rarity</InputLabel>
                <Select
                  value={newRarity}
                  label="Rarity"
                  onChange={(e) => setNewRarity(e.target.value as BadgeVisualConfig['rarity'])}
                >
                  {RARITY_OPTIONS.map((r) => (
                    <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>
                      {r}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* ---- Visual Design Toggle ---- */}
              <Divider />
              <Button
                size="small"
                variant={showVisualEditor ? 'contained' : 'outlined'}
                startIcon={<PaletteIcon />}
                onClick={() => setShowVisualEditor(!showVisualEditor)}
                color={showVisualEditor ? 'primary' : 'inherit'}
              >
                {showVisualEditor ? 'Visual Design ✓' : 'Add Visual Design'}
              </Button>
              <Collapse in={showVisualEditor}>
                <Box sx={{ pt: 1 }}>
                  <BadgeVisualPicker value={newVisual} onChange={setNewVisual} />
                </Box>
              </Collapse>

              {/* ---- Buff Editor Toggle ---- */}
              <Button
                size="small"
                variant={showBuffEditor ? 'contained' : 'outlined'}
                startIcon={<CardGiftcardIcon />}
                onClick={() => setShowBuffEditor(!showBuffEditor)}
                color={showBuffEditor ? 'secondary' : 'inherit'}
              >
                {showBuffEditor ? 'Badge Buffs ✓' : 'Add Badge Buffs'}
              </Button>
              <Collapse in={showBuffEditor}>
                <Box sx={{ pt: 1 }}>
                  <Stack spacing={1.5}>
                    <Typography variant="caption" color="text.secondary">
                      Buffs are granted when a student earns this badge.
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        size="small"
                        type="number"
                        label="XP Multiplier"
                        value={newBuffs.xpMultiplier ?? 1}
                        onChange={(e) =>
                          setNewBuffs((b) => ({
                            ...b,
                            xpMultiplier: Math.max(0, parseFloat(e.target.value) || 1),
                          }))
                        }
                        inputProps={{ min: 0, max: 5, step: 0.25 }}
                        helperText={
                          (newBuffs.xpMultiplier ?? 1) === 1
                            ? 'No bonus'
                            : `${newBuffs.xpMultiplier}× XP`
                        }
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        type="number"
                        label="Duration (hours)"
                        value={newBuffs.xpMultiplierDurationHours ?? 0}
                        onChange={(e) =>
                          setNewBuffs((b) => ({
                            ...b,
                            xpMultiplierDurationHours: Math.max(
                              0,
                              parseInt(e.target.value) || 0,
                            ),
                          }))
                        }
                        inputProps={{ min: 0, step: 1 }}
                        helperText={
                          (newBuffs.xpMultiplierDurationHours ?? 0) === 0
                            ? 'Permanent'
                            : `${newBuffs.xpMultiplierDurationHours}h`
                        }
                        sx={{ flex: 1 }}
                      />
                    </Stack>
                    <TextField
                      size="small"
                      type="number"
                      label="Streak Freezes Granted"
                      value={newBuffs.streakFreezes ?? 0}
                      onChange={(e) =>
                        setNewBuffs((b) => ({
                          ...b,
                          streakFreezes: Math.max(0, parseInt(e.target.value) || 0),
                        }))
                      }
                      inputProps={{ min: 0, max: 10, step: 1 }}
                      helperText={
                        (newBuffs.streakFreezes ?? 0) === 0
                          ? 'None'
                          : `${newBuffs.streakFreezes} freeze(s)`
                      }
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label="Content Unlock IDs"
                      value={(newBuffs.contentUnlockIds || []).join(', ')}
                      onChange={(e) =>
                        setNewBuffs((b) => ({
                          ...b,
                          contentUnlockIds: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        }))
                      }
                      placeholder="unit-id-1, unit-id-2"
                      helperText="Comma-separated unit IDs to unlock"
                      fullWidth
                    />
                  </Stack>
                </Box>
              </Collapse>

              <Button
                variant="contained"
                size="small"
                startIcon={<SaveIcon />}
                disabled={!newName.trim() || !newEvent}
                onClick={handleCreate}
              >
                Create Badge
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Collapse>

      {/* ---- Custom badge list ---- */}
      {customBadges.map((badge) => {
        const eventLabel = BADGE_EVENTS.find((e) => e.value === badge.event)?.label ?? badge.event
        // Build BadgeIcon config if visual is present
        const visualIcon = badge.visual ? resolveIcon(badge.visual.iconName) : undefined
        const badgePreviewConfig: BadgeVisualConfig | undefined = badge.visual && visualIcon
          ? {
              icon: visualIcon,
              name: badge.name,
              description: badge.description,
              bgColor: badge.visual.bgColor,
              gradient: badge.visual.gradient,
              iconColor: badge.visual.iconColor,
              shape: badge.visual.shape,
              animation: badge.visual.animation,
              category: 'core',
              rarity: badge.rarity,
            }
          : undefined
        const hasBuffs = badge.buffs && (
          (badge.buffs.xpMultiplier && badge.buffs.xpMultiplier !== 1) ||
          (badge.buffs.streakFreezes && badge.buffs.streakFreezes > 0) ||
          (badge.buffs.contentUnlockIds && badge.buffs.contentUnlockIds.length > 0)
        )
        return (
          <Card key={badge.id} variant="outlined" sx={{ mb: 1 }}>
            <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                {badgePreviewConfig ? (
                  <BadgeIcon config={badgePreviewConfig} size={36} earned animate={false} />
                ) : (
                  <Box sx={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', borderRadius: '50%' }}>
                    <PaletteIcon fontSize="small" color="disabled" />
                  </Box>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {badge.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {eventLabel} × {badge.threshold}
                  </Typography>
                  {badge.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {badge.description}
                    </Typography>
                  )}
                  {hasBuffs && (
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                      {badge.buffs!.xpMultiplier && badge.buffs!.xpMultiplier !== 1 && (
                        <Chip label={`${badge.buffs!.xpMultiplier}× XP`} size="small" color="success" sx={{ height: 18, fontSize: '0.6rem' }} />
                      )}
                      {badge.buffs!.streakFreezes && badge.buffs!.streakFreezes > 0 && (
                        <Chip label={`${badge.buffs!.streakFreezes} freeze(s)`} size="small" color="info" sx={{ height: 18, fontSize: '0.6rem' }} />
                      )}
                      {badge.buffs!.contentUnlockIds && badge.buffs!.contentUnlockIds.length > 0 && (
                        <Chip label={`${badge.buffs!.contentUnlockIds.length} unlock(s)`} size="small" color="warning" sx={{ height: 18, fontSize: '0.6rem' }} />
                      )}
                    </Stack>
                  )}
                </Box>
                <Chip
                  label={badge.rarity}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.65rem', textTransform: 'capitalize' }}
                />
                <Tooltip title="Delete custom badge">
                  <IconButton size="small" onClick={() => onDeleteCustomBadge?.(badge.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </CardContent>
          </Card>
        )
      })}
      {customBadges.length === 0 && !showCreateForm && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          No custom badges created yet.
        </Typography>
      )}
    </Box>
  )
}

export default BadgeEditor
