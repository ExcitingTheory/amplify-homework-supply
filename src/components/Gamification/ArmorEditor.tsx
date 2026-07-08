/**
 * ArmorEditor — Modal UI for designing a squad coat of arms.
 *
 * Features:
 *   - 4 shield shapes (Classic, Rounded, Pointed, Diamond)
 *   - 10 plain-English colors with swatches
 *   - 4 field divisions (None, Halved, Quartered, Diagonal)
 *   - 10 SVG-path charges (star, cross, lightning, etc.)
 *   - Randomize button for instant inspiration
 *   - Live SVG preview
 *   - Full undo/redo stack with Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z
 *   - Squad name & description as Lexical plain text editors
 *   - Autosave on change (debounced)
 *
 * @module ArmorEditor
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { CHARGES, CHARGE_VIEWBOX } from './armoriaCharges'
import type { ChargeEntry } from './armoriaCharges'
import { useArmorUndoRedo } from './useArmorUndoRedo'
import { sanitizeSvg } from '../../utils/sanitizeHtml'
import type { ArmorEditorSnapshot } from './useArmorUndoRedo'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import Slider from '@mui/material/Slider'
import Tooltip from '@mui/material/Tooltip'
import CasinoIcon from '@mui/icons-material/Casino'
import UndoIcon from '@mui/icons-material/Undo'
import RedoIcon from '@mui/icons-material/Redo'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'

// ============================================================================
// Shield shapes — SVG paths in a 100×100 viewBox
// ============================================================================

interface ShapeEntry { id: string; label: string; path: string }

const SHIELD_SHAPES: ShapeEntry[] = [
  { id: 'classic', label: 'Classic', path: 'M10,2 L90,2 L90,60 Q90,95 50,98 Q10,95 10,60 Z' },
  { id: 'rounded', label: 'Rounded', path: 'M10,2 Q10,2 10,2 L90,2 Q95,2 95,8 L95,55 Q95,95 50,98 Q5,95 5,55 L5,8 Q5,2 10,2 Z' },
  { id: 'pointed', label: 'Pointed', path: 'M10,2 L90,2 L90,50 L50,98 L10,50 Z' },
  { id: 'diamond', label: 'Diamond', path: 'M50,2 L90,40 L50,98 L10,40 Z' },
  { id: 'heater', label: 'Heater', path: 'M10,2 L90,2 L90,55 Q90,80 50,98 Q10,80 10,55 Z' },
  { id: 'oval', label: 'Oval', path: 'M50,2 Q90,2 90,50 Q90,98 50,98 Q10,98 10,50 Q10,2 50,2 Z' },
  { id: 'square', label: 'Square', path: 'M8,2 L92,2 L92,92 L8,92 Z' },
  { id: 'kite', label: 'Kite', path: 'M50,2 L85,30 L50,98 L15,30 Z' },
  { id: 'swiss', label: 'Swiss', path: 'M10,2 L90,2 L90,65 Q90,85 70,92 L50,98 L30,92 Q10,85 10,65 Z' },
  { id: 'french', label: 'French', path: 'M10,2 L90,2 L90,70 Q90,90 75,95 L50,98 L25,95 Q10,90 10,70 Z' },
  { id: 'horsehead', label: 'Horse Head', path: 'M15,2 L85,2 Q92,2 92,10 L92,60 Q92,75 80,85 L50,98 L20,85 Q8,75 8,60 L8,10 Q8,2 15,2 Z' },
  { id: 'banner', label: 'Banner', path: 'M5,5 L95,5 L95,80 L50,95 L5,80 Z' },
]

// ============================================================================
// Colors — plain English, student-friendly
// ============================================================================

interface ColorEntry { id: string; label: string; hex: string }

const COLORS: ColorEntry[] = [
  { id: 'blue', label: 'Blue', hex: '#1565c0' },
  { id: 'red', label: 'Red', hex: '#c62828' },
  { id: 'green', label: 'Green', hex: '#2e7d32' },
  { id: 'purple', label: 'Purple', hex: '#6a1b9a' },
  { id: 'gold', label: 'Gold', hex: '#f9a825' },
  { id: 'orange', label: 'Orange', hex: '#e65100' },
  { id: 'teal', label: 'Teal', hex: '#00838f' },
  { id: 'black', label: 'Black', hex: '#212121' },
  { id: 'silver', label: 'Silver', hex: '#bdbdbd' },
  { id: 'white', label: 'White', hex: '#f5f5f5' },
]

// ============================================================================
// Field divisions
// ============================================================================

interface DivisionEntry { id: string; label: string; group: 'split' | 'ordinary' }

const DIVISIONS: DivisionEntry[] = [
  // Field splits — how the background is divided
  { id: 'none', label: 'Solid', group: 'split' },
  { id: 'halved', label: 'Halved', group: 'split' },
  { id: 'horizontal', label: 'Horizontal Split', group: 'split' },
  { id: 'quartered', label: 'Quartered', group: 'split' },
  { id: 'diagonal-right', label: 'Diagonal Right', group: 'split' },
  { id: 'diagonal-left', label: 'Diagonal Left', group: 'split' },
  { id: 'x-split', label: 'X Split', group: 'split' },
  { id: 'chevron-split', label: 'Chevron Split', group: 'split' },
  // Ordinaries — bands and stripes overlaid on the field
  { id: 'fess', label: 'Horizontal Band', group: 'ordinary' },
  { id: 'pale', label: 'Vertical Band', group: 'ordinary' },
  { id: 'bend', label: 'Diagonal Band', group: 'ordinary' },
  { id: 'chevron', label: 'Chevron', group: 'ordinary' },
  { id: 'chief', label: 'Top Band', group: 'ordinary' },
  { id: 'saltire', label: 'X Band', group: 'ordinary' },
  { id: 'cross-band', label: 'Cross Band', group: 'ordinary' },
  { id: 'border', label: 'Border', group: 'ordinary' },
]

// ============================================================================
// Charges — CC0 SVGs imported from armoriaCharges.ts
// ============================================================================

// ChargeEntry and CHARGES imported from './armoriaCharges'
// CHARGE_VIEWBOX = '50 50 200 200'

// ============================================================================
// Charge positions — 9-point grid mapped to shield coordinates
// ============================================================================

interface PositionEntry { id: string; label: string; x: number; y: number }

const POSITIONS: PositionEntry[] = [
  { id: 'top-left', label: 'Top Left', x: 32, y: 28 },
  { id: 'top', label: 'Top Center', x: 50, y: 28 },
  { id: 'top-right', label: 'Top Right', x: 68, y: 28 },
  { id: 'left', label: 'Center Left', x: 30, y: 50 },
  { id: 'center', label: 'Center', x: 50, y: 50 },
  { id: 'right', label: 'Center Right', x: 70, y: 50 },
  { id: 'bottom-left', label: 'Bottom Left', x: 36, y: 70 },
  { id: 'bottom', label: 'Bottom Center', x: 50, y: 70 },
  { id: 'bottom-right', label: 'Bottom Right', x: 64, y: 70 },
]

// ============================================================================
// Charge configuration — per-charge settings for multiple charges
// ============================================================================

export interface ChargeConfig {
  chargeId: string
  chargeColor: string
  chargePosition: string
  chargeScale?: number
  offsetX?: number
  offsetY?: number
  rotation?: number
}

// ============================================================================
// Config type
// ============================================================================

export interface ArmorEditorConfig {
  shape: string
  fieldColor: string
  fieldColor2: string
  division: string
  chargeId: string
  chargeColor: string
  chargePosition: string
  chargeScale?: number
  charges?: ChargeConfig[]
}

/** Extract charges array from config, handling legacy single-charge format */
function getCharges(config: ArmorEditorConfig): ChargeConfig[] {
  if (config.charges && config.charges.length > 0) return config.charges
  if (config.chargeId && config.chargeId !== 'none') {
    return [{
      chargeId: config.chargeId,
      chargeColor: config.chargeColor,
      chargePosition: config.chargePosition || 'center',
      chargeScale: config.chargeScale,
    }]
  }
  return []
}

