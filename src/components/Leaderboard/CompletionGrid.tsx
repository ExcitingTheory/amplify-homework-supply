/**
 * CompletionGrid — Mode B: Assignment completion status grid.
 *
 * Shows which students have completed which assignments without
 * numeric ranking (lower competitive pressure).
 *
 * @module CompletionGrid
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
import Tooltip from '@mui/material/Tooltip'

export type CompletionStatus = 'completed' | 'in_progress' | 'not_started'

export interface AssignmentColumn {
  id: string
  title: string
}

export interface StudentRow {
  studentId: string
  studentName: string
  assignments: Record<string, CompletionStatus>
}

export interface CompletionGridProps {
  assignments: AssignmentColumn[]
  students: StudentRow[]
  currentStudentId: string
}

const STATUS_ICONS: Record<CompletionStatus, string> = {
  completed: '✅',
  in_progress: '⏳',
  not_started: '⬜',
}

const STATUS_LABELS: Record<CompletionStatus, string> = {
  completed: 'Submitted',
  in_progress: 'In Progress',
  not_started: 'Not Started',
}

export function CompletionGrid({
  assignments,
  students,
  currentStudentId,
}: CompletionGridProps) {
  if (!assignments || !students || assignments.length === 0 || students.length === 0) {
    return null;
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Student</TableCell>
            {assignments.map((a) => (
              <TableCell key={a.id} align="center">
                <Tooltip title={a.title}>
                  <Typography variant="caption" noWrap sx={{ maxWidth: 80, display: 'block' }}>
                    {a.title}
                  </Typography>
                </Tooltip>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((student) => {
            const isCurrentUser = student.studentId === currentStudentId
            return (
              <TableRow
                key={student.studentId}
                sx={{
                  backgroundColor: isCurrentUser
                    ? 'action.selected'
                    : undefined,
                }}
              >
                <TableCell>
                  <Typography
                    variant="body2"
                    fontWeight={isCurrentUser ? 700 : 400}
                  >
                    {isCurrentUser
                      ? `${student.studentName} (You)`
                      : student.studentName}
                  </Typography>
                </TableCell>
                {assignments.map((a) => {
                  const status: CompletionStatus =
                    student.assignments[a.id] || 'not_started'
                  return (
                    <TableCell key={a.id} align="center">
                      <Tooltip title={STATUS_LABELS[status]}>
                        <span>{STATUS_ICONS[status]}</span>
                      </Tooltip>
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default CompletionGrid
