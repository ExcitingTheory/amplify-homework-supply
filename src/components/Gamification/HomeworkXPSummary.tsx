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
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography variant="body2">{label}</Typography>
      <Typography variant="body2" fontWeight={600} color="success.main">
        +{xp} XP
      </Typography>
    </Box>
  )
}

export function HomeworkXPSummary({
  lineItems,
  totalXP,
  cumulativeXP,
}: HomeworkXPSummaryProps) {
  const levelInfo = getLevelInfo(cumulativeXP)

  return (
    <Card sx={{ border: '2px solid', borderColor: 'success.main', p: 3 }}>
      <Typography variant="h6" fontWeight={700}>
        🏁 Homework Complete!
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Stack spacing={1}>
        {lineItems.map((item, index) => (
          <XPLineItem key={index} label={item.label} xp={item.xp} />
        ))}
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h5" fontWeight={700} color="success.main">
        Total: +{totalXP} XP
      </Typography>
      <LinearProgress
        variant="determinate"
        value={levelInfo.progress * 100}
        sx={{ mt: 2, height: 10, borderRadius: 5 }}
      />
      <Typography variant="caption" color="text.secondary">
        {levelInfo.xpForNextLevel - (cumulativeXP - levelInfo.xpRequired)} XP to
        Level {levelInfo.level + 1}
      </Typography>
    </Card>
  )
}

export default HomeworkXPSummary