export interface ArmorEditorProps {
  open: boolean
  squadName: string
  squadDescription?: string
  initialConfig?: ArmorEditorConfig | null
  onSave: (config: ArmorEditorConfig, svg: string, name: string, description: string) => void
  onClose: () => void
  /** Debounce delay in ms for autosave. Set 0 to disable. Default: 1500 */
  autoSaveDelay?: number
}

// ============================================================================
// SVG Renderer
// ============================================================================

export function renderShieldSvg(config: ArmorEditorConfig): string {
  const shape = SHIELD_SHAPES.find((s) => s.id === config.shape) || SHIELD_SHAPES[0]
  const clipId = 'shield-clip'

  // Build division / ordinary pattern
  const c2 = config.fieldColor2
  const cp = `clip-path="url(#${clipId})"`
  let divisionFill = ''
  switch (config.division) {
    case 'halved':
      divisionFill = `<rect x="50" y="0" width="50" height="100" fill="${c2}" ${cp}/>`; break
    case 'horizontal':
      divisionFill = `<rect x="0" y="50" width="100" height="50" fill="${c2}" ${cp}/>`; break
    case 'quartered':
      divisionFill = `<rect x="50" y="0" width="50" height="50" fill="${c2}" ${cp}/><rect x="0" y="50" width="50" height="50" fill="${c2}" ${cp}/>`; break
    case 'diagonal-right':
      divisionFill = `<polygon points="0,0 100,0 100,100" fill="${c2}" ${cp}/>`; break
    case 'diagonal-left':
      divisionFill = `<polygon points="0,0 100,0 0,100" fill="${c2}" ${cp}/>`; break
    case 'x-split':
      divisionFill = `<polygon points="50,50 100,0 100,100" fill="${c2}" ${cp}/><polygon points="50,50 0,0 0,100" fill="${c2}" ${cp}/>`; break
    case 'chevron-split':
      divisionFill = `<polygon points="0,45 50,15 100,45 100,100 0,100" fill="${c2}" ${cp}/>`; break
    case 'fess':
      divisionFill = `<rect x="0" y="35" width="100" height="30" fill="${c2}" ${cp}/>`; break
    case 'pale':
      divisionFill = `<rect x="35" y="0" width="30" height="100" fill="${c2}" ${cp}/>`; break
    case 'bend':
      divisionFill = `<polygon points="-10,-2 2,-10 110,88 98,110" fill="${c2}" ${cp}/>`; break
    case 'chevron':
      divisionFill = `<polygon points="50,20 80,55 75,60 50,32 25,60 20,55" fill="${c2}" ${cp}/>`; break
    case 'chief':
      divisionFill = `<rect x="0" y="0" width="100" height="30" fill="${c2}" ${cp}/>`; break
    case 'saltire':
      divisionFill = `<polygon points="-5,-10 5,-10 50,40 95,-10 105,-10 60,50 105,110 95,110 50,60 5,110 -5,110 40,50" fill="${c2}" ${cp}/>`; break
    case 'cross-band':
      divisionFill = `<rect x="0" y="35" width="100" height="30" fill="${c2}" ${cp}/><rect x="35" y="0" width="30" height="100" fill="${c2}" ${cp}/>`; break
    case 'border':
      divisionFill = `<path d="${shape.path}" fill="none" stroke="${c2}" stroke-width="12" ${cp}/>`; break
  }

  // Charge SVGs — render all charges from the charges array
  let chargeSvg = ''
  const chargesList = getCharges(config)
  if (chargesList.length > 0) {
    let inner = ''
    for (const ch of chargesList) {
      const charge = CHARGES.find((c) => c.id === ch.chargeId)
      const pos = POSITIONS.find((p) => p.id === (ch.chargePosition || 'center')) || POSITIONS[4]
      if (charge?.svgContent) {
        const scale = ch.chargeScale ?? 1
        const size = 30 * scale
        const cx = pos.x + (ch.offsetX ?? 0)
        const cy = pos.y + (ch.offsetY ?? 0)
        const rot = ch.rotation ?? 0
        const rotAttr = rot !== 0 ? ` transform="rotate(${rot}, ${cx}, ${cy})"` : ''
        inner += `<g${rotAttr}><svg x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" viewBox="${CHARGE_VIEWBOX}" fill="${ch.chargeColor}" stroke="#000" stroke-width="${1 / scale}">${charge.svgContent}</svg></g>`
      }
    }
    if (inner) chargeSvg = `<g clip-path="url(#${clipId})">${inner}</g>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">
  <defs>
    <clipPath id="${clipId}">
      <path d="${shape.path}"/>
    </clipPath>
  </defs>
  <path d="${shape.path}" fill="${config.fieldColor}" stroke="#333" stroke-width="1.5"/>
  ${divisionFill}
  ${chargeSvg}
  <path d="${shape.path}" fill="none" stroke="#333" stroke-width="1.5"/>
</svg>`
}

// ============================================================================
// Sub-components
// ============================================================================

function ColorSwatch({
  color,
  selected,
  onClick,
}: {
  color: ColorEntry
  selected: boolean
  onClick: () => void
}) {
  return (
    <Tooltip title={color.label}>
      <Box
        onClick={onClick}
        role="radio"
        aria-checked={selected}
        aria-label={color.label}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
        sx={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          bgcolor: color.hex,
          cursor: 'pointer',
          border: selected ? '3px solid' : '2px solid transparent',
          borderColor: selected ? 'primary.main' : 'transparent',
          outline: '1px solid rgba(0,0,0,0.15)',
          transition: 'transform 0.1s, border-color 0.15s',
          '&:hover': { transform: 'scale(1.15)' },
        }}
      />
    </Tooltip>
  )
}

