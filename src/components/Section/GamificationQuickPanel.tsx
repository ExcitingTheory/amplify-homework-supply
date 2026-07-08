"use client";
/**
 * GamificationQuickPanel — A compact summary card for instructors showing
 * active campaign chapters and their progress for a given section.
 * Sits inline on the section detail page with a link to full settings.
 *
 * @module GamificationQuickPanel
 */

import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import SettingsIcon from '@mui/icons-material/Settings'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import { useRouter } from 'next/navigation'
import { generateClient } from 'aws-amplify/data'

const client = generateClient()

export interface GamificationQuickPanelProps {
  sectionId: string
  locale?: string
}

interface ChallengeSnapshot {
  id: string
  title: string
  targetXP: number
  currentXP: number
  active: boolean
  deadline?: string | null
  chapterOrder?: number | null
}

export function GamificationQuickPanel({ sectionId, locale = 'en' }: GamificationQuickPanelProps) {
  const router = useRouter()
  const [challenges, setChallenges] = useState<ChallengeSnapshot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sectionId) return
    let cancelled = false

    async function fetch() {
      try {
        const { data } = await (client.models as any).GroupChallenge.list({
          filter: { cohortId: { eq: sectionId } },
        })
        if (!cancelled && data) {
          const items = (data as any[])
            .filter((c) => c != null)
            .map((c) => ({
              id: c.id,
              title: c.title,
              targetXP: c.targetXP,
              currentXP: c.currentXP || 0,
              active: c.active ?? true,
              deadline: c.deadline,
              chapterOrder: c.chapterOrder,
            }))
            .sort((a, b) => (a.chapterOrder ?? 999) - (b.chapterOrder ?? 999))
          setChallenges(items)
        }
      } catch (err) {
        console.warn('[GamificationQuickPanel] Failed to load challenges:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()
    return () => { cancelled = true }
  }, [sectionId])

  const activeChallenges = challenges.filter((c) => c.active)
  const completedCount = challenges.filter((c) => !c.active).length

  if (loading) return null

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEventsIcon color="primary" sx={{ fontSize: '1.3rem' }} />
            <Typography variant="subtitle1" fontWeight={700}>
              Campaign Progress
            </Typography>
          </Box>
          <Button
            size="small"
            startIcon={<SettingsIcon />}
            onClick={() => router.push(`/${locale}/section/${sectionId}/settings/gamification`)}
          >
            Settings
          </Button>
        </Box>

        {challenges.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No campaign chapters configured yet.
          </Typography>
        )}

        {activeChallenges.length > 0 && (
          <Stack spacing={1}>
            {activeChallenges.slice(0, 3).map((ch) => {
              const pct = ch.targetXP > 0 ? Math.min(100, Math.round((ch.currentXP / ch.targetXP) * 100)) : 0
              return (
                <Box key={ch.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: '60%' }}>
                      {ch.chapterOrder != null && `Ch.${ch.chapterOrder}: `}{ch.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {ch.currentXP}/{ch.targetXP} XP ({pct}%)
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={pct} sx={{ height: 5, borderRadius: 2, mt: 0.5 }} />
                </Box>
              )
            })}
            {activeChallenges.length > 3 && (
              <Typography variant="caption" color="text.secondary">
                +{activeChallenges.length - 3} more active
              </Typography>
            )}
          </Stack>
        )}

        {completedCount > 0 && (
          <Chip
            size="small"
            label={`${completedCount} chapter${completedCount > 1 ? 's' : ''} completed`}
            color="success"
            variant="outlined"
            sx={{ mt: 1 }}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default GamificationQuickPanel
