/**
 * BadgeVisualPicker — Visual editor for custom badge designs.
 * Lets instructors pick an icon from react-icons, choose shape, colors,
 * gradient, and animation to compose a custom badge appearance.
 *
 * @module BadgeVisualPicker
 */

import React, { useState, useMemo, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import ButtonBase from '@mui/material/ButtonBase'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Tooltip from '@mui/material/Tooltip'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import type { IconType } from 'react-icons'
import type { CustomBadgeVisual } from './BadgeEditor'
import { BadgeIcon } from './BadgeIcon'
import type { BadgeVisualConfig, BadgeShape, BadgeAnimationPreset } from './badgeRegistry'

// ============================================================================
// Curated icon collections from react-icons
// ============================================================================

// Game Icons (gi) — rich line-art
import {
  GiTrophy, GiCrown, GiDiamondHard, GiSwordsPower, GiShield,
  GiTargetShot, GiMagicLamp, GiRocket, GiFlame, GiSnowflake2,
  GiLightningBow, GiSpyglass, GiStarMedal, GiBrain, GiPalette,
  GiMountainRoad, GiCompass, GiCrossedSwords, GiBookCover,
  GiFireShield, GiLaurelCrown, GiCutDiamond, GiCalendar,
  GiMusicalNotes, GiMicroscope, GiAtom, GiDna1, GiPlanetCore,
  GiChemicalDrop, GiAbacus, GiAnvilImpact, GiArcheryTarget,
  GiArtificialIntelligence, GiCastleRuins, GiChessKnight,
  GiClockwork, GiCrystalBall, GiCyberEye, GiDragonBreath,
  GiFire, GiFlowerPot, GiGears, GiGlobe, Gi3dHammer,
  GiHeartPlus, GiIdea, GiJesterHat, GiKey, GiLightBulb,
  GiMagnifyingGlass, GiNinjaHead, GiOctopus, GiPaintBrush,
  GiQuillInk, GiRingedPlanet, GiScrollUnfurled, GiSpellBook,
  GiTeacher, GiTreasureMap, GiUnicorn, GiViolin,
  GiWaterDrop, GiYinYang, GiZeppelin,
} from 'react-icons/gi'

// Font Awesome (fa) — classic clean icons
import {
  FaStar, FaHeart, FaBolt, FaGem, FaCrown,
  FaMedal, FaAward, FaFire, FaRocket, FaBookOpen,
  FaGraduationCap, FaMountainSun, FaPuzzlePiece, FaWandMagicSparkles,
  FaHandshake, FaBullseye, FaLightbulb, FaCompass,
  FaPalette, FaDragon, FaFeather, FaShieldHalved,
} from 'react-icons/fa6'

// Material Design (md) — familiar Google style
import {
  MdEmojiEvents, MdWorkspacePremium, MdMilitaryTech,
  MdAutoAwesome, MdDiamond, MdStars,
  MdPsychology, MdSchool, MdScience, MdBiotech,
  MdExplore, MdRocketLaunch, MdLocalFireDepartment,
} from 'react-icons/md'

// ============================================================================
// Icon catalog — organized by category for the picker UI
// ============================================================================

interface IconEntry {
  name: string
  lib: string
  icon: IconType
  label: string
}

const ICON_CATALOG: { category: string; icons: IconEntry[] }[] = [
  {
    category: 'Awards & Trophies',
    icons: [
      { name: 'GiTrophy', lib: 'gi', icon: GiTrophy, label: 'Trophy' },
      { name: 'GiCrown', lib: 'gi', icon: GiCrown, label: 'Crown' },
      { name: 'GiLaurelCrown', lib: 'gi', icon: GiLaurelCrown, label: 'Laurel' },
      { name: 'GiStarMedal', lib: 'gi', icon: GiStarMedal, label: 'Star Medal' },
      { name: 'GiCutDiamond', lib: 'gi', icon: GiCutDiamond, label: 'Diamond' },
      { name: 'FaStar', lib: 'fa6', icon: FaStar, label: 'Star' },
      { name: 'FaMedal', lib: 'fa6', icon: FaMedal, label: 'Medal' },
      { name: 'FaAward', lib: 'fa6', icon: FaAward, label: 'Award' },
      { name: 'FaCrown', lib: 'fa6', icon: FaCrown, label: 'Crown' },
      { name: 'FaGem', lib: 'fa6', icon: FaGem, label: 'Gem' },
      { name: 'MdEmojiEvents', lib: 'md', icon: MdEmojiEvents, label: 'Events' },
      { name: 'MdWorkspacePremium', lib: 'md', icon: MdWorkspacePremium, label: 'Premium' },
      { name: 'MdMilitaryTech', lib: 'md', icon: MdMilitaryTech, label: 'Military' },
      { name: 'MdDiamond', lib: 'md', icon: MdDiamond, label: 'Diamond' },
      { name: 'MdStars', lib: 'md', icon: MdStars, label: 'Stars' },
    ],
  },
  {
    category: 'Combat & Adventure',
    icons: [
      { name: 'GiSwordsPower', lib: 'gi', icon: GiSwordsPower, label: 'Swords' },
      { name: 'GiShield', lib: 'gi', icon: GiShield, label: 'Shield' },
      { name: 'GiCrossedSwords', lib: 'gi', icon: GiCrossedSwords, label: 'Crossed Swords' },
      { name: 'GiFireShield', lib: 'gi', icon: GiFireShield, label: 'Fire Shield' },
      { name: 'GiLightningBow', lib: 'gi', icon: GiLightningBow, label: 'Lightning Bow' },
      { name: 'GiTargetShot', lib: 'gi', icon: GiTargetShot, label: 'Target' },
      { name: 'GiArcheryTarget', lib: 'gi', icon: GiArcheryTarget, label: 'Archery' },
      { name: 'GiChessKnight', lib: 'gi', icon: GiChessKnight, label: 'Chess Knight' },
      { name: 'GiDragonBreath', lib: 'gi', icon: GiDragonBreath, label: 'Dragon' },
      { name: 'GiNinjaHead', lib: 'gi', icon: GiNinjaHead, label: 'Ninja' },
      { name: 'GiCastleRuins', lib: 'gi', icon: GiCastleRuins, label: 'Castle' },
      { name: 'FaBolt', lib: 'fa6', icon: FaBolt, label: 'Bolt' },
      { name: 'FaDragon', lib: 'fa6', icon: FaDragon, label: 'Dragon' },
      { name: 'FaShieldHalved', lib: 'fa6', icon: FaShieldHalved, label: 'Shield' },
      { name: 'FaBullseye', lib: 'fa6', icon: FaBullseye, label: 'Bullseye' },
    ],
  },
  {
    category: 'Knowledge & Science',
    icons: [
      { name: 'GiBrain', lib: 'gi', icon: GiBrain, label: 'Brain' },
      { name: 'GiSpellBook', lib: 'gi', icon: GiSpellBook, label: 'Spell Book' },
      { name: 'GiBookCover', lib: 'gi', icon: GiBookCover, label: 'Book' },
      { name: 'GiScrollUnfurled', lib: 'gi', icon: GiScrollUnfurled, label: 'Scroll' },
      { name: 'GiMicroscope', lib: 'gi', icon: GiMicroscope, label: 'Microscope' },
      { name: 'GiAtom', lib: 'gi', icon: GiAtom, label: 'Atom' },
      { name: 'GiDna1', lib: 'gi', icon: GiDna1, label: 'DNA' },
      { name: 'GiAbacus', lib: 'gi', icon: GiAbacus, label: 'Abacus' },
      { name: 'GiTeacher', lib: 'gi', icon: GiTeacher, label: 'Teacher' },
      { name: 'FaBookOpen', lib: 'fa6', icon: FaBookOpen, label: 'Open Book' },
      { name: 'FaGraduationCap', lib: 'fa6', icon: FaGraduationCap, label: 'Graduation' },
      { name: 'FaLightbulb', lib: 'fa6', icon: FaLightbulb, label: 'Lightbulb' },
      { name: 'MdPsychology', lib: 'md', icon: MdPsychology, label: 'Psychology' },
      { name: 'MdSchool', lib: 'md', icon: MdSchool, label: 'School' },
      { name: 'MdScience', lib: 'md', icon: MdScience, label: 'Science' },
      { name: 'MdBiotech', lib: 'md', icon: MdBiotech, label: 'Biotech' },
    ],
  },
  {
    category: 'Nature & Elements',
    icons: [
      { name: 'GiFlame', lib: 'gi', icon: GiFlame, label: 'Flame' },
      { name: 'GiFire', lib: 'gi', icon: GiFire, label: 'Fire' },
      { name: 'GiSnowflake2', lib: 'gi', icon: GiSnowflake2, label: 'Snowflake' },
      { name: 'GiWaterDrop', lib: 'gi', icon: GiWaterDrop, label: 'Water Drop' },
      { name: 'GiChemicalDrop', lib: 'gi', icon: GiChemicalDrop, label: 'Chemical' },
      { name: 'GiFlowerPot', lib: 'gi', icon: GiFlowerPot, label: 'Flower' },
      { name: 'GiOctopus', lib: 'gi', icon: GiOctopus, label: 'Octopus' },
      { name: 'GiUnicorn', lib: 'gi', icon: GiUnicorn, label: 'Unicorn' },
      { name: 'GiPlanetCore', lib: 'gi', icon: GiPlanetCore, label: 'Planet' },
      { name: 'GiRingedPlanet', lib: 'gi', icon: GiRingedPlanet, label: 'Saturn' },
      { name: 'FaFire', lib: 'fa6', icon: FaFire, label: 'Fire' },
      { name: 'FaHeart', lib: 'fa6', icon: FaHeart, label: 'Heart' },
      { name: 'FaMountainSun', lib: 'fa6', icon: FaMountainSun, label: 'Mountain' },
      { name: 'MdLocalFireDepartment', lib: 'md', icon: MdLocalFireDepartment, label: 'Fire Dept' },
    ],
  },
  {
    category: 'Exploration & Tools',
    icons: [
      { name: 'GiSpyglass', lib: 'gi', icon: GiSpyglass, label: 'Spyglass' },
      { name: 'GiCompass', lib: 'gi', icon: GiCompass, label: 'Compass' },
      { name: 'GiMagnifyingGlass', lib: 'gi', icon: GiMagnifyingGlass, label: 'Magnifier' },
      { name: 'GiTreasureMap', lib: 'gi', icon: GiTreasureMap, label: 'Treasure Map' },
      { name: 'GiKey', lib: 'gi', icon: GiKey, label: 'Key' },
      { name: 'GiGears', lib: 'gi', icon: GiGears, label: 'Gears' },
      { name: 'GiClockwork', lib: 'gi', icon: GiClockwork, label: 'Clockwork' },
      { name: 'Gi3dHammer', lib: 'gi', icon: Gi3dHammer, label: 'Hammer' },
      { name: 'GiAnvilImpact', lib: 'gi', icon: GiAnvilImpact, label: 'Anvil' },
      { name: 'GiMountainRoad', lib: 'gi', icon: GiMountainRoad, label: 'Mountain Road' },
      { name: 'FaCompass', lib: 'fa6', icon: FaCompass, label: 'Compass' },
      { name: 'FaRocket', lib: 'fa6', icon: FaRocket, label: 'Rocket' },
      { name: 'FaHandshake', lib: 'fa6', icon: FaHandshake, label: 'Handshake' },
      { name: 'MdExplore', lib: 'md', icon: MdExplore, label: 'Explore' },
      { name: 'MdRocketLaunch', lib: 'md', icon: MdRocketLaunch, label: 'Rocket Launch' },
    ],
  },
  {
    category: 'Creative & Magic',
    icons: [
      { name: 'GiPalette', lib: 'gi', icon: GiPalette, label: 'Palette' },
      { name: 'GiPaintBrush', lib: 'gi', icon: GiPaintBrush, label: 'Paint Brush' },
      { name: 'GiQuillInk', lib: 'gi', icon: GiQuillInk, label: 'Quill & Ink' },
      { name: 'GiMusicalNotes', lib: 'gi', icon: GiMusicalNotes, label: 'Music' },
      { name: 'GiViolin', lib: 'gi', icon: GiViolin, label: 'Violin' },
      { name: 'GiMagicLamp', lib: 'gi', icon: GiMagicLamp, label: 'Magic Lamp' },
      { name: 'GiCrystalBall', lib: 'gi', icon: GiCrystalBall, label: 'Crystal Ball' },
      { name: 'GiJesterHat', lib: 'gi', icon: GiJesterHat, label: 'Jester' },
      { name: 'GiGlobe', lib: 'gi', icon: GiGlobe, label: 'Globe' },
      { name: 'GiYinYang', lib: 'gi', icon: GiYinYang, label: 'Yin Yang' },
      { name: 'GiRocket', lib: 'gi', icon: GiRocket, label: 'Rocket' },
      { name: 'GiZeppelin', lib: 'gi', icon: GiZeppelin, label: 'Zeppelin' },
      { name: 'GiIdea', lib: 'gi', icon: GiIdea, label: 'Idea' },
      { name: 'GiLightBulb', lib: 'gi', icon: GiLightBulb, label: 'Light Bulb' },
      { name: 'GiHeartPlus', lib: 'gi', icon: GiHeartPlus, label: 'Heart Plus' },
      { name: 'FaPalette', lib: 'fa6', icon: FaPalette, label: 'Palette' },
      { name: 'FaPuzzlePiece', lib: 'fa6', icon: FaPuzzlePiece, label: 'Puzzle' },
      { name: 'FaWandMagicSparkles', lib: 'fa6', icon: FaWandMagicSparkles, label: 'Wand' },
      { name: 'FaFeather', lib: 'fa6', icon: FaFeather, label: 'Feather' },
      { name: 'MdAutoAwesome', lib: 'md', icon: MdAutoAwesome, label: 'Sparkle' },
    ],
  },
  {
    category: 'Tech & AI',
    icons: [
      { name: 'GiArtificialIntelligence', lib: 'gi', icon: GiArtificialIntelligence, label: 'AI' },
      { name: 'GiCyberEye', lib: 'gi', icon: GiCyberEye, label: 'Cyber Eye' },
    ],
  },
]

/** Flat map of iconName → IconType for resolving saved badges */
const ICON_MAP: Record<string, IconType> = {}
for (const cat of ICON_CATALOG) {
  for (const entry of cat.icons) {
    ICON_MAP[entry.name] = entry.icon
  }
}

/** Resolve a saved icon name to its IconType component */
export function resolveIcon(iconName: string): IconType | undefined {
  return ICON_MAP[iconName]
}

/** Get the full icon catalog for picker UI */
export function getIconCatalog() {
  return ICON_CATALOG
}

// ============================================================================
// Preset color palettes
// ============================================================================

const COLOR_PRESETS = [
  '#4caf50', '#2196f3', '#f44336', '#ff9800', '#9c27b0',
  '#00bcd4', '#e91e63', '#3f51b5', '#009688', '#ff5722',
  '#795548', '#607d8b', '#8bc34a', '#ffc107', '#673ab7',
  '#1a237e', '#b71c1c', '#1b5e20', '#f57f17', '#4a148c',
]

const GRADIENT_PRESETS: { label: string; gradient: BadgeVisualConfig['gradient'] }[] = [
  { label: 'None', gradient: undefined },
  {
    label: 'Gold',
    gradient: {
      type: 'linear', angle: '135deg',
      stops: [{ color: '#ffd700', position: '0%' }, { color: '#b8860b', position: '100%' }],
    },
  },
  {
    label: 'Ocean',
    gradient: {
      type: 'linear', angle: '135deg',
      stops: [{ color: '#00bcd4', position: '0%' }, { color: '#1a237e', position: '100%' }],
    },
  },
  {
    label: 'Fire',
    gradient: {
      type: 'linear', angle: '135deg',
      stops: [{ color: '#ff9800', position: '0%' }, { color: '#f44336', position: '100%' }],
    },
  },
  {
    label: 'Forest',
    gradient: {
      type: 'linear', angle: '135deg',
      stops: [{ color: '#66bb6a', position: '0%' }, { color: '#1b5e20', position: '100%' }],
    },
  },
  {
    label: 'Cosmic',
    gradient: {
      type: 'radial',
      stops: [{ color: '#7c4dff', position: '0%' }, { color: '#1a237e', position: '100%' }],
    },
  },
  {
    label: 'Sunset',
    gradient: {
      type: 'linear', angle: '135deg',
      stops: [{ color: '#e91e63', position: '0%' }, { color: '#ff9800', position: '100%' }],
    },
  },
  {
    label: 'Frost',
    gradient: {
      type: 'linear', angle: '135deg',
      stops: [{ color: '#e3f2fd', position: '0%' }, { color: '#1565c0', position: '100%' }],
    },
  },
]

const SHAPE_OPTIONS: { value: BadgeShape; label: string }[] = [
  { value: 'circle', label: 'Circle' },
  { value: 'hexagon', label: 'Hexagon' },
  { value: 'shield', label: 'Shield' },
  { value: 'diamond', label: 'Diamond' },
]

const ANIMATION_OPTIONS: { value: BadgeAnimationPreset; label: string }[] = [
  { value: 'draw', label: 'Draw' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'bounce-in', label: 'Bounce' },
  { value: 'spin-in', label: 'Spin' },
  { value: 'glow', label: 'Glow' },
  { value: 'shake', label: 'Shake' },
  { value: 'none', label: 'None' },
]

// ============================================================================
// Component
// ============================================================================

export interface BadgeVisualPickerProps {
  /** Current visual configuration */
  value: CustomBadgeVisual
  /** Called when the visual changes */
  onChange: (visual: CustomBadgeVisual) => void
}

export function BadgeVisualPicker({ value, onChange }: BadgeVisualPickerProps) {
  const [iconTab, setIconTab] = useState(0)
  const [iconSearch, setIconSearch] = useState('')

  const selectedIcon = useMemo(() => resolveIcon(value.iconName), [value.iconName])

  // Build a preview config for BadgeIcon
  const previewConfig = useMemo((): BadgeVisualConfig => ({
    icon: selectedIcon || GiTrophy,
    name: 'Preview',
    description: '',
    bgColor: value.bgColor,
    gradient: value.gradient,
    iconColor: value.iconColor,
    shape: value.shape,
    animation: value.animation,
    category: 'core',
    rarity: 'common',
  }), [selectedIcon, value])

  const filteredIcons = useMemo(() => {
    if (!iconSearch.trim()) return ICON_CATALOG
    const q = iconSearch.toLowerCase()
    return ICON_CATALOG.map((cat) => ({
      ...cat,
      icons: cat.icons.filter((i) =>
        i.label.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.icons.length > 0)
  }, [iconSearch])

  const handleChange = useCallback(
    (partial: Partial<CustomBadgeVisual>) => {
      onChange({ ...value, ...partial })
    },
    [value, onChange],
  )

  return (
    <Box>
      {/* ---- Live Preview ---- */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
        <BadgeIcon config={previewConfig} size={72} earned animate />
        <Box>
          <Typography variant="caption" color="text.secondary">Live Preview</Typography>
          <Typography variant="body2" fontWeight={600}>
            {selectedIcon ? value.iconName.replace(/^(Gi|Fa|Md|Hi)/, '') : 'Choose an icon'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {value.shape} · {value.animation}
          </Typography>
        </Box>
      </Box>

      {/* ---- Icon Picker ---- */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
        Icon
      </Typography>
      <TextField
        size="small"
        placeholder="Search icons..."
        value={iconSearch}
        onChange={(e) => setIconSearch(e.target.value)}
        fullWidth
        sx={{ mb: 1 }}
      />
      <Tabs
        value={iconTab}
        onChange={(_, v) => setIconTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 1, minHeight: 32, '& .MuiTab-root': { minHeight: 32, py: 0, fontSize: '0.7rem' } }}
      >
        {(iconSearch ? filteredIcons : ICON_CATALOG).map((cat, i) => (
          <Tab key={cat.category} label={cat.category} value={i} />
        ))}
      </Tabs>
      <Box sx={{ maxHeight: 160, overflow: 'auto', mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {(iconSearch ? filteredIcons : ICON_CATALOG)[iconTab]?.icons.map((entry) => {
            const Icon = entry.icon
            const isSelected = value.iconName === entry.name
            return (
              <Tooltip key={entry.name} title={entry.label} placement="top">
                <ButtonBase
                  onClick={() => handleChange({ iconName: entry.name, iconLib: entry.lib })}
                  sx={{
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    border: isSelected ? '2px solid' : '1px solid transparent',
                    borderColor: isSelected ? 'primary.main' : 'transparent',
                    bgcolor: isSelected ? 'primary.light' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Icon size={22} />
                </ButtonBase>
              </Tooltip>
            )
          })}
        </Box>
      </Box>

      {/* ---- Shape ---- */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
        Shape
      </Typography>
      <ToggleButtonGroup
        value={value.shape}
        exclusive
        onChange={(_, v) => v && handleChange({ shape: v })}
        size="small"
        sx={{ mb: 2, '& .MuiToggleButton-root': { px: 1.5, py: 0.5, fontSize: '0.75rem' } }}
      >
        {SHAPE_OPTIONS.map((s) => (
          <ToggleButton key={s.value} value={s.value}>
            {s.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* ---- Colors ---- */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
            Background
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
            {COLOR_PRESETS.map((c) => (
              <ButtonBase
                key={c}
                onClick={() => handleChange({ bgColor: c })}
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  bgcolor: c,
                  border: value.bgColor === c ? '2px solid white' : 'none',
                  boxShadow: value.bgColor === c ? `0 0 0 2px ${c}` : 'none',
                }}
              />
            ))}
          </Box>
          <TextField
            size="small"
            type="color"
            value={value.bgColor}
            onChange={(e) => handleChange({ bgColor: e.target.value })}
            sx={{ width: 80 }}
          />
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
            Icon Color
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ mb: 0.5 }}>
            {['#ffffff', '#000000', '#ffd700', '#1a237e'].map((c) => (
              <ButtonBase
                key={c}
                onClick={() => handleChange({ iconColor: c })}
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  bgcolor: c,
                  border: '1px solid',
                  borderColor: value.iconColor === c ? 'primary.main' : 'divider',
                }}
              />
            ))}
          </Stack>
          <TextField
            size="small"
            type="color"
            value={value.iconColor}
            onChange={(e) => handleChange({ iconColor: e.target.value })}
            sx={{ width: 80 }}
          />
        </Box>
      </Stack>

      {/* ---- Gradient ---- */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
        Gradient Preset
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
        {GRADIENT_PRESETS.map((gp) => {
          const isSelected = JSON.stringify(value.gradient) === JSON.stringify(gp.gradient)
          const bg = gp.gradient
            ? `${gp.gradient.type}-gradient(${gp.gradient.angle || 'circle'}, ${gp.gradient.stops.map((s) => `${s.color} ${s.position}`).join(', ')})`
            : '#ccc'
          return (
            <Tooltip key={gp.label} title={gp.label}>
              <ButtonBase
                onClick={() => handleChange({ gradient: gp.gradient })}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  background: bg,
                  border: isSelected ? '2px solid' : '1px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.55rem',
                  color: gp.gradient ? '#fff' : 'text.secondary',
                }}
              >
                {!gp.gradient && '∅'}
              </ButtonBase>
            </Tooltip>
          )
        })}
      </Box>

      {/* ---- Animation ---- */}
      <FormControl size="small" fullWidth sx={{ mb: 1 }}>
        <InputLabel>Animation</InputLabel>
        <Select
          value={value.animation}
          label="Animation"
          onChange={(e) => handleChange({ animation: e.target.value as BadgeAnimationPreset })}
        >
          {ANIMATION_OPTIONS.map((a) => (
            <MenuItem key={a.value} value={a.value}>
              {a.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}

export default BadgeVisualPicker
