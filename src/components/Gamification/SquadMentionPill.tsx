/**
 * SquadMentionPill — Inline chip that renders a squad mention with
 * a mini crest (initials avatar or SVG) and the squad name.
 *
 * Designed to be embedded in chat messages, narratives, and descriptions
 * wherever a `{{@squad:id}}` token is resolved.
 *
 * @module SquadMentionPill
 */

import React, { useMemo } from 'react'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import { sanitizeSvg } from '../../utils/sanitizeHtml'

export interface SquadMentionPillProps {
  squadId: string
  squadName: string
  /** Optional stored SVG crest markup */
  crestSvg?: string | null
  /** Total XP shown in tooltip */
  totalXP?: number
  /** Size variant */
  size?: 'small' | 'medium'
  /** Click handler (e.g., navigate to squad detail) */
  onClick?: (squadId: string) => void
}

/**
 * Simple hash → deterministic HSL color (same algorithm as SquadCrest)
 */
function hashToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
    hash |= 0
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 60%, 45%)`
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
}

export function SquadMentionPill({
  squadId,
  squadName,
  crestSvg,
  totalXP,
  size = 'small',
  onClick,
}: SquadMentionPillProps) {
  const bgColor = useMemo(() => hashToColor(squadId), [squadId])
  const initials = useMemo(() => getInitials(squadName), [squadName])

  const avatar = crestSvg ? (
    <Avatar
      sx={{
        width: size === 'small' ? 24 : 32,
        height: size === 'small' ? 24 : 32,
        bgcolor: 'transparent',
        '& svg': { width: '100%', height: '100%' },
      }}
    >
      <Box
        component="span"
        dangerouslySetInnerHTML={{ __html: sanitizeSvg(crestSvg) }}
        sx={{ display: 'flex', width: '100%', height: '100%' }}
      />
    </Avatar>
  ) : (
    <Avatar
      sx={{
        width: size === 'small' ? 24 : 32,
        height: size === 'small' ? 24 : 32,
        bgcolor: bgColor,
        fontSize: size === 'small' ? '0.625rem' : '0.75rem',
        fontWeight: 700,
      }}
    >
      {initials}
    </Avatar>
  )

  const tooltipText = totalXP != null ? `${squadName} • ${totalXP.toLocaleString()} XP` : squadName

  return (
    <Tooltip title={tooltipText} arrow>
      <Chip
        avatar={avatar}
        label={squadName}
        size={size}
        variant="outlined"
        onClick={onClick ? () => onClick(squadId) : undefined}
        clickable={!!onClick}
        sx={{
          fontWeight: 600,
          borderColor: bgColor,
          '&:hover': onClick
            ? { bgcolor: `${bgColor}15`, borderColor: bgColor }
            : undefined,
        }}
      />
    </Tooltip>
  )
}

// ============================================================================
// Utility: Parse squad mentions from template strings
// ============================================================================

/**
 * Token format: `{{@squad:<id>:<name>}}`
 *
 * Parses a string and returns an array of React nodes with squad mentions
 * replaced by SquadMentionPill components.
 */
export function renderSquadMentions(
  text: string,
  options?: {
    squads?: Array<{ id: string; name: string; crestSvg?: string | null; totalXP?: number }>
    onClick?: (squadId: string) => void
  },
): React.ReactNode[] {
  const mentionRegex = /\{\{@squad:([^:}]+):([^}]+)\}\}/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = mentionRegex.exec(text)) !== null) {
    // Text before the mention
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    const squadId = match[1]
    const squadName = match[2]
    const squadData = options?.squads?.find((s) => s.id === squadId)

    parts.push(
      <SquadMentionPill
        key={`squad-${squadId}-${match.index}`}
        squadId={squadId}
        squadName={squadData?.name || squadName}
        crestSvg={squadData?.crestSvg}
        totalXP={squadData?.totalXP}
        onClick={options?.onClick}
      />,
    )

    lastIndex = match.index + match[0].length
  }

  // Remaining text after last mention
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

export default SquadMentionPill
