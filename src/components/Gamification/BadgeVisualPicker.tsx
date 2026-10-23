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
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
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
import { useTranslations } from 'next-intl'
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

const ICON_CATALOG: { id: string; category: string; icons: IconEntry[] }[] = [
  {
    id: 'awards',
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
    id: 'combat',
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
    id: 'knowledge',
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
    id: 'nature',
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
    id: 'exploration',
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
    id: 'creative',
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
    id: 'tech',
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

const ICON_COLOR_PRESETS = ['#ffffff', '#000000', '#ffd700', '#1a237e']

/** CSS background for a gradient preset swatch */
function gradientSwatchBackground(gradient: BadgeVisualConfig['gradient']): string {
  if (!gradient) return '#ccc'
  const stops = gradient.stops.map((s) => `${s.color} ${s.position}`).join(', ')
  return `${gradient.type}-gradient(${gradient.angle || 'circle'}, ${stops})`
}

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

/** Translated picker labels; data constants keep English labels for the exported catalog API */
function useVisualPickerLabels() {
  const t = useTranslations('components')
  return useMemo(
    () => ({
      categories: {
        awards: t('badgeVisualPicker.categoryAwards'),
        combat: t('badgeVisualPicker.categoryCombat'),
        knowledge: t('badgeVisualPicker.categoryKnowledge'),
        nature: t('badgeVisualPicker.categoryNature'),
        exploration: t('badgeVisualPicker.categoryExploration'),
        creative: t('badgeVisualPicker.categoryCreative'),
        tech: t('badgeVisualPicker.categoryTech'),
      } as Record<string, string>,
      icons: {
        GiTrophy: t('badgeVisualPicker.icons.giTrophy'),
        GiCrown: t('badgeVisualPicker.icons.giCrown'),
        GiLaurelCrown: t('badgeVisualPicker.icons.giLaurelCrown'),
        GiStarMedal: t('badgeVisualPicker.icons.giStarMedal'),
        GiCutDiamond: t('badgeVisualPicker.icons.giCutDiamond'),
        FaStar: t('badgeVisualPicker.icons.faStar'),
        FaMedal: t('badgeVisualPicker.icons.faMedal'),
        FaAward: t('badgeVisualPicker.icons.faAward'),
        FaCrown: t('badgeVisualPicker.icons.faCrown'),
        FaGem: t('badgeVisualPicker.icons.faGem'),
        MdEmojiEvents: t('badgeVisualPicker.icons.mdEmojiEvents'),
        MdWorkspacePremium: t('badgeVisualPicker.icons.mdWorkspacePremium'),
        MdMilitaryTech: t('badgeVisualPicker.icons.mdMilitaryTech'),
        MdDiamond: t('badgeVisualPicker.icons.mdDiamond'),
        MdStars: t('badgeVisualPicker.icons.mdStars'),
        GiSwordsPower: t('badgeVisualPicker.icons.giSwordsPower'),
        GiShield: t('badgeVisualPicker.icons.giShield'),
        GiCrossedSwords: t('badgeVisualPicker.icons.giCrossedSwords'),
        GiFireShield: t('badgeVisualPicker.icons.giFireShield'),
        GiLightningBow: t('badgeVisualPicker.icons.giLightningBow'),
        GiTargetShot: t('badgeVisualPicker.icons.giTargetShot'),
        GiArcheryTarget: t('badgeVisualPicker.icons.giArcheryTarget'),
        GiChessKnight: t('badgeVisualPicker.icons.giChessKnight'),
        GiDragonBreath: t('badgeVisualPicker.icons.giDragonBreath'),
        GiNinjaHead: t('badgeVisualPicker.icons.giNinjaHead'),
        GiCastleRuins: t('badgeVisualPicker.icons.giCastleRuins'),
        FaBolt: t('badgeVisualPicker.icons.faBolt'),
        FaDragon: t('badgeVisualPicker.icons.faDragon'),
        FaShieldHalved: t('badgeVisualPicker.icons.faShieldHalved'),
        FaBullseye: t('badgeVisualPicker.icons.faBullseye'),
        GiBrain: t('badgeVisualPicker.icons.giBrain'),
        GiSpellBook: t('badgeVisualPicker.icons.giSpellBook'),
        GiBookCover: t('badgeVisualPicker.icons.giBookCover'),
        GiScrollUnfurled: t('badgeVisualPicker.icons.giScrollUnfurled'),
        GiMicroscope: t('badgeVisualPicker.icons.giMicroscope'),
        GiAtom: t('badgeVisualPicker.icons.giAtom'),
        GiDna1: t('badgeVisualPicker.icons.giDna1'),
        GiAbacus: t('badgeVisualPicker.icons.giAbacus'),
        GiTeacher: t('badgeVisualPicker.icons.giTeacher'),
        FaBookOpen: t('badgeVisualPicker.icons.faBookOpen'),
        FaGraduationCap: t('badgeVisualPicker.icons.faGraduationCap'),
        FaLightbulb: t('badgeVisualPicker.icons.faLightbulb'),
        MdPsychology: t('badgeVisualPicker.icons.mdPsychology'),
        MdSchool: t('badgeVisualPicker.icons.mdSchool'),
        MdScience: t('badgeVisualPicker.icons.mdScience'),
        MdBiotech: t('badgeVisualPicker.icons.mdBiotech'),
        GiFlame: t('badgeVisualPicker.icons.giFlame'),
        GiFire: t('badgeVisualPicker.icons.giFire'),
        GiSnowflake2: t('badgeVisualPicker.icons.giSnowflake2'),
        GiWaterDrop: t('badgeVisualPicker.icons.giWaterDrop'),
        GiChemicalDrop: t('badgeVisualPicker.icons.giChemicalDrop'),
        GiFlowerPot: t('badgeVisualPicker.icons.giFlowerPot'),
        GiOctopus: t('badgeVisualPicker.icons.giOctopus'),
        GiUnicorn: t('badgeVisualPicker.icons.giUnicorn'),
        GiPlanetCore: t('badgeVisualPicker.icons.giPlanetCore'),
        GiRingedPlanet: t('badgeVisualPicker.icons.giRingedPlanet'),
        FaFire: t('badgeVisualPicker.icons.faFire'),
        FaHeart: t('badgeVisualPicker.icons.faHeart'),
        FaMountainSun: t('badgeVisualPicker.icons.faMountainSun'),
        MdLocalFireDepartment: t('badgeVisualPicker.icons.mdLocalFireDepartment'),
        GiSpyglass: t('badgeVisualPicker.icons.giSpyglass'),
        GiCompass: t('badgeVisualPicker.icons.giCompass'),
        GiMagnifyingGlass: t('badgeVisualPicker.icons.giMagnifyingGlass'),
        GiTreasureMap: t('badgeVisualPicker.icons.giTreasureMap'),
        GiKey: t('badgeVisualPicker.icons.giKey'),
        GiGears: t('badgeVisualPicker.icons.giGears'),
        GiClockwork: t('badgeVisualPicker.icons.giClockwork'),
        Gi3dHammer: t('badgeVisualPicker.icons.gi3dHammer'),
        GiAnvilImpact: t('badgeVisualPicker.icons.giAnvilImpact'),
        GiMountainRoad: t('badgeVisualPicker.icons.giMountainRoad'),
        FaCompass: t('badgeVisualPicker.icons.faCompass'),
        FaRocket: t('badgeVisualPicker.icons.faRocket'),
        FaHandshake: t('badgeVisualPicker.icons.faHandshake'),
        MdExplore: t('badgeVisualPicker.icons.mdExplore'),
        MdRocketLaunch: t('badgeVisualPicker.icons.mdRocketLaunch'),
        GiPalette: t('badgeVisualPicker.icons.giPalette'),
        GiPaintBrush: t('badgeVisualPicker.icons.giPaintBrush'),
        GiQuillInk: t('badgeVisualPicker.icons.giQuillInk'),
        GiMusicalNotes: t('badgeVisualPicker.icons.giMusicalNotes'),
        GiViolin: t('badgeVisualPicker.icons.giViolin'),
        GiMagicLamp: t('badgeVisualPicker.icons.giMagicLamp'),
        GiCrystalBall: t('badgeVisualPicker.icons.giCrystalBall'),
        GiJesterHat: t('badgeVisualPicker.icons.giJesterHat'),
        GiGlobe: t('badgeVisualPicker.icons.giGlobe'),
        GiYinYang: t('badgeVisualPicker.icons.giYinYang'),
        GiRocket: t('badgeVisualPicker.icons.giRocket'),
        GiZeppelin: t('badgeVisualPicker.icons.giZeppelin'),
        GiIdea: t('badgeVisualPicker.icons.giIdea'),
        GiLightBulb: t('badgeVisualPicker.icons.giLightBulb'),
        GiHeartPlus: t('badgeVisualPicker.icons.giHeartPlus'),
        FaPalette: t('badgeVisualPicker.icons.faPalette'),
        FaPuzzlePiece: t('badgeVisualPicker.icons.faPuzzlePiece'),
        FaWandMagicSparkles: t('badgeVisualPicker.icons.faWandMagicSparkles'),
        FaFeather: t('badgeVisualPicker.icons.faFeather'),
        MdAutoAwesome: t('badgeVisualPicker.icons.mdAutoAwesome'),
        GiArtificialIntelligence: t('badgeVisualPicker.icons.giArtificialIntelligence'),
        GiCyberEye: t('badgeVisualPicker.icons.giCyberEye'),
      } as Record<string, string>,
      gradients: {
        None: t('badgeVisualPicker.gradientNone'),
        Gold: t('badgeVisualPicker.gradientGold'),
        Ocean: t('badgeVisualPicker.gradientOcean'),
        Fire: t('badgeVisualPicker.gradientFire'),
        Forest: t('badgeVisualPicker.gradientForest'),
        Cosmic: t('badgeVisualPicker.gradientCosmic'),
        Sunset: t('badgeVisualPicker.gradientSunset'),
        Frost: t('badgeVisualPicker.gradientFrost'),
      } as Record<string, string>,
      shapes: {
        circle: t('badgeVisualPicker.shapeCircle'),
        hexagon: t('badgeVisualPicker.shapeHexagon'),
        shield: t('badgeVisualPicker.shapeShield'),
        diamond: t('badgeVisualPicker.shapeDiamond'),
      } as Record<string, string>,
      animations: {
        draw: t('badgeVisualPicker.animationDraw'),
        pulse: t('badgeVisualPicker.animationPulse'),
        'bounce-in': t('badgeVisualPicker.animationBounceIn'),
        'spin-in': t('badgeVisualPicker.animationSpinIn'),
        glow: t('badgeVisualPicker.animationGlow'),
        shake: t('badgeVisualPicker.animationShake'),
        none: t('badgeVisualPicker.animationNone'),
      } as Record<string, string>,
    }),
    [t],
  )
}

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
  const t = useTranslations('components')
  const labels = useVisualPickerLabels()
  const [iconTab, setIconTab] = useState(0)
  const [iconSearch, setIconSearch] = useState('')
  const [customGradientOpen, setCustomGradientOpen] = useState(false)

  const selectedIcon = useMemo(() => resolveIcon(value.iconName), [value.iconName])

  // Build a preview config for BadgeIcon
  const previewConfig = useMemo((): BadgeVisualConfig => ({
    icon: selectedIcon || GiTrophy,
    name: t('badgeVisualPicker.previewName'),
    description: '',
    bgColor: value.bgColor,
    gradient: value.gradient,
    iconColor: value.iconColor,
    shape: value.shape,
    animation: value.animation,
    category: 'core',
    rarity: 'common',
  }), [selectedIcon, value, t])

  const filteredIcons = useMemo(() => {
    if (!iconSearch.trim()) return ICON_CATALOG
    const q = iconSearch.toLowerCase()
    return ICON_CATALOG.map((cat) => ({
      ...cat,
      icons: cat.icons.filter((i) =>
        (labels.icons[i.name] ?? i.label).toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.icons.length > 0)
  }, [iconSearch, labels])

  const handleChange = useCallback(
    (partial: Partial<CustomBadgeVisual>) => {
      onChange({ ...value, ...partial })
    },
    [value, onChange],
  )

  return (
    <Box>
      {/* ---- Live Preview ---- */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider', position: 'sticky', top: 0, zIndex: 1 }}>
        <BadgeIcon config={previewConfig} size={72} earned animate />
        <Box>
          <Typography variant="caption" color="text.secondary">{t('badgeVisualPicker.livePreview')}</Typography>
          <Typography variant="body2" fontWeight={600}>
            {selectedIcon ? value.iconName.replace(/^(Gi|Fa|Md|Hi)/, '') : t('badgeVisualPicker.chooseIcon')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('badgeVisualPicker.previewMeta', {
              shape: labels.shapes[value.shape] ?? value.shape,
              animation: labels.animations[value.animation] ?? value.animation,
            })}
          </Typography>
        </Box>
      </Box>

      {/* ---- Icon Picker ---- */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
        {t('badgeVisualPicker.icon')}
      </Typography>
      <TextField
        size="small"
        placeholder={t('badgeVisualPicker.searchIcons')}
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
          <Tab key={cat.id} label={labels.categories[cat.id] ?? cat.category} value={i} />
        ))}
      </Tabs>
      <Box sx={{ maxHeight: 160, overflow: 'auto', mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {(iconSearch ? filteredIcons : ICON_CATALOG)[iconTab]?.icons.map((entry) => {
            const Icon = entry.icon
            const isSelected = value.iconName === entry.name
            return (
              <Tooltip key={entry.name} title={labels.icons[entry.name] ?? entry.label} placement="top">
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
        {t('badgeVisualPicker.shape')}
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
            {labels.shapes[s.value] ?? s.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* ---- Colors ---- */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
            {t('badgeVisualPicker.background')}
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
            {t('badgeVisualPicker.iconColor')}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ mb: 0.5 }}>
            {ICON_COLOR_PRESETS.map((c) => (
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
        {t('badgeVisualPicker.gradientPreset')}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
        {GRADIENT_PRESETS.map((gp) => {
          const isSelected = JSON.stringify(value.gradient) === JSON.stringify(gp.gradient)
          const bg = gradientSwatchBackground(gp.gradient)
          return (
            <Tooltip key={gp.label} title={labels.gradients[gp.label] ?? gp.label}>
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

      {/* ---- Custom Gradient ---- */}
      <Button
        size="small"
        variant={customGradientOpen ? 'contained' : 'outlined'}
        onClick={() => setCustomGradientOpen((v) => !v)}
        sx={{ mb: 1, fontSize: '0.7rem', textTransform: 'none' }}
      >
        {customGradientOpen ? t('badgeVisualPicker.hideCustomGradient') : t('badgeVisualPicker.customGradient')}
      </Button>
      <Collapse in={customGradientOpen}>
        <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, mb: 2 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <ToggleButtonGroup
              value={value.gradient?.type ?? 'linear'}
              exclusive
              size="small"
              onChange={(_, v) => {
                if (!v) return
                const base = value.gradient ?? { type: 'linear' as const, angle: '135deg', stops: [{ color: '#4caf50', position: '0%' }, { color: '#1a237e', position: '100%' }] }
                handleChange({ gradient: { ...base, type: v } })
              }}
            >
              <ToggleButton value="linear" sx={{ fontSize: '0.7rem', py: 0.5, px: 1.5 }}>{t('badgeVisualPicker.linear')}</ToggleButton>
              <ToggleButton value="radial" sx={{ fontSize: '0.7rem', py: 0.5, px: 1.5 }}>{t('badgeVisualPicker.radial')}</ToggleButton>
            </ToggleButtonGroup>
            {(value.gradient?.type ?? 'linear') === 'linear' && (
              <TextField
                size="small"
                label={t('badgeVisualPicker.angle')}
                placeholder="135deg"
                value={value.gradient?.angle ?? '135deg'}
                onChange={(e) => {
                  const base = value.gradient ?? { type: 'linear' as const, angle: '135deg', stops: [{ color: '#4caf50', position: '0%' }, { color: '#1a237e', position: '100%' }] }
                  handleChange({ gradient: { ...base, angle: e.target.value } })
                }}
                sx={{ width: 100 }}
              />
            )}
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ width: 80, flexShrink: 0 }}>{t('badgeVisualPicker.start')}</Typography>
            <TextField
              type="color"
              size="small"
              value={value.gradient?.stops[0]?.color ?? '#4caf50'}
              onChange={(e) => {
                const base = value.gradient ?? { type: 'linear' as const, angle: '135deg', stops: [{ color: '#4caf50', position: '0%' }, { color: '#1a237e', position: '100%' }] }
                handleChange({ gradient: { ...base, stops: [{ color: e.target.value, position: base.stops[0]?.position ?? '0%' }, base.stops[1] ?? { color: '#1a237e', position: '100%' }] } })
              }}
              sx={{ width: 60 }}
            />
            <TextField
              size="small"
              label={t('badgeVisualPicker.position')}
              placeholder="0%"
              value={value.gradient?.stops[0]?.position ?? '0%'}
              onChange={(e) => {
                const base = value.gradient ?? { type: 'linear' as const, angle: '135deg', stops: [{ color: '#4caf50', position: '0%' }, { color: '#1a237e', position: '100%' }] }
                handleChange({ gradient: { ...base, stops: [{ color: base.stops[0]?.color ?? '#4caf50', position: e.target.value }, base.stops[1] ?? { color: '#1a237e', position: '100%' }] } })
              }}
              sx={{ width: 80 }}
            />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" sx={{ width: 80, flexShrink: 0 }}>{t('badgeVisualPicker.end')}</Typography>
            <TextField
              type="color"
              size="small"
              value={value.gradient?.stops[1]?.color ?? '#1a237e'}
              onChange={(e) => {
                const base = value.gradient ?? { type: 'linear' as const, angle: '135deg', stops: [{ color: '#4caf50', position: '0%' }, { color: '#1a237e', position: '100%' }] }
                handleChange({ gradient: { ...base, stops: [base.stops[0] ?? { color: '#4caf50', position: '0%' }, { color: e.target.value, position: base.stops[1]?.position ?? '100%' }] } })
              }}
              sx={{ width: 60 }}
            />
            <TextField
              size="small"
              label={t('badgeVisualPicker.position')}
              placeholder="100%"
              value={value.gradient?.stops[1]?.position ?? '100%'}
              onChange={(e) => {
                const base = value.gradient ?? { type: 'linear' as const, angle: '135deg', stops: [{ color: '#4caf50', position: '0%' }, { color: '#1a237e', position: '100%' }] }
                handleChange({ gradient: { ...base, stops: [base.stops[0] ?? { color: '#4caf50', position: '0%' }, { color: base.stops[1]?.color ?? '#1a237e', position: e.target.value }] } })
              }}
              sx={{ width: 80 }}
            />
          </Stack>
        </Box>
      </Collapse>

      {/* ---- Animation ---- */}
      <FormControl size="small" fullWidth sx={{ mb: 1 }}>
        <InputLabel>{t('badgeVisualPicker.animation')}</InputLabel>
        <Select
          value={value.animation}
          label={t('badgeVisualPicker.animation')}
          onChange={(e) => handleChange({ animation: e.target.value as BadgeAnimationPreset })}
        >
          {ANIMATION_OPTIONS.map((a) => (
            <MenuItem key={a.value} value={a.value}>
              {labels.animations[a.value] ?? a.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}

export default BadgeVisualPicker
