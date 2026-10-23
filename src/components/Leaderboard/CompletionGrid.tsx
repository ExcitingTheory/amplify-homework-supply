/**
 * CompletionGrid — Assignment completion status grid.
 *
 * Two layout modes:
 * - **Single student**: Vertical list of assignments with status — no student
 *   name column (the student already knows who they are).
 * - **Multi-student** (instructor view): Traditional grid with students as rows
 *   and assignments as columns, using full readable names.
 *
 * @module CompletionGrid
 */

import React from 'react'
import { useTranslations } from 'next-intl'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'

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

const STATUS_CONFIG: Record<
  CompletionStatus,
  {
    getLabel: (t: ReturnType<typeof useTranslations>) => string
    color: 'success' | 'warning' | 'default'
    icon: React.ReactElement
  }
> = {
  completed: {
    getLabel: (t) => t('completionGrid.statusCompleted'),
    color: 'success',
    icon: <CheckCircleIcon fontSize="small" />,
  },
  in_progress: {
    getLabel: (t) => t('completionGrid.statusInProgress'),
    color: 'warning',
    icon: <HourglassBottomIcon fontSize="small" />,
  },
  not_started: {
    getLabel: (t) => t('completionGrid.statusNotStarted'),
    color: 'default',
    icon: <RadioButtonUncheckedIcon fontSize="small" />,
  },
}

function StatusChip({ status }: { status: CompletionStatus }) {
  const t = useTranslations('components')
  const config = STATUS_CONFIG[status]
  return (
    <Chip
      icon={config.icon}
      label={config.getLabel(t)}
      color={config.color}
      size="small"
      variant={status === 'not_started' ? 'outlined' : 'filled'}
    />
  )
}

/**
 * Single-student view — vertical list of assignments with status chips.
 */
function SingleStudentGrid({
  assignments,
  student,
}: {
  assignments: AssignmentColumn[]
  student: StudentRow
}) {
  const t = useTranslations('components')
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('completionGrid.assignmentHeader')}</TableCell>
            <TableCell align="right">{t('completionGrid.statusHeader')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assignments.map((a) => {
            const status: CompletionStatus =
              (student.assignments || {})[a.id] || 'not_started'
            return (
              <TableRow key={a.id}>
                <TableCell>
                  <Typography variant="body2">{a.title}</Typography>
                </TableCell>
                <TableCell align="right">
                  <StatusChip status={status} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

/**
 * Multi-student view — students as rows, assignments as columns.
 */
function MultiStudentGrid({
  assignments,
  students,
  currentStudentId,
}: CompletionGridProps) {
  const t = useTranslations('components')
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 400 }}>
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                position: 'sticky',
                left: 0,
                bgcolor: 'background.paper',
                zIndex: 1,
                minWidth: 140,
              }}
            >
              {t('completionGrid.studentHeader')}
            </TableCell>
            {assignments.map((a) => (
              <TableCell
                key={a.id}
                align="center"
                sx={{ minWidth: 120, whiteSpace: 'normal', lineHeight: 1.3 }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {a.title}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((student, index) => {
            const isCurrentUser = student.studentId === currentStudentId
            return (
              <TableRow
                key={student.studentId}
                sx={{
                  backgroundColor: isCurrentUser
                    ? 'action.selected'
                    : index % 2 === 1
                      ? 'action.hover'
                      : undefined,
                  '& td, & th': { backgroundColor: 'inherit' },
                }}
              >
                <TableCell
                  sx={{
                    position: 'sticky',
                    left: 0,
                    bgcolor: isCurrentUser ? 'action.selected' : index % 2 === 1 ? 'action.hover' : 'background.paper',
                    zIndex: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={isCurrentUser ? 700 : 400}
                  >
                    {student.studentName}
                  </Typography>
                </TableCell>
                {assignments.map((a) => {
                  const status: CompletionStatus =
                    (student.assignments || {})[a.id] || 'not_started'
                  return (
                    <TableCell key={a.id} align="center">
                      <StatusChip status={status} />
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

export function CompletionGrid({
  assignments,
  students,
  currentStudentId,
}: CompletionGridProps) {
  if (!assignments || !students || assignments.length === 0 || students.length === 0) {
    return null
  }

  // Single student — use the simpler vertical layout
  if (students.length === 1) {
    return <SingleStudentGrid assignments={assignments} student={students[0]} />
  }

  return (
    <MultiStudentGrid
      assignments={assignments}
      students={students}
      currentStudentId={currentStudentId}
    />
  )
}

export default CompletionGrid
