/**
 * ModerationPanel — Displays content moderation status and allows instructor actions.
 *
 * Shows whether the student's submission has been checked for policy violations,
 * which categories were flagged, and provides actions to approve/flag/recheck.
 */

import * as React from 'react'
import { useTranslations } from 'next-intl'
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

type Translate = ReturnType<typeof useTranslations>

const MODERATION_CATEGORIES: Record<string, (t: Translate) => string> = {
  sexual: (t) => t('moderationPanel.categoryLabels.sexual'),
  'sexual/minors': (t) => t('moderationPanel.categoryLabels.sexualMinors'),
  harassment: (t) => t('moderationPanel.categoryLabels.harassment'),
  'harassment/threatening': (t) =>
    t('moderationPanel.categoryLabels.harassmentThreatening'),
  hate: (t) => t('moderationPanel.categoryLabels.hate'),
  'hate/threatening': (t) => t('moderationPanel.categoryLabels.hateThreatening'),
  illicit: (t) => t('moderationPanel.categoryLabels.illicit'),
  'illicit/violent': (t) => t('moderationPanel.categoryLabels.illicitViolent'),
  'self-harm': (t) => t('moderationPanel.categoryLabels.selfHarm'),
  'self-harm/intent': (t) => t('moderationPanel.categoryLabels.selfHarmIntent'),
  'self-harm/instructions': (t) =>
    t('moderationPanel.categoryLabels.selfHarmInstructions'),
  violence: (t) => t('moderationPanel.categoryLabels.violence'),
  'violence/graphic': (t) => t('moderationPanel.categoryLabels.violenceGraphic'),
}

// ============================================================================
// Component
// ============================================================================

export function ModerationPanel({ moderation, gradeId, onAction }: ModerationPanelProps) {
  const t = useTranslations('components')
  const [expanded, setExpanded] = React.useState(moderation.status === 'flagged')

  const statusConfig = getStatusConfig(moderation.status, t)
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
            <Typography variant="subtitle2">{t('moderationPanel.title')}</Typography>
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
              {t('moderationPanel.lastChecked', {
                date: new Date(moderation.checkedAt).toLocaleString(),
              })}
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
              <AlertTitle>{t('moderationPanel.flaggedCategoriesTitle')}</AlertTitle>
              <List dense disablePadding>
                {flaggedCategories.map((cat) => (
                  <ListItem key={cat.category} disablePadding sx={{ py: 0.25 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <BlockIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={MODERATION_CATEGORIES[cat.category]?.(t) || cat.category}
                      secondary={
                        cat.score != null
                          ? t('moderationPanel.score', {
                              score: (cat.score * 100).toFixed(1),
                            })
                          : undefined
                      }
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
              {t('moderationPanel.approvedMessage')}
            </Alert>
          )}

          {moderation.status === 'pending' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('moderationPanel.pendingMessage')}
            </Alert>
          )}

          {!moderation.status && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('moderationPanel.noDataMessage')}
            </Alert>
          )}

          {/* Actions */}
          {onAction && (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Tooltip title={t('moderationPanel.recheckTooltip')}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => onAction('recheck', gradeId)}
                >
                  {t('moderationPanel.recheck')}
                </Button>
              </Tooltip>
              {moderation.status !== 'approved' && (
                <Tooltip title={t('moderationPanel.approveTooltip')}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<VerifiedUserIcon />}
                    onClick={() => onAction('approve', gradeId)}
                  >
                    {t('moderationPanel.approve')}
                  </Button>
                </Tooltip>
              )}
              {moderation.status !== 'flagged' && (
                <Tooltip title={t('moderationPanel.flagTooltip')}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<BlockIcon />}
                    onClick={() => onAction('flag', gradeId)}
                  >
                    {t('moderationPanel.flag')}
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

function getStatusConfig(status: string | null | undefined, t: Translate) {
  switch (status) {
    case 'approved':
      return {
        label: t('moderationPanel.statusApproved'),
        borderColor: 'success.main',
        bgColor: 'success.50',
        iconColor: 'success.main',
        chipColor: 'success',
        chipIcon: <CheckCircleIcon fontSize="small" />,
      }
    case 'flagged':
      return {
        label: t('moderationPanel.statusFlagged'),
        borderColor: 'error.main',
        bgColor: 'error.50',
        iconColor: 'error.main',
        chipColor: 'error',
        chipIcon: <WarningAmberIcon fontSize="small" />,
      }
    case 'pending':
      return {
        label: t('moderationPanel.statusPending'),
        borderColor: 'warning.main',
        bgColor: 'warning.50',
        iconColor: 'warning.main',
        chipColor: 'warning',
        chipIcon: <HourglassEmptyIcon fontSize="small" />,
      }
    default:
      return {
        label: t('moderationPanel.statusNotChecked'),
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
