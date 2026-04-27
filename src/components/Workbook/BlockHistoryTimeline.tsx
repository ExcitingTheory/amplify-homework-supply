/**
 * BlockHistoryTimeline — Collapsible timeline showing change history for a block.
 *
 * Uses useBlockHistory hook for live data from the Yjs history array.
 *
 * @module BlockHistoryTimeline
 */

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Collapse from '@mui/material/Collapse'
import Avatar from '@mui/material/Avatar'
import HistoryIcon from '@mui/icons-material/History'
import EditIcon from '@mui/icons-material/Edit'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import GradeIcon from '@mui/icons-material/Grade'
import type { HistoryEntry } from '../../yjs/WorkbookCollaborationProvider'

export interface BlockHistoryTimelineProps {
  entries: HistoryEntry[]
  maxVisible?: number
}

const fieldIcons: Record<string, React.ReactNode> = {
  userAnswer: <EditIcon fontSize="small" />,
  complete: <CheckCircleIcon fontSize="small" />,
  accuracy: <GradeIcon fontSize="small" />,
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return date.toLocaleDateString()
}

function formatFieldChange(entry: HistoryEntry): string {
  const { fieldChanged, newValue } = entry
  if (fieldChanged === 'complete') {
    return newValue ? 'Marked complete' : 'Marked incomplete'
  }
  if (fieldChanged === 'accuracy') {
    return `Accuracy: ${newValue}%`
  }
  if (fieldChanged === 'userAnswer') {
    const preview = typeof newValue === 'string' ? newValue.slice(0, 60) : String(newValue)
    return `Answer updated: "${preview}${String(newValue).length > 60 ? '...' : ''}"`
  }
  return `${fieldChanged} changed`
}

export function BlockHistoryTimeline({
  entries,
  maxVisible = 10,
}: BlockHistoryTimelineProps) {
  const [expanded, setExpanded] = useState(false)

  if (entries.length === 0) {
    return null
  }

  const visibleEntries = expanded ? entries : entries.slice(0, maxVisible)
  const hasMore = entries.length > maxVisible

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
        <IconButton
          size="small"
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Collapse history' : 'Show history'}
        >
          <HistoryIcon fontSize="small" />
        </IconButton>
        <Typography variant="caption" color="text.secondary">
          {entries.length} change{entries.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      <Collapse in={expanded || entries.length <= 3}>
        <Box sx={{ pl: 1 }}>
          {visibleEntries.map((entry, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, minHeight: 48, position: 'relative' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 32 }}>
                <Avatar
                  variant="rounded"
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: entry.fieldChanged === 'complete' ? 'success.main' : 'primary.main',
                    color: 'white',
                  }}
                >
                  {fieldIcons[entry.fieldChanged] || <EditIcon fontSize="small" />}
                </Avatar>
                {i < visibleEntries.length - 1 && (
                  <Box sx={{ width: 2, flexGrow: 1, bgcolor: 'divider', my: 0.5 }} />
                )}
              </Box>
              <Box sx={{ pt: 0.3, pb: 1, minWidth: 0 }}>
                <Typography variant="body2" fontSize={13}>
                  {formatFieldChange(entry)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {entry.displayName || entry.userId} &middot; {formatTime(entry.timestamp)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
        {hasMore && !expanded && (
          <Typography
            variant="caption"
            color="primary"
            sx={{ cursor: 'pointer', pl: 1 }}
            onClick={() => setExpanded(true)}
          >
            Show {entries.length - maxVisible} more...
          </Typography>
        )}
      </Collapse>
    </Box>
  )
}

export default BlockHistoryTimeline
