/**
 * Gamification settings page for a specific section.
 *
 * Provides feature toggles, badge config editor, custom badge creator,
 * and streak settings for the section's gamification configuration.
 *
 * @module section/[id]/settings/gamification
 */
'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Grid from '@mui/material/Grid'
import Snackbar from '@mui/material/Snackbar'
import SaveIcon from '@mui/icons-material/Save'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { generateClient } from 'aws-amplify/data'
import { useParams, useRouter } from 'next/navigation'
import {
  HOLIDAY_BADGE_ICONS,
  getIconsByHoliday,
  getIconsByCulture,
  getAllHolidays,
  getAllCultures,
  type HolidayBadgeIcon,
} from '@/utils/holidayBadgeIcons'

// ============================================================================
// Types
// ============================================================================

interface SectionOption {
  id: string
  name: string
  gamificationConfig?: any
}

interface BadgeConfigEntry {
  badgeType: string
  enabled: boolean
  thresholdOverride?: number
}

interface CustomBadgeEntry {
  id: string
  title: string
  description?: string
  icon?: string
  shape?: string
  rarity?: string
  category?: string
  criteria?: any
  isAnti?: boolean
}

// ============================================================================
// Constants
// ============================================================================

import { GAMIFICATION_FEATURE_META } from '@/hooks/useGamificationFeatures'
import type { GamificationFeatureKey } from '@/hooks/useGamificationFeatures'

const FEATURE_TOGGLES = GAMIFICATION_FEATURE_META

const DEFAULT_BADGE_TYPES = [
  'PERFECT_SCORE',
  'STREAK_7',
  'STREAK_30',
  'FIRST_SUBMISSION',
  'SPEED_DEMON',
  'NIGHT_OWL',
  'EARLY_BIRD',
  'COMPLETIONIST',
  'HELPING_HAND',
  'COMEBACK_KID',
]

const BADGE_SHAPES = ['circle', 'hexagon', 'shield', 'diamond']
const BADGE_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary']

// ============================================================================
// Component
// ============================================================================

