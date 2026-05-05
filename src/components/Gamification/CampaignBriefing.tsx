/**
 * CampaignBriefing — Displays the narrative campaign setting, stakes,
 * and per-module chapter text for the current cohort.
 *
 * When `contentJson` is provided, embeds a full Lexical workbook
 * (quizzes, vocab, media, etc.) inside the narrative card via
 * NarrativeReader — allowing teaching content alongside the story flow.
 *
 * @module CampaignBriefing
 */

import React from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Skeleton from '@mui/material/Skeleton'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import { NarrativeReader } from '../Editor3/NarrativeReader'

// ============================================================================
// Types
// ============================================================================

export interface CampaignBriefingProps {
  /** Campaign title */
  title: string
  /** Narrative setting (world / context description) */
  setting?: string
  /** Stakes — what's at risk in the narrative */
  stakes?: string
  /** Per-module chapter text (current assignment's narrative flavor) */
  chapterText?: string
  /**
   * Serialized Lexical JSON (same format as Unit.data).
   * When provided, renders a full read-only workbook (quizzes, vocab,
   * meaning association, media, etc.) embedded in the narrative card.
   */
  contentJson?: string
  /** Max height for the embedded content area (enables scroll) */
  contentMaxHeight?: string | number
  /** Whether data is still loading */
  isLoading?: boolean
  /** Compact mode for inline display (e.g. within a workbook header) */
  compact?: boolean
}

// ============================================================================
// Component
// ============================================================================

export function CampaignBriefing({
  title,
  setting,
  stakes,
  chapterText,
  contentJson,
  contentMaxHeight,
  isLoading = false,
  compact = false,
}: CampaignBriefingProps) {
  if (isLoading) {
    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="90%" />
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <Box
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: 'action.hover',
          borderRadius: 1,
          borderLeft: 4,
          borderColor: 'primary.main',
          mb: 2,
        }}
      >
        {chapterText && (
          <Typography
            variant="body2"
            sx={{ fontStyle: 'italic', color: 'text.secondary' }}
          >
            {chapterText}
          </Typography>
        )}
        {!chapterText && setting && (
          <Typography
            variant="body2"
            sx={{ fontStyle: 'italic', color: 'text.secondary' }}
          >
            {setting}
          </Typography>
        )}
      </Box>
    )
  }

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        background: 'linear-gradient(135deg, rgba(25,118,210,0.04) 0%, rgba(156,39,176,0.04) 100%)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <AutoStoriesIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
        </Box>

        {setting && (
          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ letterSpacing: 1.5, fontSize: '0.65rem' }}
            >
              Setting
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontStyle: 'italic', lineHeight: 1.6 }}
            >
              {setting}
            </Typography>
          </Box>
        )}

        {stakes && (
          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ letterSpacing: 1.5, fontSize: '0.65rem' }}
            >
              Stakes
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.6, fontWeight: 500 }}>
              {stakes}
            </Typography>
          </Box>
        )}

        {chapterText && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ letterSpacing: 1.5, fontSize: '0.65rem' }}
              >
                Mission Briefing
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                  color: 'primary.dark',
                }}
              >
                &ldquo;{chapterText}&rdquo;
              </Typography>
            </Box>
          </>
        )}

        {contentJson && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <NarrativeReader
              contentJson={contentJson}
              maxHeight={contentMaxHeight}
              ariaLabel={`${title} narrative content`}
              padding="0.5rem 0"
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default CampaignBriefing