function ShapeSelector({
  shapes,
  selected,
  onSelect,
}: {
  shapes: ShapeEntry[]
  selected: string
  onSelect: (id: string) => void
}) {
  return (
    <Stack direction="row" flexWrap="wrap" gap={1}>
      {shapes.map((shape) => (
        <Tooltip key={shape.id} title={shape.label}>
          <Box
            onClick={() => onSelect(shape.id)}
            sx={{
              width: 44,
              height: 44,
              cursor: 'pointer',
              border: selected === shape.id ? '2px solid' : '2px solid transparent',
              borderColor: selected === shape.id ? 'primary.main' : 'transparent',
              borderRadius: 1,
              p: 0.25,
              '& svg': { width: '100%', height: '100%' },
            }}
            dangerouslySetInnerHTML={{
              __html: `<svg viewBox="0 0 100 100"><path d="${shape.path}" fill="#e0e0e0" stroke="#666" stroke-width="2"/></svg>`,
            }}
          />
        </Tooltip>
      ))}
    </Stack>
  )
}

function ChargeSelector({
  charges,
  selected,
  onSelect,
}: {
  charges: ChargeEntry[]
  selected: string
  onSelect: (id: string) => void
}) {
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.5}>
      {charges.map((ch) => (
        <Tooltip key={ch.id} title={ch.label}>
          <Box
            onClick={() => onSelect(ch.id)}
            sx={{
              width: 36,
              height: 36,
              cursor: 'pointer',
              border: selected === ch.id ? '2px solid' : '2px solid transparent',
              borderColor: selected === ch.id ? 'primary.main' : 'transparent',
              borderRadius: 1,
              p: 0.25,
              bgcolor: selected === ch.id ? 'action.selected' : 'transparent',
              '& svg': { width: '100%', height: '100%' },
            }}
            dangerouslySetInnerHTML={{
              __html: ch.svgContent
                ? `<svg viewBox="${CHARGE_VIEWBOX}" fill="#555" stroke="#000">${ch.svgContent}</svg>`
                : `<svg viewBox="0 0 40 40"><line x1="8" y1="8" x2="32" y2="32" stroke="#ccc" stroke-width="2"/><line x1="32" y1="8" x2="8" y2="32" stroke="#ccc" stroke-width="2"/></svg>`,
            }}
          />
        </Tooltip>
      ))}
    </Stack>
  )
}

