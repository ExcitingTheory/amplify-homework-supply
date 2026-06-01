/**
 * OpenCollaborationRooms — Instructor panel showing all active HomeworkRooms
 * for a section, categorized by type.
 *
 * Room types:
 *  - Peer Review: room.ownerId === grade.owner (student created their own review room)
 *  - Tutoring:    room.ownerId !== grade.owner (instructor or another party opened the room)
 *
 * Instructor controls:
 *  - Assign Peer Review: opens dialog to manually pair a student's grade with reviewer(s)
 *  - Random Assign: auto-pairs all unassigned students for a selected unit
 *  - Award Top Reviewer: finds student with most reviews for a unit and gives bonus XP
 *
 * @module OpenCollaborationRooms
 */

import React, { useState, useMemo } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import RateReviewIcon from '@mui/icons-material/RateReview'
import SchoolIcon from '@mui/icons-material/School'
import ShuffleIcon from '@mui/icons-material/Shuffle'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { PeerReviewAssignmentDialog } from './PeerReviewAssignmentDialog'
import type {
  AssignmentGrade,
  SectionStudent,
  AssignmentUnit,
} from './PeerReviewAssignmentDialog'

// ============================================================================
// Types
// ============================================================================

export interface OpenRoom {
  id: string
  gradeId: string
  ownerId: string
  code?: string | null
  status: 'OPEN' | 'IN_REVIEW' | 'REVIEW_COMPLETE'
  invitedUserIds?: string[] | null
  createdAt?: string | null
}

export interface OpenCollaborationRoomsProps {
  rooms: OpenRoom[]
  /** All grades for the section (used to resolve unit names and detect room type) */
  grades: AssignmentGrade[]
  /** Unit map keyed by unitID */
  units: Record<string, AssignmentUnit>
  /** Student map keyed by owner/userId string */
  sectionStudents: Record<string, SectionStudent>
  sectionId: string
  /** Whether the current user is the section instructor */
  isInstructor: boolean
  /** Called to navigate to a room */
  onJoinRoom: (roomId: string) => void
  /** Called with (gradeId, ownerId, reviewerIds) to create a review room */
  onAssignPeerReview: (
    gradeId: string,
    ownerId: string,
    reviewerIds: string[],
  ) => Promise<void>
  /** Called to randomly pair unassigned students for the given unit */
  onRandomAssign: (unitId: string) => Promise<void>
  /** Called to award top reviewer XP for the given unit */
  onAwardTopReviewer: (unitId: string) => Promise<void>
}

// ============================================================================
// Helpers
// ============================================================================

function studentDisplayName(
  sectionStudents: Record<string, SectionStudent>,
  ownerId: string,
): string {
  const student = sectionStudents[ownerId]
  if (!student) return ownerId
  return student.preferredName || student.name || ownerId
}

type RoomCategory = 'peer_review' | 'tutoring'

function categorizeRoom(
  room: OpenRoom,
  gradeOwnerById: Record<string, string>,
): RoomCategory {
  const gradeOwner = gradeOwnerById[room.gradeId]
  // If the person who opened the room owns the grade → peer review
  // If someone else opened it (e.g. instructor) → tutoring
  if (!gradeOwner || gradeOwner === room.ownerId) return 'peer_review'
  return 'tutoring'
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_REVIEW: 'In Progress',
}

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'default'> = {
  OPEN: 'success',
  IN_REVIEW: 'warning',
}

// ============================================================================
// Component
// ============================================================================

