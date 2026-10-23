/**
 * BlockHistoryTimeline — Collapsible timeline showing change history for a block.
 *
 * Uses useBlockHistory hook for live data from the Yjs history array.
 *
 * @module BlockHistoryTimeline
 */

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
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

type Translate = ReturnType<typeof useTranslations>

function formatTime(iso: string, t: Translate): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return t('blockHistoryTimeline.justNow')
  if (diffMin < 60) return t('blockHistoryTimeline.minutesAgo', { minutes: diffMin })
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return t('blockHistoryTimeline.hoursAgo', { hours: diffHrs })
  return date.toLocaleDateString()
}

function formatFieldChange(entry: HistoryEntry, t: Translate): string {
  const { fieldChanged, newValue } = entry
  if (fieldChanged === 'complete') {
    return newValue
      ? t('blockHistoryTimeline.markedComplete')
      : t('blockHistoryTimeline.markedIncomplete')
  }
  if (fieldChanged === 'accuracy') {
    return t('blockHistoryTimeline.accuracy', { accuracy: String(newValue) })
  }
  if (fieldChanged === 'userAnswer') {
    const preview = typeof newValue === 'string' ? newValue.slice(0, 60) : String(newValue)
    return t('blockHistoryTimeline.answerUpdated', {
      preview: `${preview}${String(newValue).length > 60 ? '...' : ''}`,
    })
  }
  return t('blockHistoryTimeline.fieldChanged', { field: fieldChanged })
}

export function BlockHistoryTimeline({
  entries,
  maxVisible = 10,
}: BlockHistoryTimelineProps) {
  const t = useTranslations('components')
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
          title={
            expanded
              ? t('blockHistoryTimeline.collapseHistory')
              : t('blockHistoryTimeline.showHistory')
          }
        >
          <HistoryIcon fontSize="small" />
        </IconButton>
        <Typography variant="caption" color="text.secondary">
          {t('blockHistoryTimeline.changeCount', { count: entries.length })}
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
                  {formatFieldChange(entry, t)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {entry.displayName || entry.userId} &middot;{' '}
                  {formatTime(entry.timestamp, t)}
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
            {t('blockHistoryTimeline.showMore', { count: entries.length - maxVisible })}
          </Typography>
        )}
      </Collapse>
    </Box>
  )
}

export default BlockHistoryTimeline