function divisionPreviewSvg(id: string, c1: string, c2: string): string {
  const bg = `<rect width="100" height="100" fill="${c1}"/>`
  const border = `<rect width="100" height="100" fill="none" stroke="#999" stroke-width="4"/>`
  let overlay = ''
  switch (id) {
    case 'halved': overlay = `<rect x="50" width="50" height="100" fill="${c2}"/>`; break
    case 'horizontal': overlay = `<rect y="50" width="100" height="50" fill="${c2}"/>`; break
    case 'quartered': overlay = `<rect x="50" y="0" width="50" height="50" fill="${c2}"/><rect x="0" y="50" width="50" height="50" fill="${c2}"/>`; break
    case 'diagonal-right': overlay = `<polygon points="0,0 100,0 100,100" fill="${c2}"/>`; break
    case 'diagonal-left': overlay = `<polygon points="0,0 100,0 0,100" fill="${c2}"/>`; break
    case 'x-split': overlay = `<polygon points="50,50 100,0 100,100" fill="${c2}"/><polygon points="50,50 0,0 0,100" fill="${c2}"/>`; break
    case 'chevron-split': overlay = `<polygon points="0,45 50,15 100,45 100,100 0,100" fill="${c2}"/>`; break
    case 'fess': overlay = `<rect y="35" width="100" height="30" fill="${c2}"/>`; break
    case 'pale': overlay = `<rect x="35" width="30" height="100" fill="${c2}"/>`; break
    case 'bend': overlay = `<polygon points="-10,-2 2,-10 110,88 98,110" fill="${c2}"/>`; break
    case 'chevron': overlay = `<polygon points="50,20 80,55 75,60 50,32 25,60 20,55" fill="${c2}"/>`; break
    case 'chief': overlay = `<rect width="100" height="30" fill="${c2}"/>`; break
    case 'saltire': overlay = `<polygon points="-5,-10 5,-10 50,40 95,-10 105,-10 60,50 105,110 95,110 50,60 5,110 -5,110 40,50" fill="${c2}"/>`; break
    case 'cross-band': overlay = `<rect y="35" width="100" height="30" fill="${c2}"/><rect x="35" width="30" height="100" fill="${c2}"/>`; break
    case 'border': overlay = `<rect width="100" height="100" fill="none" stroke="${c2}" stroke-width="16"/>`; break
  }
  return `<svg viewBox="0 0 100 100">${bg}${overlay}${border}</svg>`
}