export function OpenCollaborationRooms({
  rooms,
  grades,
  units,
  sectionStudents,
  sectionId,
  isInstructor,
  onJoinRoom,
  onAssignPeerReview,
  onRandomAssign,
  onAwardTopReviewer,
}: OpenCollaborationRoomsProps) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedUnitId, setSelectedUnitId] = useState<string>('')
  const [randomAssigning, setRandomAssigning] = useState(false)
  const [awardingXP, setAwardingXP] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  // Build quick-lookup: gradeId → ownerId
  const gradeOwnerById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const grade of grades) {
      map[grade.id] = grade.owner
    }
    return map
  }, [grades])

  // Build quick-lookup: gradeId → unitID
  const gradeUnitById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const grade of grades) {
      map[grade.id] = grade.unitID
    }
    return map
  }, [grades])

  // Separate rooms into peer review vs tutoring
  const { peerReviewRooms, tutoringRooms } = useMemo(() => {
    const peerReviewRooms: OpenRoom[] = []
    const tutoringRooms: OpenRoom[] = []
    for (const room of rooms) {
      const category = categorizeRoom(room, gradeOwnerById)
      if (category === 'tutoring') {
        tutoringRooms.push(room)
      } else {
        peerReviewRooms.push(room)
      }
    }
    return { peerReviewRooms, tutoringRooms }
  }, [rooms, gradeOwnerById])

  // Unit options for instructor actions (units that have completed grades)
  const unitOptions = useMemo(() => {
    const unitIds = new Set(grades.map((g) => g.unitID).filter(Boolean))
    return Array.from(unitIds).map((uid) => ({
      id: uid,
      name: units[uid]?.name || uid,
    }))
  }, [grades, units])

  // Completed grades (for assignment dialog — only show grades that don't have rooms yet)
  const assignableGrades = useMemo(() => {
    const assignedGradeIds = new Set(rooms.map((r) => r.gradeId))
    return grades.filter((g) => !assignedGradeIds.has(g.id))
  }, [grades, rooms])

  const handleRandomAssign = async () => {
    if (!selectedUnitId) {
      setSnackbar({ open: true, message: 'Select a unit first', severity: 'error' })
      return
    }
    setRandomAssigning(true)
    try {
      await onRandomAssign(selectedUnitId)
      setSnackbar({ open: true, message: 'Peer reviews randomly assigned!', severity: 'success' })
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.message || 'Failed to assign', severity: 'error' })
    } finally {
      setRandomAssigning(false)
    }
  }

  const handleAwardTopReviewer = async () => {
    if (!selectedUnitId) {
      setSnackbar({ open: true, message: 'Select a unit first', severity: 'error' })
      return
    }
    setAwardingXP(true)
    try {
      await onAwardTopReviewer(selectedUnitId)
      setSnackbar({
        open: true,
        message: 'Top reviewer XP awarded!',
        severity: 'success',
      })
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.message || 'Failed to award XP',
        severity: 'error',
      })
    } finally {
      setAwardingXP(false)
    }
  }

  const handleAssign = async (gradeId: string, ownerId: string, reviewerIds: string[]) => {
    await onAssignPeerReview(gradeId, ownerId, reviewerIds)
    setSnackbar({ open: true, message: 'Peer review room created!', severity: 'success' })
  }

  if (rooms.length === 0 && !isInstructor) return null

  return (
    <Card elevation={2} sx={{ borderRadius: 2, width: '100%' }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MeetingRoomIcon color="primary" />
            <Typography variant="h6">Open Collaboration Rooms</Typography>
            {rooms.length > 0 && (
              <Chip label={rooms.length} size="small" color="primary" />
            )}
          </Box>

          {/* Instructor controls */}
          {isInstructor && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<PersonAddIcon />}
              onClick={() => setAssignDialogOpen(true)}
              disabled={assignableGrades.length === 0}
            >
              Assign Peer Review
            </Button>
          )}
        </Box>

        {/* Instructor: unit selector + bulk actions */}
        {isInstructor && (
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              mb: 2,
              alignItems: 'center',
              flexWrap: 'wrap',
              p: 1.5,
              bgcolor: 'action.hover',
              borderRadius: 1,
            }}
          >
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="unit-select-label">Unit</InputLabel>
              <Select
                labelId="unit-select-label"
                value={selectedUnitId}
                label="Unit"
                onChange={(e) => setSelectedUnitId(e.target.value)}
              >
                <MenuItem value="">
                  <em>Select a unit…</em>
                </MenuItem>
                {unitOptions.map((unit) => (
                  <MenuItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Tooltip title="Randomly pair students who haven't been assigned a peer reviewer yet for the selected unit">
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  startIcon={
                    randomAssigning ? <CircularProgress size={14} /> : <ShuffleIcon />
                  }
                  onClick={handleRandomAssign}
                  disabled={randomAssigning || !selectedUnitId}
                >
                  Random Assign
                </Button>
              </span>
            </Tooltip>

            <Tooltip title="Award bonus XP to the student who gave the most peer reviews for this unit. 3× in a row earns the Peer Review Champion badge!">
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={
                    awardingXP ? <CircularProgress size={14} /> : <EmojiEventsIcon />
                  }
                  onClick={handleAwardTopReviewer}
                  disabled={awardingXP || !selectedUnitId}
                >
                  Award Top Reviewer
                </Button>
              </span>
            </Tooltip>
          </Box>
        )}

        {rooms.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No open collaboration rooms yet.
          </Typography>
        ) : (
          <>
            {/* Peer Review Rooms */}
            {peerReviewRooms.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <RateReviewIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" color="primary">
                    Peer Review
                  </Typography>
                  <Chip label={peerReviewRooms.length} size="small" color="primary" variant="outlined" />
                </Box>
                <RoomsTable
                  rooms={peerReviewRooms}
                  sectionStudents={sectionStudents}
                  gradeUnitById={gradeUnitById}
                  units={units}
                  onJoinRoom={onJoinRoom}
                />
              </Box>
            )}

            {/* Tutoring Rooms */}
            {tutoringRooms.length > 0 && (
              <Box>
                {peerReviewRooms.length > 0 && <Divider sx={{ my: 2 }} />}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SchoolIcon fontSize="small" color="secondary" />
                  <Typography variant="subtitle2" color="secondary">
                    Instructor Tutoring
                  </Typography>
                  <Chip label={tutoringRooms.length} size="small" color="secondary" variant="outlined" />
                </Box>
                <RoomsTable
                  rooms={tutoringRooms}
                  sectionStudents={sectionStudents}
                  gradeUnitById={gradeUnitById}
                  units={units}
                  onJoinRoom={onJoinRoom}
                />
              </Box>
            )}
          </>
        )}
      </CardContent>

      {/* Assignment dialog */}
      {isInstructor && (
        <PeerReviewAssignmentDialog
          open={assignDialogOpen}
          onClose={() => setAssignDialogOpen(false)}
          grades={assignableGrades}
          sectionStudents={sectionStudents}
          units={units}
          onAssign={handleAssign}
        />
      )}

      {/* Feedback snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  )
}

// ============================================================================
// RoomsTable — shared table used for both categories
// ============================================================================

function RoomsTable({
  rooms,
  sectionStudents,
  gradeUnitById,
  units,
  onJoinRoom,
}: {
  rooms: OpenRoom[]
  sectionStudents: Record<string, SectionStudent>
  gradeUnitById: Record<string, string>
  units: Record<string, AssignmentUnit>
  onJoinRoom: (roomId: string) => void
}) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Student</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Reviewer(s)</TableCell>
            <TableCell>Code</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rooms.map((room) => {
            const ownerName = studentDisplayName(sectionStudents, room.ownerId)
            const unitId = gradeUnitById[room.gradeId]
            const unitName = unitId ? (units[unitId]?.name || unitId) : '—'
            const reviewers = (room.invitedUserIds ?? []).map((uid) =>
              studentDisplayName(sectionStudents, uid),
            )

            return (
              <TableRow key={room.id} hover>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                    {ownerName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                    {unitName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {reviewers.length > 0
                      ? reviewers.map((name) => (
                          <Chip key={name} label={name} size="small" variant="outlined" />
                        ))
                      : <Typography variant="caption" color="text.secondary">—</Typography>}
                  </Stack>
                </TableCell>
                <TableCell>
                  {room.code ? (
                    <Chip label={room.code} size="small" variant="outlined" />
                  ) : (
                    <Typography variant="caption" color="text.secondary">—</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={STATUS_LABELS[room.status] ?? room.status}
                    size="small"
                    color={STATUS_COLORS[room.status] ?? 'default'}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    endIcon={<OpenInNewIcon fontSize="small" />}
                    onClick={() => onJoinRoom(room.id)}
                  >
                    Join
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default OpenCollaborationRooms
