/**
 * HomeworkXPSummary — XP breakdown card shown when a student
 * completes a homework assignment.
 *
 * @module HomeworkXPSummary
 */

import React from 'react'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { useTranslations } from 'next-intl'
import LinearProgress from '@mui/material/LinearProgress'
import { getLevelInfo } from '../../utils/xpCalculation'

export interface XPLineItemData {
  label: string
  xp: number
}

export interface HomeworkXPSummaryProps {
  lineItems: XPLineItemData[]
  totalXP: number
  /** Student's total XP after this homework. */
  cumulativeXP: number
}

function XPLineItem({ label, xp }: XPLineItemData) {
  const t = useTranslations('components')
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography variant="body2">{label}</Typography>
      <Typography variant="body2" fontWeight={600} color="success.main">
        {t('homeworkXPSummary.lineItemXp', { xp })}
      </Typography>
    </Box>
  )
}

export function HomeworkXPSummary({
  lineItems,
  totalXP,
  cumulativeXP,
}: HomeworkXPSummaryProps) {
  const t = useTranslations('components')
  const levelInfo = getLevelInfo(cumulativeXP)

  return (
    <Card sx={{ border: '2px solid', borderColor: 'success.main', p: 3 }}>
      <Typography variant="h6" fontWeight={700}>
        {t('homeworkXPSummary.title')}
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Stack spacing={1}>
        {lineItems.map((item, index) => (
          <XPLineItem key={index} label={item.label} xp={item.xp} />
        ))}
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h5" fontWeight={700} color="success.main">
        {t('homeworkXPSummary.total', { totalXP })}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={levelInfo.progress * 100}
        sx={{ mt: 2, height: 10, borderRadius: 5 }}
      />
      <Typography variant="caption" color="text.secondary">
        {t('homeworkXPSummary.xpToNextLevel', {
          xp: (levelInfo.xpForNextLevel ?? 0) - (cumulativeXP - levelInfo.xpRequired),
          level: levelInfo.level + 1,
        })}
      </Typography>
    </Card>
  )
}

export default HomeworkXPSummary
