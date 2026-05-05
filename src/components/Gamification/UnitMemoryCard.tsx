/**
 * UnitMemoryCard — Displays a student's adaptive learning data for a specific unit.
 * Shows strong/weak areas, confusion pairs, review priority, and accuracy.
 *
 * @module UnitMemoryCard
 */

import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import LinearProgress from '@mui/material/LinearProgress'
import Skeleton from '@mui/material/Skeleton'
import { generateClient } from 'aws-amplify/data'

const client = generateClient()

export interface UnitMemoryCardProps {
  unitId: string
  studentId: string
}

interface ConceptEntry {
  concept: string
  sourceType: string
  frequency: number
  lastSeen: string
}

interface ConfusionPair {
  item1: string
  item2: string
  frequency: number
}

interface UnitMemoryData {
  weakConcepts: ConceptEntry[]
  strongConcepts: ConceptEntry[]
  confusionPairs: ConfusionPair[]
  averageAccuracy: number
  totalAttempts: number
  reviewPriority: number
  lastPracticedAt: string
}

function getPriorityIndicator(priority: number): { label: string; color: 'error' | 'warning' | 'success' } {
  if (priority >= 0.7) return { label: '🔥 High Priority', color: 'error' }
  if (priority >= 0.4) return { label: '🟡 Medium', color: 'warning' }
  return { label: '🟢 Low', color: 'success' }
}

export function UnitMemoryCard({ unitId, studentId }: UnitMemoryCardProps) {
  const [data, setData] = useState<UnitMemoryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!unitId || !studentId) { setLoading(false); return }

    ;(client as any).models?.StudentMemory?.list?.({
      filter: { studentId: { eq: studentId } },
    })
      .then(({ data: items }: any) => {
        const match = (items || []).find((m: any) => m?.unitID === unitId)
        if (match) {
          setData({
            weakConcepts: match.weakConcepts || [],
            strongConcepts: match.strongConcepts || [],
            confusionPairs: match.confusionPairs || [],
            averageAccuracy: match.averageAccuracy || 0,
            totalAttempts: match.totalAttempts || 0,
            reviewPriority: match.reviewPriority || 0,
            lastPracticedAt: match.lastPracticedAt || '',
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [unitId, studentId])

  if (loading) return <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
  if (!data) return null

  const priority = getPriorityIndicator(data.reviewPriority)

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Your Progress
          </Typography>
          <Chip label={priority.label} size="small" color={priority.color} sx={{ height: 22, fontSize: '0.75rem' }} />
        </Box>

        {/* Accuracy */}
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Average Accuracy
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {Math.round(data.averageAccuracy)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={data.averageAccuracy}
            color={data.averageAccuracy >= 80 ? 'success' : data.averageAccuracy >= 60 ? 'warning' : 'error'}
            sx={{ height: 6, borderRadius: 3 }}
          />
          <Typography variant="caption" color="text.secondary">
            {data.totalAttempts} attempt{data.totalAttempts !== 1 ? 's' : ''}
            {data.lastPracticedAt && ` · Last: ${new Date(data.lastPracticedAt).toLocaleDateString()}`}
          </Typography>
        </Box>

        {/* Strong areas */}
        {data.strongConcepts.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Strengths
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {data.strongConcepts.slice(0, 6).map((c) => (
                <Chip key={c.concept} label={c.concept} size="small" color="success" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
              ))}
            </Stack>
          </Box>
        )}

        {/* Weak areas */}
        {data.weakConcepts.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Needs Review
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {data.weakConcepts.slice(0, 6).map((c) => (
                <Chip key={c.concept} label={c.concept} size="small" color="warning" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
              ))}
            </Stack>
          </Box>
        )}

        {/* Confusion pairs */}
        {data.confusionPairs.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Common Mix-ups
            </Typography>
            {data.confusionPairs.slice(0, 3).map((p, i) => (
              <Typography key={i} variant="body2" sx={{ fontSize: '0.8rem' }}>
                {p.item1} ↔ {p.item2} <Typography component="span" variant="caption" color="text.secondary">(×{p.frequency})</Typography>
              </Typography>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
