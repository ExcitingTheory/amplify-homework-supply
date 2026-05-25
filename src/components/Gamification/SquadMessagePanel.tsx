/**
 * SquadMessagePanel — Instructor panel for composing and broadcasting
 * templated messages to one or more squads.
 *
 * Supports template variables: {{SQUAD_NAME}}, {{SQUAD_RIVAL}}, {{SQUAD_XP}}
 * where SQUAD_RIVAL is the closest-XP squad at time of publish.
 *
 * @module SquadMessagePanel
 */

import React, { useState, useMemo } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import SendIcon from '@mui/icons-material/Send'
import GroupsIcon from '@mui/icons-material/Groups'
import PreviewIcon from '@mui/icons-material/Preview'
import { SquadMentionPill } from './SquadMentionPill'

// ============================================================================
// Types
// ============================================================================

export interface SquadInfo {
  id: string
  name: string
  totalXP: number
  crestSvg?: string | null
}

export interface ResolvedMessage {
  squadId: string
  squadName: string
  body: string
  rivalSquadId?: string
  rivalSquadName?: string
}

export interface SquadMessagePanelProps {
  /** All squads in the current cohort */
  squads: SquadInfo[]
  /** Called when instructor sends the message */
  onSend: (data: {
    template: string
    recipientSquadIds: string[]
    resolvedMessages: ResolvedMessage[]
  }) => void
  /** Disable during submission */
  submitting?: boolean
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Find the rival squad (closest XP score that isn't the squad itself).
 * Prefers the squad immediately above in XP, then immediately below.
 */
function findRival(squadId: string, squads: SquadInfo[]): SquadInfo | undefined {
  const sorted = [...squads].sort((a, b) => b.totalXP - a.totalXP)
  const idx = sorted.findIndex((s) => s.id === squadId)
  if (idx === -1) return undefined

  // Try the squad above (higher XP), then below
  if (idx > 0) return sorted[idx - 1]
  if (idx < sorted.length - 1) return sorted[idx + 1]
  return undefined
}

/**
 * Resolve template variables for a specific squad.
 */
function resolveTemplate(
  template: string,
  squad: SquadInfo,
  rival: SquadInfo | undefined,
): string {
  let result = template
  result = result.replace(/\{\{SQUAD_NAME\}\}/g, squad.name)
  result = result.replace(/\{\{SQUAD_XP\}\}/g, squad.totalXP.toLocaleString())
  result = result.replace(/\{\{SQUAD_RIVAL\}\}/g, rival?.name || 'a worthy opponent')
  return result
}

// ============================================================================
// Preset templates
// ============================================================================

const PRESET_TEMPLATES = [
  {
    label: 'Rivalry Taunt',
    template:
      '⚔️ {{SQUAD_NAME}}, your rival {{SQUAD_RIVAL}} is gaining on you! Show them what you\'re made of.',
  },
  {
    label: 'Progress Update',
    template:
      '📊 {{SQUAD_NAME}} currently sits at {{SQUAD_XP}} XP. Keep pushing — every contribution counts!',
  },
  {
    label: 'Boss Battle Rally',
    template:
      '🐉 {{SQUAD_NAME}}, the boss still stands! Rally your squad and bring it down before {{SQUAD_RIVAL}} claims the glory.',
  },
  {
    label: 'Victory Congratulations',
    template:
      '🏆 Well done, {{SQUAD_NAME}}! You outperformed {{SQUAD_RIVAL}} and proved your dominance.',
  },
]

// ============================================================================
// Component
// ============================================================================

export function SquadMessagePanel({
  squads,
  onSend,
  submitting = false,
}: SquadMessagePanelProps) {
  const [template, setTemplate] = useState('')
  const [selectedSquadIds, setSelectedSquadIds] = useState<Set<string>>(new Set())
  const [showPreview, setShowPreview] = useState(false)

  const allSelected = selectedSquadIds.size === squads.length
  const noneSelected = selectedSquadIds.size === 0

  const toggleSquad = (id: string) => {
    setSelectedSquadIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelectedSquadIds(new Set())
    } else {
      setSelectedSquadIds(new Set(squads.map((s) => s.id)))
    }
  }

  const resolvedMessages: ResolvedMessage[] = useMemo(() => {
    if (!template.trim()) return []
    return squads
      .filter((s) => selectedSquadIds.has(s.id))
      .map((squad) => {
        const rival = findRival(squad.id, squads)
        return {
          squadId: squad.id,
          squadName: squad.name,
          body: resolveTemplate(template, squad, rival),
          rivalSquadId: rival?.id,
          rivalSquadName: rival?.name,
        }
      })
  }, [template, selectedSquadIds, squads])

  const canSend = template.trim().length > 0 && !noneSelected

  const handleSend = () => {
    if (!canSend) return
    onSend({
      template,
      recipientSquadIds: Array.from(selectedSquadIds),
      resolvedMessages,
    })
    setTemplate('')
    setSelectedSquadIds(new Set())
    setShowPreview(false)
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <GroupsIcon color="primary" />
            <Typography variant="h6">Squad Message</Typography>
          </Stack>

          {/* Preset templates */}
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Presets:
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
              {PRESET_TEMPLATES.map((preset) => (
                <Chip
                  key={preset.label}
                  label={preset.label}
                  size="small"
                  variant={template === preset.template ? 'filled' : 'outlined'}
                  color={template === preset.template ? 'primary' : 'default'}
                  onClick={() => setTemplate(preset.template)}
                />
              ))}
            </Stack>
          </Box>

          {/* Template input */}
          <TextField
            label="Message Template"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            multiline
            rows={3}
            fullWidth
            placeholder="e.g., ⚔️ {{SQUAD_NAME}}, your rival {{SQUAD_RIVAL}} is gaining on you!"
            helperText="Variables: {{SQUAD_NAME}}, {{SQUAD_RIVAL}} (closest XP), {{SQUAD_XP}}"
            disabled={submitting}
          />

          {/* Variable chips for easy insertion */}
          <Stack direction="row" spacing={0.5}>
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
              Insert:
            </Typography>
            {['{{SQUAD_NAME}}', '{{SQUAD_RIVAL}}', '{{SQUAD_XP}}'].map((v) => (
              <Chip
                key={v}
                label={v}
                size="small"
                variant="outlined"
                onClick={() => setTemplate((prev) => prev + v)}
                sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
              />
            ))}
          </Stack>

          <Divider />

          {/* Squad selection */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2">
                Recipients ({selectedSquadIds.size} of {squads.length})
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={allSelected}
                    indeterminate={!allSelected && !noneSelected}
                    onChange={toggleAll}
                    size="small"
                  />
                }
                label="All"
              />
            </Stack>
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {squads.map((squad) => (
                <SquadMentionPill
                  key={squad.id}
                  squadId={squad.id}
                  squadName={squad.name}
                  crestSvg={squad.crestSvg}
                  totalXP={squad.totalXP}
                  onClick={() => toggleSquad(squad.id)}
                  size="small"
                />
              ))}
            </Stack>
            {/* Visual indicator of selection */}
            <Stack direction="row" flexWrap="wrap" gap={0.5} mt={1}>
              {squads.map((squad) => (
                <Chip
                  key={squad.id}
                  label={squad.name}
                  size="small"
                  color={selectedSquadIds.has(squad.id) ? 'primary' : 'default'}
                  variant={selectedSquadIds.has(squad.id) ? 'filled' : 'outlined'}
                  onClick={() => toggleSquad(squad.id)}
                  onDelete={
                    selectedSquadIds.has(squad.id) ? () => toggleSquad(squad.id) : undefined
                  }
                />
              ))}
            </Stack>
          </Box>

          <Divider />

          {/* Preview */}
          <Button
            variant="text"
            size="small"
            startIcon={<PreviewIcon />}
            onClick={() => setShowPreview(!showPreview)}
            disabled={!canSend}
          >
            {showPreview ? 'Hide Preview' : 'Preview Messages'}
          </Button>

          {showPreview && resolvedMessages.length > 0 && (
            <Stack spacing={1}>
              {resolvedMessages.map((msg) => (
                <Alert key={msg.squadId} severity="info" icon={false} sx={{ py: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    → {msg.squadName}
                    {msg.rivalSquadName && ` (rival: ${msg.rivalSquadName})`}
                  </Typography>
                  <Typography variant="body2">{msg.body}</Typography>
                </Alert>
              ))}
            </Stack>
          )}

          {/* Send button */}
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSend}
            disabled={!canSend || submitting}
          >
            {submitting ? 'Sending...' : `Send to ${selectedSquadIds.size} Squad${selectedSquadIds.size !== 1 ? 's' : ''}`}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default SquadMessagePanel
