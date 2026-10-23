/**
 * PeerReviewAssignmentDialog — Instructor dialog to manually assign a student
 * to review a specific grade.
 *
 * Lets the instructor pick:
 *   1. The grade (whose homework is being reviewed)
 *   2. One or more reviewers (classmates who will give feedback)
 *
 * On submit, calls `onAssign(gradeId, ownerId, reviewerIds)` which the parent
 * wires to `createPeerReviewRoom` server action.
 *
 * @module PeerReviewAssignmentDialog
 */

import React, { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Checkbox from '@mui/material/Checkbox'
import ListItemText from '@mui/material/ListItemText'
import OutlinedInput from '@mui/material/OutlinedInput'
import RateReviewIcon from '@mui/icons-material/RateReview'

export interface AssignmentGrade {
  id: string
  owner: string
  unitID: string
}

export interface SectionStudent {
  id?: string
  userId?: string
  preferredName?: string
  name?: string
}

export interface AssignmentUnit {
  id?: string
  name?: string
}

export interface PeerReviewAssignmentDialogProps {
  open: boolean
  onClose: () => void
  /** Completed grades available for assignment */
  grades: AssignmentGrade[]
  /** Student map: keyed by userId/owner string */
  sectionStudents: Record<string, SectionStudent>
  /** Unit map: keyed by unit ID */
  units: Record<string, AssignmentUnit>
  /** Called when the instructor confirms the assignment */
  onAssign: (gradeId: string, ownerId: string, reviewerIds: string[]) => Promise<void>
}

function displayName(student: SectionStudent | undefined, fallback: string): string {
  if (!student) return fallback
  return student.preferredName || student.name || fallback
}

export function PeerReviewAssignmentDialog({
  open,
  onClose,
  grades,
  sectionStudents,
  units,
  onAssign,
}: PeerReviewAssignmentDialogProps) {
  const t = useTranslations('components')
  const [selectedGradeId, setSelectedGradeId] = useState<string>('')
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedGrade = useMemo(
    () => grades.find((g) => g.id === selectedGradeId),
    [grades, selectedGradeId],
  )

  // Students that can be chosen as reviewers (anyone except the grade owner)
  const eligibleReviewers = useMemo(() => {
    const ownerId = selectedGrade?.owner
    return Object.entries(sectionStudents)
      .filter(([key]) => key !== ownerId)
      .map(([key, student]) => ({ key, student }))
  }, [selectedGrade, sectionStudents])

  const handleGradeChange = (gradeId: string) => {
    setSelectedGradeId(gradeId)
    setSelectedReviewers([])
    setError(null)
  }

  const handleReviewerToggle = (reviewerId: string) => {
    setSelectedReviewers((prev) =>
      prev.includes(reviewerId) ? prev.filter((r) => r !== reviewerId) : [...prev, reviewerId],
    )
  }

  const handleSubmit = async () => {
    if (!selectedGradeId || selectedReviewers.length === 0) {
      setError(t('peerReviewAssignmentDialog.selectionRequired'))
      return
    }
    if (!selectedGrade) return

    setSubmitting(true)
    setError(null)

    try {
      await onAssign(selectedGradeId, selectedGrade.owner, selectedReviewers)
      handleClose()
    } catch (err: any) {
      setError(err?.message || t('peerReviewAssignmentDialog.assignFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (submitting) return
    setSelectedGradeId('')
    setSelectedReviewers([])
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RateReviewIcon color="primary" />
        {t('peerReviewAssignmentDialog.title')}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('peerReviewAssignmentDialog.description')}
        </Typography>

        {/* Grade (homework) selector */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="grade-select-label">
            {t('peerReviewAssignmentDialog.homeworkLabel')}
          </InputLabel>
          <Select
            labelId="grade-select-label"
            value={selectedGradeId}
            label={t('peerReviewAssignmentDialog.homeworkLabel')}
            onChange={(e) => handleGradeChange(e.target.value)}
          >
            {grades.map((grade) => {
              const studentKey = Object.keys(sectionStudents).find(
                (k) => k === grade.owner,
              )
              const student = studentKey ? sectionStudents[studentKey] : undefined
              const name = displayName(student, grade.owner)
              const unitName = units[grade.unitID]?.name || grade.unitID
              return (
                <MenuItem key={grade.id} value={grade.id}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {unitName}
                    </Typography>
                  </Box>
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>

        {/* Reviewer(s) selector — multi-select checkboxes */}
        {selectedGradeId && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="reviewer-select-label">
              {t('peerReviewAssignmentDialog.reviewersLabel')}
            </InputLabel>
            <Select
              labelId="reviewer-select-label"
              multiple
              value={selectedReviewers}
              input={<OutlinedInput label={t('peerReviewAssignmentDialog.reviewersLabel')} />}
              renderValue={(selected) => (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {selected.map((id) => {
                    const student = sectionStudents[id]
                    return (
                      <Chip key={id} label={displayName(student, id)} size="small" />
                    )
                  })}
                </Stack>
              )}
            >
              {eligibleReviewers.map(({ key, student }) => (
                <MenuItem key={key} value={key} onClick={() => handleReviewerToggle(key)}>
                  <Checkbox checked={selectedReviewers.includes(key)} />
                  <ListItemText primary={displayName(student, key)} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          {t('peerReviewAssignmentDialog.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !selectedGradeId || selectedReviewers.length === 0}
          startIcon={submitting ? <CircularProgress size={16} /> : <RateReviewIcon />}
        >
          {submitting
            ? t('peerReviewAssignmentDialog.assigning')
            : t('peerReviewAssignmentDialog.assignReview')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PeerReviewAssignmentDialog
