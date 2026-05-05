/**
 * StorybookPromoPanel — Displays documentation promo badges
 * earned by completing onboarding tasks in the Storybook instance.
 *
 * Badge claiming happens directly from the Storybook page via Cognito auth
 * and the claimStorybookBadges mutation. This panel simply shows the user
 * which promo badges they've earned and links to Storybook to earn more.
 *
 * @module StorybookPromoPanel
 */

import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Link from '@mui/material/Link'
import { BadgeIcon } from './BadgeIcon'
import { getBadgeConfig } from './badgeRegistry'

// ============================================================================
// Types
// ============================================================================

const PROMO_BADGE_TYPES = [
  'DOCS_EXPLORER',
  'INSTRUCTOR_ONBOARD',
  'LEARNER_ONBOARD',
  'TRANSLATOR_ONBOARD',
  'A11Y_CHAMPION',
  'DOCS_CHAMPION',
] as const

export interface StorybookPromoPanelProps {
  /** The shared Storybook instance URL (e.g. https://storybook.example.com) */
  storybookUrl: string
  /** Set of badge types the student has already earned */
  earnedBadgeTypes?: Set<string>
}

// ============================================================================
// Component
// ============================================================================

export function StorybookPromoPanel({
  storybookUrl,
  earnedBadgeTypes = new Set(),
}: StorybookPromoPanelProps) {
  const earnedPromoCount = PROMO_BADGE_TYPES.filter(t => earnedBadgeTypes.has(t)).length

  return (
    <Paper elevation={2} sx={{ p: 3, maxWidth: 640, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom fontWeight={700}>
        Documentation Badges
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Earn special promo badges by completing onboarding tasks in our{' '}
        <Link href={storybookUrl} target="_blank" rel="noopener noreferrer">
          Storybook documentation
        </Link>
        . Complete the instructor, learner, or translator paths, then
        sign in on Storybook to claim your badges.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Chip
          label={`${earnedPromoCount} / ${PROMO_BADGE_TYPES.length} badges earned`}
          color={earnedPromoCount === PROMO_BADGE_TYPES.length ? 'success' : 'default'}
          variant="outlined"
          size="small"
        />
      </Box>

      {/* Badge grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
        {PROMO_BADGE_TYPES.map((badgeType) => {
          const config = getBadgeConfig(badgeType)
          const earned = earnedBadgeTypes.has(badgeType)
          return (
            <Stack key={badgeType} alignItems="center" spacing={0.5}>
              <BadgeIcon badgeType={badgeType} size={64} earned={earned} animate={earned} />
              <Typography
                variant="caption"
                fontWeight={earned ? 700 : 400}
                color={earned ? 'text.primary' : 'text.disabled'}
                textAlign="center"
                sx={{ lineHeight: 1.2 }}
              >
                {config.name}
              </Typography>
              <Typography
                variant="caption"
                color="text.disabled"
                textAlign="center"
                sx={{ fontSize: '0.65rem', lineHeight: 1.1 }}
              >
                {config.description}
              </Typography>
            </Stack>
          )
        })}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Instructions */}
      <Typography variant="subtitle2" gutterBottom>
        How to Earn Badges
      </Typography>

      <Typography variant="body2" color="text.secondary" component="div" sx={{ mb: 1 }}>
        <ol style={{ margin: 0, paddingLeft: '1.5em' }}>
          <li>
            Visit the{' '}
            <Link href={storybookUrl} target="_blank" rel="noopener noreferrer">
              Storybook documentation
            </Link>
          </li>
          <li>Complete onboarding tasks (instructor, learner, or translator paths)</li>
          <li>Open the Badge Claim panel in Storybook</li>
          <li>Sign in with your account and click &quot;Claim Badges&quot;</li>
        </ol>
      </Typography>

      {earnedPromoCount === PROMO_BADGE_TYPES.length && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1, textAlign: 'center' }}>
          <Typography variant="body2" color="success.contrastText" fontWeight={700}>
            🏆 All documentation badges earned! You are a Documentation Champion!
          </Typography>
        </Box>
      )}
    </Paper>
  )
}