function DivisionSelector({
  selected,
  onSelect,
  color1,
  color2,
}: {
  selected: string
  onSelect: (id: string) => void
  color1: string
  color2: string
}) {
  const splits = DIVISIONS.filter((d) => d.group === 'split')
  const ordinaries = DIVISIONS.filter((d) => d.group === 'ordinary')

  const renderItem = (div: DivisionEntry) => (
    <Tooltip key={div.id} title={div.label}>
      <Box
        onClick={() => onSelect(div.id)}
        sx={{
          width: 32,
          height: 32,
          cursor: 'pointer',
          border: selected === div.id ? '2px solid' : '2px solid transparent',
          borderColor: selected === div.id ? 'primary.main' : 'transparent',
          borderRadius: 1,
          overflow: 'hidden',
          '& svg': { width: '100%', height: '100%' },
        }}
        dangerouslySetInnerHTML={{
          __html: divisionPreviewSvg(div.id, color1, color2),
        }}
      />
    </Tooltip>
  )

  return (
    <Stack spacing={0.5}>
      <Stack direction="row" flexWrap="wrap" gap={0.5}>
        {splits.map(renderItem)}
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', mt: 0.25 }}>Bands &amp; Stripes</Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.5}>
        {ordinaries.map(renderItem)}
      </Stack>
    </Stack>
  )
}

/** 3×3 clickable grid for charge placement */
function PositionSelector({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (id: string) => void
}) {
  // 3×3 layout order
  const rows = [
    ['top-left', 'top', 'top-right'],
    ['left', 'center', 'right'],
    ['bottom-left', 'bottom', 'bottom-right'],
  ]

  return (
    <Box sx={{ display: 'inline-grid', gridTemplateColumns: 'repeat(3, 24px)', gap: '3px' }}>
      {rows.flat().map((posId) => {
        const pos = POSITIONS.find((p) => p.id === posId)!
        const isSel = selected === posId
        return (
          <Tooltip key={posId} title={pos.label}>
            <Box
              onClick={() => onSelect(posId)}
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                cursor: 'pointer',
                bgcolor: isSel ? 'primary.main' : 'action.hover',
                border: '2px solid',
                borderColor: isSel ? 'primary.dark' : 'divider',
                transition: 'background-color 0.15s',
                '&:hover': { bgcolor: isSel ? 'primary.main' : 'action.selected' },
              }}
            />
          </Tooltip>
        )
      })}
    </Box>
  )
}

// ============================================================================
// Random config generator
// ============================================================================

function randomConfig(): ArmorEditorConfig {
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
  const numCharges = pick([1, 1, 2, 2, 3])
  const charges: ChargeConfig[] = Array.from({ length: numCharges }, () => ({
    chargeId: pick(CHARGES.filter((c) => c.id !== 'none')).id,
    chargeColor: pick(COLORS).hex,
    chargePosition: pick(POSITIONS).id,
    chargeScale: pick([0.75, 1, 1, 1.25, 1.5]),
    offsetX: 0,
    offsetY: 0,
    rotation: pick([0, 0, 0, 45, 90, 180, 270]),
  }))
  const first = charges[0]
  return {
    shape: pick(SHIELD_SHAPES).id,
    fieldColor: pick(COLORS).hex,
    fieldColor2: pick(COLORS).hex,
    division: pick(DIVISIONS).id,
    chargeId: first.chargeId,
    chargeColor: first.chargeColor,
    chargePosition: first.chargePosition,
    chargeScale: first.chargeScale,
    charges,
  }
}

