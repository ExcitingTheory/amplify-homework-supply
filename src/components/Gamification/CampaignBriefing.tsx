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
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { NarrativeReader } from '../Editor3/NarrativeReader'

const stakeLabels: Record<string, string> = {
  loseStreakFreeze: 'Lose a streak freeze',
  loseXP: 'Lose XP on failure',
  resetStreak: 'Reset streak',
  loseLevel: 'Lose a level',
  loseBadge: 'Lose most recent badge',
  loseBadgeByRarity: 'Lose badge by rarity',
  streakMissXPPenalty: 'Missed streak days cost XP',
  loseCosmetics: 'Cosmetic penalty',
}

function normalizeStakes(stakes?: string): { plain?: string; items?: string[] } {
  if (!stakes) return {}

  try {
    const parsed = JSON.parse(stakes)
    if (!parsed || typeof parsed !== 'object') return { plain: stakes }

    const items: string[] = []
    for (const [key, label] of Object.entries(stakeLabels)) {
      if (parsed[key] === true) items.push(label)
    }

    if (parsed.loseXP === true && typeof parsed.xpLossAmount === 'number') {
      items.push(`XP loss amount: ${parsed.xpLossAmount}`)
    }

    if (parsed.loseCosmetics === true && typeof parsed.cosmeticPenaltyDays === 'number') {
      items.push(`Cosmetic penalty duration: ${parsed.cosmeticPenaltyDays} day(s)`)
    }

    if (
      parsed.loseBadgeByRarity === true &&
      typeof parsed.badgeRarityTarget === 'string' &&
      parsed.badgeRarityTarget.trim()
    ) {
      const rarity = parsed.badgeRarityTarget.trim()
      items.push(`Badge rarity target: ${rarity}`)
    }

    if (
      parsed.streakMissXPPenalty === true &&
      typeof parsed.streakMissXPPerDay === 'number'
    ) {
      items.push(`Missed streak penalty: ${parsed.streakMissXPPerDay} XP/day`)
    }

    if (items.length > 0) return { items }
    return { plain: stakes }
  } catch {
    return { plain: stakes }
  }
}

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
  /**
   * When true (and compact=true), renders a teaser with a toggle button
   * to expand into the full briefing. Starts collapsed by default.
   */
  collapsible?: boolean
  /** Initial expanded state when collapsible=true. Defaults to false (collapsed). */
  defaultExpanded?: boolean
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
  collapsible = false,
  defaultExpanded = false,
}: CampaignBriefingProps) {
  const normalizedStakes = React.useMemo(() => normalizeStakes(stakes), [stakes])
  const [expanded, setExpanded] = React.useState(defaultExpanded)

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
    const teaserText = chapterText || setting
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
        {teaserText && (
          <Typography
            variant="body2"
            sx={{ fontStyle: 'italic', color: 'text.secondary' }}
          >
            {teaserText}
          </Typography>
        )}
        {collapsible && (
          <>
            <Button
              size="small"
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: expanded ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                  }}
                />
              }
              onClick={() => setExpanded((v) => !v)}
              sx={{ mt: 0.5, textTransform: 'none', p: 0, fontWeight: 600, fontSize: '0.75rem' }}
            >
              {expanded ? 'Collapse' : 'Read more'}
            </Button>
            <Collapse in={expanded}>
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                {setting && (!teaserText || teaserText !== setting) && (
                  <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.6 }}>
                    {setting}
                  </Typography>
                )}
                {stakes && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      Stakes
                    </Typography>
                    {(() => {
                      const ns = normalizeStakes(stakes)
                      return ns.items ? (
                        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                          {ns.items.map((item) => (
                            <Typography key={item} component="li" variant="body2" sx={{ lineHeight: 1.6 }}>
                              {item}
                            </Typography>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2">{ns.plain}</Typography>
                      )
                    })()}
                  </Box>
                )}
              </Box>
            </Collapse>
          </>
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
            {normalizedStakes.items ? (
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {normalizedStakes.items.map((item) => (
                  <Typography
                    key={item}
                    component="li"
                    variant="body2"
                    sx={{ lineHeight: 1.6, fontWeight: 500 }}
                  >
                    {item}
                  </Typography>
                ))}
              </Box>
            ) : (
              <Typography variant="body1" sx={{ lineHeight: 1.6, fontWeight: 500 }}>
                {normalizedStakes.plain}
              </Typography>
            )}
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