export default function GamificationSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const sectionId = params.id as string
  const client = useMemo(() => generateClient(), [])

  // Section data
  const [sections, setSections] = useState<SectionOption[]>([])
  const [currentSection, setCurrentSection] = useState<SectionOption | null>(null)

  // Feature toggles — null means "use platform default", true/false = explicit override
  const [features, setFeatures] = useState<Record<string, boolean | null>>({
    xpEnabled: null,
    leaderboardEnabled: null,
    badgesEnabled: null,
    antiBadgesEnabled: null,
    easterEggsEnabled: null,
    groupChallengesEnabled: null,
    squadsEnabled: null,
    skillTreesEnabled: null,
    streaksEnabled: null,
    collaborativePracticeEnabled: null,
    cosmeticsEnabled: null,
    contentLocksEnabled: null,
  })

  // Badge configs
  const [badgeConfigs, setBadgeConfigs] = useState<BadgeConfigEntry[]>(
    DEFAULT_BADGE_TYPES.map((t) => ({ badgeType: t, enabled: true }))
  )

  // Custom badges
  const [customBadges, setCustomBadges] = useState<CustomBadgeEntry[]>([])
  const [showBadgeCreator, setShowBadgeCreator] = useState(false)

  // Streak settings
  const [streakFreezesAllowed, setStreakFreezesAllowed] = useState(3)

  // UI state
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState('')
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)
  const initialLoadRef = useRef(false)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Load sections for the instructor
  useEffect(() => {
    const sub = (client.models as any).Section.observeQuery().subscribe({
      next: ({ items }: any) => {
        const valid = items.filter((s: any) => s != null && !s._deleted)
        setSections(valid.map((s: any) => ({
          id: s.id,
          name: s.name || s.id,
          gamificationConfig: s.gamificationConfig,
        })))
        const current = valid.find((s: any) => s.id === sectionId)
        if (current) {
          setCurrentSection({
            id: current.id,
            name: current.name || current.id,
            gamificationConfig: current.gamificationConfig,
          })
          // Hydrate state from existing config
          if (current.gamificationConfig) {
            const cfg = typeof current.gamificationConfig === 'string'
              ? JSON.parse(current.gamificationConfig)
              : current.gamificationConfig
            setFeatures((prev) => ({
              ...prev,
              xpEnabled: cfg.xpEnabled ?? null,
              leaderboardEnabled: cfg.leaderboardEnabled ?? null,
              badgesEnabled: cfg.badgesEnabled ?? null,
              antiBadgesEnabled: cfg.antiBadgesEnabled ?? null,
              easterEggsEnabled: cfg.easterEggsEnabled ?? null,
              groupChallengesEnabled: cfg.groupChallengesEnabled ?? null,
              squadsEnabled: cfg.squadsEnabled ?? null,
              skillTreesEnabled: cfg.skillTreesEnabled ?? null,
              streaksEnabled: cfg.streaksEnabled ?? null,
              collaborativePracticeEnabled: cfg.collaborativePracticeEnabled ?? null,
              cosmeticsEnabled: cfg.cosmeticsEnabled ?? null,
              contentLocksEnabled: cfg.contentLocksEnabled ?? null,
            }))
            if (cfg.badgeConfigs) setBadgeConfigs(cfg.badgeConfigs)
            if (cfg.customBadges) setCustomBadges(cfg.customBadges)
            if (cfg.streakFreezesAllowed != null) setStreakFreezesAllowed(cfg.streakFreezesAllowed)
          }
        }
      },
      error: (err: any) => console.warn('[GamificationSettings] Section sub error:', err),
    })
    return () => sub.unsubscribe()
  }, [client, sectionId])

  // Toggle a feature — cycles: null (platform default) → true → false → null
  const toggleFeature = (key: string) => {
    setFeatures((prev) => {
      const current = prev[key]
      // null → true → false → null
      if (current === null || current === undefined) return { ...prev, [key]: true }
      if (current === true) return { ...prev, [key]: false }
      return { ...prev, [key]: null }
    })
  }

  // Explicitly set feature override or reset to platform default
  const setFeatureOverride = (key: string, value: boolean | null) => {
    setFeatures((prev) => ({ ...prev, [key]: value }))
  }

  // Toggle badge type
  const toggleBadgeConfig = (badgeType: string) => {
    setBadgeConfigs((prev) =>
      prev.map((b) =>
        b.badgeType === badgeType ? { ...b, enabled: !b.enabled } : b
      )
    )
  }

  // Update badge threshold
  const updateBadgeThreshold = (badgeType: string, value: number | undefined) => {
    setBadgeConfigs((prev) =>
      prev.map((b) =>
        b.badgeType === badgeType ? { ...b, thresholdOverride: value } : b
      )
    )
  }

  // Copy settings from another section
  const copyFromSection = (sourceId: string) => {
    const source = sections.find((s) => s.id === sourceId)
    if (!source?.gamificationConfig) return
    const cfg = typeof source.gamificationConfig === 'string'
      ? JSON.parse(source.gamificationConfig)
      : source.gamificationConfig
    setFeatures({
      xpEnabled: cfg.xpEnabled ?? null,
      leaderboardEnabled: cfg.leaderboardEnabled ?? null,
      badgesEnabled: cfg.badgesEnabled ?? null,
      antiBadgesEnabled: cfg.antiBadgesEnabled ?? null,
      easterEggsEnabled: cfg.easterEggsEnabled ?? null,
      groupChallengesEnabled: cfg.groupChallengesEnabled ?? null,
      squadsEnabled: cfg.squadsEnabled ?? null,
      skillTreesEnabled: cfg.skillTreesEnabled ?? null,
      streaksEnabled: cfg.streaksEnabled ?? null,
      collaborativePracticeEnabled: cfg.collaborativePracticeEnabled ?? null,
      cosmeticsEnabled: cfg.cosmeticsEnabled ?? null,
      contentLocksEnabled: cfg.contentLocksEnabled ?? null,
    })
    if (cfg.badgeConfigs) setBadgeConfigs(cfg.badgeConfigs)
    if (cfg.customBadges) setCustomBadges(cfg.customBadges)
    if (cfg.streakFreezesAllowed != null) setStreakFreezesAllowed(cfg.streakFreezesAllowed)
    setCopyDialogOpen(false)
    setSnackbar('Settings copied successfully')
  }

  // Save to section — only persist explicit overrides (non-null values)
  const handleSave = async () => {
    setSaving(true)
    try {
      // Build config with only non-null feature overrides
      const featureOverrides: Record<string, boolean> = {}
      for (const [key, val] of Object.entries(features)) {
        if (val != null) featureOverrides[key] = val
      }
      const gamificationConfig = {
        ...featureOverrides,
        streakFreezesAllowed,
        badgeConfigs,
        customBadges,
      }
      await (client.models as any).Section.update({
        id: sectionId,
        gamificationConfig,
        _version: (currentSection as any)?._version,
      })
      setSnackbar('Settings saved!')
    } catch (err) {
      console.error('[GamificationSettings] Save error:', err)
      setSnackbar('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  // Debounced auto-save: triggers 1.5s after any setting change
  useEffect(() => {
    // Skip auto-save on initial hydration
    if (!initialLoadRef.current) {
      if (currentSection) initialLoadRef.current = true
      return
    }
    if (!currentSection) return

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave()
    }, 1500)

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [features, streakFreezesAllowed, badgeConfigs, customBadges])

  // Add custom badge
  const addCustomBadge = (badge: CustomBadgeEntry) => {
    setCustomBadges((prev) => [...prev, badge])
    setShowBadgeCreator(false)
  }

  // Remove custom badge
  const removeCustomBadge = (id: string) => {
    setCustomBadges((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h4">Gamification Settings</Typography>
        <Typography variant="body2" color="text.secondary">
          Section: {currentSection?.name || sectionId}
        </Typography>

        {/* Copy settings button */}
        {sections.length > 1 && (
          <Button
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={() => setCopyDialogOpen(true)}
          >
            Copy settings from another section
          </Button>
        )}

        {/* Feature Toggles */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>Feature Toggles</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Features use the platform default unless you explicitly override them here.
              Data processing continues even when a feature is hidden, so toggling it back on restores full accuracy.
            </Alert>
            <Stack spacing={2}>
              {FEATURE_TOGGLES.map(({ key, label, description, category }) => {
                const value = features[key]
                const isOverridden = value != null
                return (
                  <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body1">{label}</Typography>
                        <Chip label={category} size="small" variant="outlined" />
                        {!isOverridden && (
                          <Chip label="Platform Default" size="small" color="default" />
                        )}
                        {isOverridden && (
                          <Chip
                            label={value ? 'Enabled' : 'Disabled'}
                            size="small"
                            color={value ? 'success' : 'error'}
                          />
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {description}
                      </Typography>
                    </Box>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <Select
                        value={value === null || value === undefined ? 'default' : value ? 'enabled' : 'disabled'}
                        onChange={(e) => {
                          const v = e.target.value
                          setFeatureOverride(key, v === 'default' ? null : v === 'enabled')
                        }}
                        size="small"
                      >
                        <MenuItem value="default">Platform Default</MenuItem>
                        <MenuItem value="enabled">Enabled</MenuItem>
                        <MenuItem value="disabled">Disabled</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                )
              })}
            </Stack>
          </CardContent>
        </Card>

        {/* Streak Settings */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>Streak Settings</Typography>
            <TextField
              label="Streak Freezes Allowed"
              type="number"
              value={streakFreezesAllowed}
              onChange={(e) => setStreakFreezesAllowed(Math.max(0, parseInt(e.target.value) || 0))}
              inputProps={{ min: 0 }}
              helperText="Maximum number of streak freezes students can use"
              fullWidth
            />
          </CardContent>
        </Card>

        {/* Badge Config Editor */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>Badge Configuration</Typography>
            <List dense>
              {badgeConfigs.map((cfg) => (
                <ListItem key={cfg.badgeType}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={cfg.enabled}
                        onChange={() => toggleBadgeConfig(cfg.badgeType)}
                        size="small"
                      />
                    }
                    label={cfg.badgeType.replace(/_/g, ' ')}
                  />
                  <ListItemSecondaryAction>
                    <TextField
                      size="small"
                      type="number"
                      placeholder="Threshold"
                      value={cfg.thresholdOverride ?? ''}
                      onChange={(e) =>
                        updateBadgeThreshold(
                          cfg.badgeType,
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      sx={{ width: 100 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">#</InputAdornment>,
                      }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Custom Badges */}
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Custom Badges</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setShowBadgeCreator(true)}
                size="small"
              >
                Create Badge
              </Button>
            </Stack>
            {customBadges.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No custom badges created yet.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {customBadges.map((badge) => (
                  <Stack
                    key={badge.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontSize={24}>{badge.icon || '🏅'}</Typography>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {badge.title}
                          {badge.isAnti && <Chip label="Anti" size="small" color="error" sx={{ ml: 1 }} />}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {badge.rarity} • {badge.shape} • {badge.category || 'General'}
                        </Typography>
                      </Box>
                    </Stack>
                    <IconButton size="small" onClick={() => removeCustomBadge(badge.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* Save button */}
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Stack>

      {/* Copy dialog */}
      <Dialog open={copyDialogOpen} onClose={() => setCopyDialogOpen(false)}>
        <DialogTitle>Copy Settings From</DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ pt: 1, minWidth: 300 }}>
            {sections
              .filter((s) => s.id !== sectionId)
              .map((s) => (
                <Button key={s.id} variant="outlined" onClick={() => copyFromSection(s.id)}>
                  {s.name}
                </Button>
              ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopyDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Custom badge creator dialog */}
      <CustomBadgeCreatorDialog
        open={showBadgeCreator}
        onClose={() => setShowBadgeCreator(false)}
        onSubmit={addCustomBadge}
      />

      {/* Snackbar */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />
    </Box>
  )
}

// ============================================================================
// Custom Badge Creator Dialog
// ============================================================================

function CustomBadgeCreatorDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (badge: CustomBadgeEntry) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [shape, setShape] = useState('circle')
  const [rarity, setRarity] = useState('common')
  const [category, setCategory] = useState('')
  const [isAnti, setIsAnti] = useState(false)
  const [holidayFilter, setHolidayFilter] = useState('')

  const filteredIcons = holidayFilter
    ? getIconsByHoliday(holidayFilter)
    : HOLIDAY_BADGE_ICONS

  const handleSubmit = () => {
    if (!title.trim()) return
    onSubmit({
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      description: description || undefined,
      icon: icon || '🏅',
      shape,
      rarity,
      category: category || undefined,
      isAnti,
    })
    // Reset
    setTitle('')
    setDescription('')
    setIcon('')
    setShape('circle')
    setRarity('common')
    setCategory('')
    setIsAnti(false)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Custom Badge</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Badge Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />

          {/* Icon picker */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Icon {icon && <span>— Selected: {icon}</span>}
            </Typography>
            <FormControl size="small" sx={{ mb: 1, minWidth: 200 }}>
              <InputLabel>Filter by holiday</InputLabel>
              <Select
                label="Filter by holiday"
                value={holidayFilter}
                onChange={(e) => setHolidayFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {getAllHolidays().map((h) => (
                  <MenuItem key={h} value={h}>{h}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: 150, overflow: 'auto' }}>
              {filteredIcons.map((ic) => (
                <IconButton
                  key={ic.id}
                  onClick={() => setIcon(ic.emoji)}
                  title={`${ic.label} (${ic.holiday})`}
                  sx={{
                    border: icon === ic.emoji ? 2 : 1,
                    borderColor: icon === ic.emoji ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    fontSize: 20,
                  }}
                >
                  {ic.emoji}
                </IconButton>
              ))}
            </Box>
          </Box>

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Shape</InputLabel>
              <Select label="Shape" value={shape} onChange={(e) => setShape(e.target.value)}>
                {BADGE_SHAPES.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Rarity</InputLabel>
              <Select label="Rarity" value={rarity} onChange={(e) => setRarity(e.target.value)}>
                {BADGE_RARITIES.map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <TextField
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Cultural, Academic, Social"
          />

          <FormControlLabel
            control={<Switch checked={isAnti} onChange={(e) => setIsAnti(e.target.checked)} />}
            label="Anti-Badge (penalty badge)"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!title.trim()}>
          Create Badge
        </Button>
      </DialogActions>
    </Dialog>
  )
}
