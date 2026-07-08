/**
 * FastestCompletionsTable — Ranks students by average unit completion time,
 * with on-time submission rate as a secondary signal.
 *
 * Uses StudentProfile.reportCard.timeStats for completion speed and
 * completedAssignments + totalSubmissions to derive on-time rate.
 *
 * @module FastestCompletionsTable
 */

import React from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import { AvatarDisplay } from '../Gamification/AvatarDisplay'
import type { AvatarStyleTier, AvatarOverrides } from '../Gamification/DiceBearAvatar'

export interface FastestCompletionEntry {
  studentId: string
  studentName: string
  /** Average completion time in milliseconds */
  avgTimeMs: number
  /** Fastest single completion in milliseconds */
  fastestTimeMs: number
  /** Total completed assignments */
  completedCount: number
  /** Number of on-time submissions (completed before due date) */
  onTimeCount: number
  /** Total submissions (for on-time rate calculation) */
  totalSubmissions: number
  avatarStyle?: AvatarStyleTier
  avatarOverrides?: AvatarOverrides
  avatarSeed?: string
  avatarLoaded?: boolean
}

export interface FastestCompletionsTableProps {
  entries: FastestCompletionEntry[]
  currentStudentId: string
  topN?: number
}

const MEDALS = ['🥇', '🥈', '🥉']

function formatDuration(ms: number): string {
  if (ms <= 0) return '—'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${totalSeconds}s`
}

function OnTimeChip({ onTimeCount, totalSubmissions }: { onTimeCount: number; totalSubmissions: number }) {
  if (totalSubmissions === 0) return <Typography variant="caption" color="text.disabled">—</Typography>
  const rate = Math.round((onTimeCount / totalSubmissions) * 100)
  const color = rate >= 90 ? 'success' : rate >= 70 ? 'warning' : 'default'
  return (
    <Chip
      label={`${rate}%`}
      color={color}
      size="small"
      variant={rate >= 90 ? 'filled' : 'outlined'}
    />
  )
}

function StudentAvatar({ entry }: { entry: FastestCompletionEntry }) {
  if (!entry.avatarLoaded) {
    return <Skeleton variant="circular" width={24} height={24} />
  }
  return (
    <AvatarDisplay
      seed={entry.avatarSeed || entry.studentId}
      size={24}
      style={entry.avatarStyle || 'simple'}
      overrides={entry.avatarOverrides}
    />
  )
}

/**
 * Scoring: Rank by composite score — weighted average time (lower is better)
 * with a bonus for on-time submissions. Students with no completions sort last.
 */
function computeScore(entry: FastestCompletionEntry): number {
  if (entry.completedCount === 0 || entry.avgTimeMs <= 0) return Infinity
  const onTimeRate = entry.totalSubmissions > 0
    ? entry.onTimeCount / entry.totalSubmissions
    : 0
  // On-time bonus: up to 20% reduction in effective time for perfect on-time rate
  const onTimeMultiplier = 1 - (onTimeRate * 0.2)
  return entry.avgTimeMs * onTimeMultiplier
}

export function FastestCompletionsTable({
  entries,
  currentStudentId,
  topN = 10,
}: FastestCompletionsTableProps) {
  const sorted = [...entries]
    .map((e) => ({ ...e, score: computeScore(e) }))
    .sort((a, b) => a.score - b.score)

  const currentIndex = sorted.findIndex(
    (e) => e.studentId === currentStudentId,
  )

  const topRows = sorted.slice(0, topN)
  const showGap = currentIndex >= topN
  const currentRow = showGap ? sorted[currentIndex] : null

  if (entries.length === 0) return null

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Student</TableCell>
            <TableCell align="right">Avg Time</TableCell>
            <TableCell align="right">Fastest</TableCell>
            <TableCell align="right">Completed</TableCell>
            <TableCell align="right">On-Time</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {topRows.map((entry, index) => {
            const isCurrentUser = entry.studentId === currentStudentId
            const rank = index + 1
            return (
              <TableRow
                key={entry.studentId}
                sx={{
                  backgroundColor: isCurrentUser
                    ? 'action.selected'
                    : undefined,
                }}
              >
                <TableCell>
                  {index < 3 ? MEDALS[index] : rank}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StudentAvatar entry={entry} />
                    <Typography variant="body2" fontWeight={isCurrentUser ? 700 : 400}>
                      {isCurrentUser ? `${entry.studentName} (You)` : entry.studentName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {formatDuration(entry.avgTimeMs)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {formatDuration(entry.fastestTimeMs)}
                  </Typography>
                </TableCell>
                <TableCell align="right">{entry.completedCount}</TableCell>
                <TableCell align="right">
                  <OnTimeChip onTimeCount={entry.onTimeCount} totalSubmissions={entry.totalSubmissions} />
                </TableCell>
              </TableRow>
            )
          })}

          {showGap && currentRow && (
            <>
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 0.5 }}>
                  <Typography variant="caption" color="text.disabled">
                    ···
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow sx={{ backgroundColor: 'action.selected' }}>
                <TableCell>{currentIndex + 1}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StudentAvatar entry={currentRow} />
                    <Typography variant="body2" fontWeight={700}>
                      {currentRow.studentName} (You)
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {formatDuration(currentRow.avgTimeMs)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {formatDuration(currentRow.fastestTimeMs)}
                  </Typography>
                </TableCell>
                <TableCell align="right">{currentRow.completedCount}</TableCell>
                <TableCell align="right">
                  <OnTimeChip onTimeCount={currentRow.onTimeCount} totalSubmissions={currentRow.totalSubmissions} />
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default FastestCompletionsTable