// ============================================================================
// Main Component
// ============================================================================

const DEFAULT_CONFIG: ArmorEditorConfig = {
  shape: 'classic',
  fieldColor: '#1565c0',
  fieldColor2: '#f9a825',
  division: 'none',
  chargeId: 'none',
  chargeColor: '#f9a825',
  chargePosition: 'center',
  chargeScale: 1,
  charges: [],
}

export function ArmorEditor({
  open,
  squadName,
  squadDescription = '',
  initialConfig,
  onSave,
  onClose,
  autoSaveDelay = 1500,
}: ArmorEditorProps) {
  const t = useTranslations('components')

  const initialSnapshot: ArmorEditorSnapshot = useMemo(() => ({
    config: initialConfig ? { ...DEFAULT_CONFIG, ...initialConfig } : DEFAULT_CONFIG,
    name: squadName,
    description: squadDescription,
  }), [initialConfig, squadName, squadDescription])

  const {
    snapshot,
    pushAndUpdate,
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
    reset,
  } = useArmorUndoRedo(initialSnapshot)

  const { config, name, description } = snapshot
  const [activeChargeIndex, setActiveChargeIndex] = useState(0)

  const charges = useMemo(() => getCharges(config), [config])

  // Autosave timer ref
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const snapshotRef = useRef(snapshot)
  snapshotRef.current = snapshot

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      reset(initialSnapshot)
      setActiveChargeIndex(0)
    }
  }, [open, initialSnapshot, reset])

  // Autosave effect — fires after config/name/description changes
  useEffect(() => {
    if (!open || autoSaveDelay <= 0) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      const s = snapshotRef.current
      const svg = renderShieldSvg(s.config)
      onSave(s.config, svg, s.name, s.description)
    }, autoSaveDelay)
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [snapshot, open, autoSaveDelay, onSave])

  // Keyboard shortcuts: Ctrl/Cmd+Z for undo, Ctrl/Cmd+Shift+Z for redo
  // Intercepts EVERYWHERE including in Lexical editors (shared stack)
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      if (!isMod || e.key.toLowerCase() !== 'z') return

      e.preventDefault()
      if (e.shiftKey) {
        handleRedo()
      } else {
        handleUndo()
      }
    }
    document.addEventListener('keydown', handleKeyDown, true) // capture phase
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [open, handleUndo, handleRedo])

  const handleRandomize = useCallback(() => {
    pushAndUpdate((prev) => ({ ...prev, config: randomConfig() }))
  }, [pushAndUpdate])

  const update = useCallback(
    (partial: Partial<ArmorEditorConfig>) => {
      pushAndUpdate((prev) => ({ ...prev, config: { ...prev.config, ...partial } }))
    },
    [pushAndUpdate],
  )

  const addCharge = useCallback(() => {
    const newCharge: ChargeConfig = {
      chargeId: 'mullet',
      chargeColor: '#f9a825',
      chargePosition: 'center',
      chargeScale: 1,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
    }
    pushAndUpdate((prev) => ({
      ...prev,
      config: { ...prev.config, charges: [...getCharges(prev.config), newCharge] },
    }))
    setActiveChargeIndex(charges.length)
  }, [pushAndUpdate, charges.length])

  const removeCharge = useCallback((index: number) => {
    pushAndUpdate((prev) => {
      const updated = getCharges(prev.config).filter((_, i) => i !== index)
      return { ...prev, config: { ...prev.config, charges: updated } }
    })
    setActiveChargeIndex((i) => {
      const newLen = charges.length - 1
      if (newLen <= 0) return 0
      return i >= newLen ? newLen - 1 : i
    })
  }, [pushAndUpdate, charges.length])

  const updateActiveCharge = useCallback((partial: Partial<ChargeConfig>) => {
    pushAndUpdate((prev) => {
      const current = getCharges(prev.config)
      const updated = current.map((ch, i) =>
        i === activeChargeIndex ? { ...ch, ...partial } : ch
      )
      return { ...prev, config: { ...prev.config, charges: updated } }
    })
  }, [pushAndUpdate, activeChargeIndex])

  const handleChargeSelect = useCallback((chargeId: string) => {
    if (charges.length === 0) {
      const newCharge: ChargeConfig = {
        chargeId,
        chargeColor: '#f9a825',
        chargePosition: 'center',
        chargeScale: 1,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
      }
      pushAndUpdate((prev) => ({
        ...prev,
        config: { ...prev.config, charges: [newCharge] },
      }))
      setActiveChargeIndex(0)
    } else {
      updateActiveCharge({ chargeId })
    }
  }, [charges.length, pushAndUpdate, updateActiveCharge])

  const previewSvg = useMemo(() => renderShieldSvg(config), [config])

  const handleSave = useCallback(() => {
    const chargesList = getCharges(config)
    const first = chargesList[0]
    const savedConfig: ArmorEditorConfig = {
      ...config,
      charges: chargesList,
      chargeId: first?.chargeId || 'none',
      chargeColor: first?.chargeColor || config.chargeColor,
      chargePosition: first?.chargePosition || 'center',
      chargeScale: first?.chargeScale,
    }
    onSave(savedConfig, previewSvg, name, description)
  }, [config, previewSvg, onSave, name, description])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Design Coat of Arms — {name || squadName}</span>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Undo (Ctrl+Z)">
            <span>
              <IconButton onClick={handleUndo} disabled={!canUndo} size="small">
                <UndoIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Redo (Ctrl+Shift+Z)">
            <span>
              <IconButton onClick={handleRedo} disabled={!canRedo} size="small">
                <RedoIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Randomize">
            <IconButton onClick={handleRandomize} size="small">
              <CasinoIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ overflowX: 'hidden', overflowY: 'auto' }}>
        <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
          {/* Live preview — sticky so it stays visible while scrolling controls */}
          <Box
            sx={{
              flex: '0 0 200px',
              position: 'sticky',
              top: 0,
              alignSelf: 'flex-start',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              pt: 1,
              '& svg': { width: 200, height: 200 },
            }}
          >
            <Box
              dangerouslySetInnerHTML={{ __html: sanitizeSvg(previewSvg) }}
              role="img"
              aria-label={t('armorEditor.shieldPreview')}
            />
          </Box>

          {/* Controls */}
          <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
            {/* Shape */}
            <Box>
              <Typography variant="caption" color="text.secondary">Shield Shape</Typography>
              <ShapeSelector shapes={SHIELD_SHAPES} selected={config.shape} onSelect={(id) => update({ shape: id })} />
            </Box>

            {/* Division */}
            <Box>
              <Typography variant="caption" color="text.secondary">Division</Typography>
              <DivisionSelector
                selected={config.division}
                onSelect={(id) => update({ division: id })}
                color1={config.fieldColor}
                color2={config.fieldColor2}
              />
            </Box>

            {/* Field Color */}
            <Box>
              <Typography variant="caption" color="text.secondary">Primary Color</Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                {COLORS.map((c) => (
                  <ColorSwatch key={c.id} color={c} selected={config.fieldColor === c.hex} onClick={() => update({ fieldColor: c.hex })} />
                ))}
              </Stack>
            </Box>

            {/* Second Color (shown when division is not 'none') */}
            {config.division !== 'none' && (
              <Box>
                <Typography variant="caption" color="text.secondary">Secondary Color</Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                  {COLORS.map((c) => (
                    <ColorSwatch key={c.id} color={c} selected={config.fieldColor2 === c.hex} onClick={() => update({ fieldColor2: c.hex })} />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Charge Color — below field colors */}
            {charges.length > 0 && activeChargeIndex < charges.length && (
              <Box>
                <Typography variant="caption" color="text.secondary">Charge Color</Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                  {COLORS.map((c) => (
                    <ColorSwatch key={c.id} color={c} selected={charges[activeChargeIndex].chargeColor === c.hex} onClick={() => updateActiveCharge({ chargeColor: c.hex })} />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Charge type selector */}
            <Box>
              <Typography variant="caption" color="text.secondary">
                {charges.length > 0 ? 'Change Charge Type' : 'Add a Charge'}
              </Typography>
              <ChargeSelector
                charges={CHARGES.filter((c) => c.id !== 'none')}
                selected={charges.length > 0 && activeChargeIndex < charges.length ? charges[activeChargeIndex].chargeId : ''}
                onSelect={handleChargeSelect}
              />
            </Box>

            {/* Charges — slots header */}
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Charges</Typography>
                {charges.length > 0 && charges.length < 5 && (
                  <Tooltip title="Add another charge">
                    <IconButton size="small" onClick={addCharge} aria-label={t('armorEditor.addCharge')}>
                      <AddCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>

              {/* Charge slots */}
              {charges.length > 0 && (
                <Stack direction="row" gap={0.5} sx={{ mt: 0.5, mb: 1 }}>
                  {charges.map((ch, i) => {
                    const entry = CHARGES.find((c) => c.id === ch.chargeId)
                    return (
                      <Box
                        key={i}
                        onClick={() => setActiveChargeIndex(i)}
                        sx={{
                          position: 'relative',
                          width: 40,
                          height: 40,
                          cursor: 'pointer',
                          border: '2px solid',
                          borderColor: i === activeChargeIndex ? 'primary.main' : 'divider',
                          borderRadius: 1,
                          bgcolor: i === activeChargeIndex ? 'action.selected' : 'transparent',
                          '& svg': { width: '100%', height: '100%' },
                        }}
                      >
                        <Box
                          dangerouslySetInnerHTML={{
                            __html: entry?.svgContent
                              ? `<svg viewBox="${CHARGE_VIEWBOX}" fill="${ch.chargeColor}" stroke="#000">${entry.svgContent}</svg>`
                              : '',
                          }}
                          sx={{ width: '100%', height: '100%' }}
                        />
                        <Box
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); removeCharge(i) }}
                          sx={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            bgcolor: 'error.main',
                            color: 'white',
                            fontSize: 10,
                            lineHeight: '16px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'error.dark' },
                          }}
                          role="button"
                          aria-label={`Remove charge ${i + 1}`}
                        >
                          ×
                        </Box>
                      </Box>
                    )
                  })}
                </Stack>
              )}
            </Box>

            {/* Active charge — Position + Size + Rotation (thirds) + Offsets */}
            {charges.length > 0 && activeChargeIndex < charges.length && (
              <>
                <Stack direction="row" gap={2} alignItems="flex-start" sx={{ '& > *': { flex: '1 1 0', minWidth: 0 } }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Position</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <PositionSelector
                        selected={charges[activeChargeIndex].chargePosition || 'center'}
                        onSelect={(id) => updateActiveCharge({ chargePosition: id })}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Size</Typography>
                    <Slider
                      value={charges[activeChargeIndex].chargeScale ?? 1}
                      onChange={(_, v) => updateActiveCharge({ chargeScale: v as number })}
                      min={0.5}
                      max={2}
                      step={0.25}
                      marks={[
                        { value: 0.5, label: 'S' },
                        { value: 1, label: 'M' },
                        { value: 2, label: 'L' },
                      ]}
                      size="small"
                      sx={{ mt: 1.5 }}
                      aria-label={t('armorEditor.chargeSize')}
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Rotation</Typography>
                    <Slider
                      value={charges[activeChargeIndex].rotation ?? 0}
                      onChange={(_, v) => updateActiveCharge({ rotation: v as number })}
                      min={0}
                      max={315}
                      step={45}
                      marks={[
                        { value: 0, label: '0°' },
                        { value: 180, label: '180°' },
                      ]}
                      size="small"
                      valueLabelDisplay="auto"
                      valueLabelFormat={(v) => `${v}°`}
                      sx={{ mt: 1.5 }}
                      aria-label={t('armorEditor.chargeRotation')}
                    />
                  </Box>
                </Stack>
                <Stack direction="row" gap={2}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">X Offset</Typography>
                    <Slider
                      value={charges[activeChargeIndex].offsetX ?? 0}
                      onChange={(_, v) => updateActiveCharge({ offsetX: v as number })}
                      min={-50}
                      max={50}
                      step={1}
                      size="small"
                      valueLabelDisplay="auto"
                      aria-label={t('armorEditor.xOffset')}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">Y Offset</Typography>
                    <Slider
                      value={charges[activeChargeIndex].offsetY ?? 0}
                      onChange={(_, v) => updateActiveCharge({ offsetY: v as number })}
                      min={-50}
                      max={50}
                      step={1}
                      size="small"
                      valueLabelDisplay="auto"
                      aria-label={t('armorEditor.yOffset')}
                    />
                  </Box>
                </Stack>
              </>
            )}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto', ml: 1 }}>
          {autoSaveDelay > 0 ? 'Auto-saving…' : ''}
        </Typography>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Coat of Arms
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ArmorEditor
