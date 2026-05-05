/**
 * NailedItWall — "Wall of Excellence" grid for a student's profile.
 *
 * @module NailedItWall
 */

import React from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

export interface NailedItBlock {
  id: string
  question: string
  nailedItReason: string
  homeworkTitle: string
  createdAt: string
}

export interface NailedItWallProps {
  blocks: NailedItBlock[]
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString()
  } catch {
    return dateStr
  }
}

export function NailedItWall({ blocks }: NailedItWallProps) {
  if (!blocks || blocks.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No Nailed It moments yet — keep going!
      </Typography>
    )
  }

  return (
    <Grid container spacing={2}>
      {blocks.map((block) => (
        <Grid size={{ xs: 12, sm: 6 }} key={block.id}>
          <Card
            sx={{ borderLeft: '4px solid', borderColor: 'success.main' }}
          >
            <CardContent>
              <Typography variant="overline" color="success.main">
                🎯 Nailed It
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {block.question}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                component="p"
                mt={1}
              >
                {block.nailedItReason}
              </Typography>
              <Typography
                variant="caption"
                display="block"
                color="text.disabled"
                mt={0.5}
              >
                {block.homeworkTitle} · {formatDate(block.createdAt)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

export default NailedItWall
