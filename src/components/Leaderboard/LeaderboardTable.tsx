/**
 * LeaderboardTable — Mode A: XP-ranked leaderboard for a cohort.
 *
 * Always pins the current student's row even if they're far down.
 * Top 3 get medal emojis.
 *
 * @module LeaderboardTable
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
import Skeleton from '@mui/material/Skeleton'
import Box from '@mui/material/Box'
import { DiceBearAvatar } from '../Gamification/DiceBearAvatar'
import type { AvatarStyleTier, AvatarOverrides } from '../Gamification/DiceBearAvatar'

export interface LeaderboardEntry {
  studentId: string
  studentName: string
  avatarColor: string
  totalXP: number
  level: number
  currentStreak: number
  /** DiceBear style tier from the student's saved config. When undefined, avatar is not yet loaded. */
  avatarStyle?: AvatarStyleTier
  /** DiceBear overrides from the student's saved config. */
  avatarOverrides?: AvatarOverrides
  /** Whether this entry's avatar config has been resolved (true = render avatar, false/undefined = show placeholder). */
  avatarLoaded?: boolean
}

export interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentStudentId: string
  /** Number of top rows to always show. Defaults to 5. */
  topN?: number
}

const MEDALS = ['🥇', '🥈', '🥉']

function StudentAvatar({ entry }: { entry: LeaderboardEntry }) {
  if (!entry.avatarLoaded) {
    return <Skeleton variant="circular" width={24} height={24} />
  }
  return (
    <DiceBearAvatar
      seed={entry.studentId}
      size={24}
      style={entry.avatarStyle || 'simple'}
      overrides={entry.avatarOverrides}
    />
  )
}

export function LeaderboardTable({
  entries,
  currentStudentId,
  topN = 5,
}: LeaderboardTableProps) {
  const sorted = [...entries].sort((a, b) => b.totalXP - a.totalXP)
  const currentIndex = sorted.findIndex(
    (e) => e.studentId === currentStudentId,
  )

  // Determine which rows to show
  const topRows = sorted.slice(0, topN)
  const showGap = currentIndex >= topN
  const currentRow = showGap ? sorted[currentIndex] : null

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Student</TableCell>
            <TableCell align="right">XP</TableCell>
            <TableCell align="right">Lvl</TableCell>
            <TableCell align="right">Streak</TableCell>
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
                  fontWeight: isCurrentUser ? 700 : 400,
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
                <TableCell align="right">{entry.totalXP}</TableCell>
                <TableCell align="right">{entry.level}</TableCell>
                <TableCell align="right">
                  {entry.currentStreak > 0
                    ? `🔥 ${entry.currentStreak}d`
                    : '—'}
                </TableCell>
              </TableRow>
            )
          })}

          {showGap && currentRow && (
            <>
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 0.5 }}>
                  <Typography variant="caption" color="text.disabled">
                    ···
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow
                sx={{ backgroundColor: 'action.selected' }}
              >
                <TableCell>{currentIndex + 1}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StudentAvatar entry={currentRow} />
                    <Typography variant="body2" fontWeight={700}>
                      {currentRow.studentName} (You)
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">{currentRow.totalXP}</TableCell>
                <TableCell align="right">{currentRow.level}</TableCell>
                <TableCell align="right">
                  {currentRow.currentStreak > 0
                    ? `🔥 ${currentRow.currentStreak}d`
                    : '—'}
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default LeaderboardTable
