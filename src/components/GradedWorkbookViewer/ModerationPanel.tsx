/**
 * ModerationPanel — Displays content moderation status and allows instructor actions.
 *
 * Shows whether the student's submission has been checked for policy violations,
 * which categories were flagged, and provides actions to approve/flag/recheck.
 */

import * as React from 'react'
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  Button,
  Alert,
  AlertTitle,
  Collapse,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import ShieldIcon from '@mui/icons-material/Shield'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import RefreshIcon from '@mui/icons-material/Refresh'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import BlockIcon from '@mui/icons-material/Block'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import type { ModerationInfo } from './GradedWorkbookViewer'

// ============================================================================
// Types
// ============================================================================

interface ModerationPanelProps {
  moderation: ModerationInfo
  gradeId: string
  onAction?: (action: 'approve' | 'flag' | 'recheck', gradeId: string) => void
}

// ============================================================================
// Category display names
// ============================================================================

const MODERATION_CATEGORIES: Record<string, string> = {
  sexual: 'Sexual Content',
  'sexual/minors': 'Sexual Content (Minors)',
  harassment: 'Harassment',
  'harassment/threatening': 'Harassment (Threatening)',
  hate: 'Hate Speech',
  'hate/threatening': 'Hate (Threatening)',
  illicit: 'Illicit Activity',
  'illicit/violent': 'Illicit Violence',
  'self-harm': 'Self-Harm',
  'self-harm/intent': 'Self-Harm (Intent)',
  'self-harm/instructions': 'Self-Harm (Instructions)',
  violence: 'Violence',
  'violence/graphic': 'Violence (Graphic)',
}

// ============================================================================
// Component
// ============================================================================

export function ModerationPanel({ moderation, gradeId, onAction }: ModerationPanelProps) {
  const [expanded, setExpanded] = React.useState(moderation.status === 'flagged')

  const statusConfig = getStatusConfig(moderation.status)
  const flaggedCategories = getFlaggedCategories(moderation.flags)

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        mb: 2,
        borderColor: statusConfig.borderColor,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: statusConfig.bgColor,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <ShieldIcon sx={{ color: statusConfig.iconColor }} />
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle2">Content Moderation</Typography>
            <Chip
              icon={statusConfig.chipIcon}
              label={statusConfig.label}
              size="small"
              color={statusConfig.chipColor as any}
              variant="outlined"
            />
          </Stack>
          {moderation.checkedAt && (
            <Typography variant="caption" color="text.secondary">
              Last checked: {new Date(moderation.checkedAt).toLocaleString()}
            </Typography>
          )}
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Expanded content */}
      <Collapse in={expanded}>
        <Box sx={{ p: 2 }}>
          {/* Flagged categories */}
          {moderation.status === 'flagged' && flaggedCategories.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Flagged Categories</AlertTitle>
              <List dense disablePadding>
                {flaggedCategories.map((cat) => (
                  <ListItem key={cat.category} disablePadding sx={{ py: 0.25 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <BlockIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={MODERATION_CATEGORIES[cat.category] || cat.category}
                      secondary={cat.score != null ? `Score: ${(cat.score * 100).toFixed(1)}%` : undefined}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Alert>
          )}

          {moderation.status === 'approved' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Content has passed moderation checks. No policy violations detected.
            </Alert>
          )}

          {moderation.status === 'pending' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Content has not been moderated yet. Run a check to verify compliance.
            </Alert>
          )}

          {!moderation.status && (
            <Alert severity="info" sx={{ mb: 2 }}>
              No moderation data available for this submission.
            </Alert>
          )}

          {/* Actions */}
          {onAction && (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Tooltip title="Run moderation check on this submission">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => onAction('recheck', gradeId)}
                >
                  Re-check
                </Button>
              </Tooltip>
              {moderation.status !== 'approved' && (
                <Tooltip title="Manually approve this content">
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<VerifiedUserIcon />}
                    onClick={() => onAction('approve', gradeId)}
                  >
                    Approve
                  </Button>
                </Tooltip>
              )}
              {moderation.status !== 'flagged' && (
                <Tooltip title="Manually flag this content for review">
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<BlockIcon />}
                    onClick={() => onAction('flag', gradeId)}
                  >
                    Flag
                  </Button>
                </Tooltip>
              )}
            </Stack>
          )}
        </Box>
      </Collapse>
    </Paper>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function getStatusConfig(status: string | null | undefined) {
  switch (status) {
    case 'approved':
      return {
        label: 'Approved',
        borderColor: 'success.main',
        bgColor: 'success.50',
        iconColor: 'success.main',
        chipColor: 'success',
        chipIcon: <CheckCircleIcon fontSize="small" />,
      }
    case 'flagged':
      return {
        label: 'Flagged',
        borderColor: 'error.main',
        bgColor: 'error.50',
        iconColor: 'error.main',
        chipColor: 'error',
        chipIcon: <WarningAmberIcon fontSize="small" />,
      }
    case 'pending':
      return {
        label: 'Pending',
        borderColor: 'warning.main',
        bgColor: 'warning.50',
        iconColor: 'warning.main',
        chipColor: 'warning',
        chipIcon: <HourglassEmptyIcon fontSize="small" />,
      }
    default:
      return {
        label: 'Not Checked',
        borderColor: 'grey.300',
        bgColor: 'grey.50',
        iconColor: 'grey.500',
        chipColor: 'default',
        chipIcon: <ShieldIcon fontSize="small" />,
      }
  }
}

function getFlaggedCategories(flags: Record<string, any> | null | undefined): { category: string; score?: number }[] {
  if (!flags) return []

  const categories: { category: string; score?: number }[] = []

  // Handle both formats: { categories: {...}, categoryScores: {...} } and flat { category: score }
  if (flags.categories && typeof flags.categories === 'object') {
    Object.entries(flags.categories).forEach(([cat, flagged]) => {
      if (flagged) {
        const score = flags.categoryScores?.[cat]
        categories.push({ category: cat, score: typeof score === 'number' ? score : undefined })
      }
    })
  } else {
    // Flat format: { "harassment": 0.95, "violence": 0.8 }
    Object.entries(flags).forEach(([cat, value]) => {
      if (typeof value === 'number' && value > 0.5) {
        categories.push({ category: cat, score: value })
      } else if (value === true) {
        categories.push({ category: cat })
      }
    })
  }

  return categories.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
}
