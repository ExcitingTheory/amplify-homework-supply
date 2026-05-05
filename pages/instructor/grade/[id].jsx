/**
 * Instructor Grade Review Page
 *
 * Route: /instructor/grade/[id]
 * Query params:
 *   - id: gradeId (the specific grade to review)
 *   - unitId: optional, pre-fetched unit ID
 *   - studentName: optional, display name
 *   - sectionId: optional, for back navigation
 *
 * Displays the student's completed workbook with all attempts,
 * wrong answer gutter annotations, moderation panel, and grade override.
 */

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import nextI18nextConfig from '../../../next-i18next.config'
import { getAmplifyClient } from '../../../src/utils/amplifyClient'
import { getCurrentUser } from 'aws-amplify/auth'

import {
  Box,
  AppBar,
  Typography,
  Button,
  IconButton,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import AppSkeleton from '../../../src/components/AppSkeleton'
import MyAuth from '../../../src/components/AmplifyAuthenticator'
import MainToolbar from '../../../src/components/MainToolbar'
import { GradedWorkbookViewer } from '../../../src/components/GradedWorkbookViewer'

function InstructorGradeReview() {
  const { t } = useTranslation(['pages', 'components'])
  const router = useRouter()
  const { id: gradeId, unitId: queryUnitId, studentName: queryStudentName, sectionId } = router.query

  const client = getAmplifyClient()

  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [unit, setUnit] = useState(null)
  const [grades, setGrades] = useState([])
  const [studentName, setStudentName] = useState(queryStudentName || 'Student')
  const [moderation, setModeration] = useState(null)

  // Grade override dialog
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [overrideScore, setOverrideScore] = useState('')
  const [overrideSaving, setOverrideSaving] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  // Fetch grade and related data
  useEffect(() => {
    if (!gradeId) return

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch the target grade
        const { data: grade, errors: gradeErrors } = await client.models.Grade.get({ id: gradeId })
        if (gradeErrors?.length) throw new Error(gradeErrors[0].message)
        if (!grade) throw new Error('Grade not found')

        const targetUnitId = grade.unitID || queryUnitId
        if (!targetUnitId) throw new Error('No unit ID found on grade')

        // Fetch the unit content
        const { data: unitData, errors: unitErrors } = await client.models.Unit.get({ id: targetUnitId })
        if (unitErrors?.length) throw new Error(unitErrors[0].message)
        if (!unitData) throw new Error('Unit not found')
        setUnit(unitData)

        // Fetch ALL grades for this student + unit (all attempts)
        const { data: allGrades, errors: allGradesErrors } = await client.models.Grade.list({
          filter: {
            unitID: { eq: targetUnitId },
            owner: { eq: grade.owner },
          },
        })
        if (allGradesErrors?.length) throw new Error(allGradesErrors[0].message)

        // Sort by createdAt descending (newest first)
        const sortedGrades = (allGrades || [])
          .filter(g => g != null && g.id != null)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((g, index) => ({
            id: g.id,
            attempt: g.attempt || sortedGrades?.length - index || index + 1,
            accuracy: g.accuracy || 0,
            percentComplete: g.percentComplete || 0,
            complete: g.complete || false,
            data: parseJson(g.data),
            feedback: parseJson(g.feedback),
            moderationStatus: g.moderationStatus || g.moderation?.status || null,
            moderationFlags: parseJson(g.moderationFlags) || g.moderation?.flags || null,
            moderationCheckedAt: g.moderationCheckedAt || g.moderation?.checkedAt || null,
            createdAt: g.createdAt,
            updatedAt: g.updatedAt,
          }))

        // Re-number attempts
        sortedGrades.forEach((g, i) => {
          g.attempt = sortedGrades.length - i
        })

        setGrades(sortedGrades)

        // Set moderation from latest grade
        const latest = sortedGrades[0]
        if (latest) {
          setModeration({
            status: latest.moderationStatus,
            flags: latest.moderationFlags,
            checkedAt: latest.moderationCheckedAt,
          })
        }

        // Try to resolve student name if not passed in query
        if (!queryStudentName && grade.owner) {
          setStudentName(grade.owner)
        }
      } catch (err) {
        console.error('[InstructorGradeReview] Error fetching data:', err)
        setError(err.message || 'Failed to load grade data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [gradeId, queryUnitId])

  // Grade override handlers
  const handleOverrideOpen = () => {
    const currentGrade = grades[0]
    setOverrideScore(currentGrade?.accuracy?.toString() || '')
    setOverrideOpen(true)
  }

  const handleOverrideClose = () => {
    setOverrideOpen(false)
    setOverrideScore('')
  }

  const handleOverrideSave = async () => {
    const score = parseFloat(overrideScore)
    if (isNaN(score) || score < 0 || score > 100) {
      setSnackbar({ open: true, message: 'Score must be between 0 and 100', severity: 'error' })
      return
    }

    setOverrideSaving(true)
    try {
      const targetGrade = grades[0]
      if (!targetGrade) throw new Error('No grade to override')

      const { errors } = await client.models.Grade.update({
        id: targetGrade.id,
        accuracy: score,
        percentComplete: 100,
        complete: true,
      })

      if (errors?.length) throw new Error(errors[0].message)

      // Update local state
      setGrades(prev => prev.map((g, i) =>
        i === 0 ? { ...g, accuracy: score, complete: true, percentComplete: 100 } : g
      ))

      setSnackbar({ open: true, message: `Grade updated to ${score}%`, severity: 'success' })
      handleOverrideClose()
    } catch (err) {
      console.error('[InstructorGradeReview] Override save error:', err)
      setSnackbar({ open: true, message: 'Failed to save grade override', severity: 'error' })
    } finally {
      setOverrideSaving(false)
    }
  }

  // Moderation action handler
  const handleModerationAction = useCallback(async (action, targetGradeId) => {
    try {
      if (action === 'approve') {
        await client.models.Grade.update({
          id: targetGradeId,
          moderationStatus: 'approved',
          moderationCheckedAt: new Date().toISOString(),
        })
        setModeration(prev => ({ ...prev, status: 'approved', checkedAt: new Date().toISOString() }))
        setSnackbar({ open: true, message: 'Content approved', severity: 'success' })
      } else if (action === 'flag') {
        await client.models.Grade.update({
          id: targetGradeId,
          moderationStatus: 'flagged',
          moderationCheckedAt: new Date().toISOString(),
        })
        setModeration(prev => ({ ...prev, status: 'flagged', checkedAt: new Date().toISOString() }))
        setSnackbar({ open: true, message: 'Content flagged', severity: 'warning' })
      } else if (action === 'recheck') {
        // TODO: Call moderation Lambda to re-check content
        setSnackbar({ open: true, message: 'Moderation re-check requested', severity: 'info' })
      }
    } catch (err) {
      console.error('[InstructorGradeReview] Moderation action error:', err)
      setSnackbar({ open: true, message: 'Moderation action failed', severity: 'error' })
    }
  }, [client])

  // Back navigation
  const handleBack = () => {
    if (sectionId) {
      router.push(`/section/${sectionId}`)
    } else {
      router.back()
    }
  }

  return (
    <>
      <AppBar
        position="fixed"
        color="default"
        sx={{
          backgroundColor: 'custom.glassNavbar',
          backdropFilter: 'blur(8px)',
        }}
      >
        <MainToolbar>
          <IconButton edge="start" onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Grade Review
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleOverrideOpen}
            disabled={loading || grades.length === 0}
          >
            Override Grade
          </Button>
        </MainToolbar>
      </AppBar>

      <Box sx={{ mt: '5rem', p: 2, maxWidth: '1400px', mx: 'auto' }}>
        {loading && (
          <Box sx={{ py: 4, maxWidth: '1400px', mx: 'auto' }}>
            <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1, mb: 2 }} />
            <Skeleton variant="text" width="60%" height={24} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && unit && grades.length > 0 && (
          <GradedWorkbookViewer
            contentJson={typeof unit.data === 'string' ? unit.data : JSON.stringify(unit.data)}
            studentName={studentName}
            grades={grades}
            moderation={moderation}
            onModerationAction={handleModerationAction}
            maxHeight="75vh"
          />
        )}

        {!loading && !error && grades.length === 0 && (
          <Alert severity="info">
            No grade data found for this submission.
          </Alert>
        )}
      </Box>

      {/* Grade Override Dialog */}
      <Dialog open={overrideOpen} onClose={handleOverrideClose}>
        <DialogTitle>Override Grade</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Student: <strong>{studentName}</strong><br />
            Unit: <strong>{unit?.name || '—'}</strong><br />
            Current Grade: <strong>{grades[0]?.accuracy != null ? `${Math.round(grades[0].accuracy)}%` : 'No grade'}</strong>
            <br /><br />
            Enter the new grade percentage (0–100):
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Grade (%)"
            type="number"
            fullWidth
            variant="outlined"
            value={overrideScore}
            onChange={(e) => setOverrideScore(e.target.value)}
            inputProps={{ min: 0, max: 100, step: 0.01 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleOverrideClose} disabled={overrideSaving}>Cancel</Button>
          <Button
            onClick={handleOverrideSave}
            variant="contained"
            color="primary"
            disabled={overrideSaving}
          >
            {overrideSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function parseJson(value) {
  if (!value) return null
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

// ============================================================================
// Page wrapper with auth
// ============================================================================

function WrappedPage() {
  return (
    <MyAuth>
      <InstructorGradeReview />
    </MyAuth>
  )
}

export default WrappedPage

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'pages',
        'components',
      ], nextI18nextConfig)),
    },
  }
}
