/**
 * Stories for InlineGradeCell
 *
 * Uses OnChangePlugin autosave architecture — cells are always editable.
 * Typing a value debounce-autosaves it; clearing removes the override.
 */

import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { InlineGradeCell, createEmptyHistoryState } from './InlineGradeCell'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box } from '@mui/material'

// Shared history state across all cells in the story
const sharedHistory = createEmptyHistoryState()

const meta: Meta<typeof InlineGradeCell> = {
  title: '📊 Instructor Tools/Inline Grade Cell',
  component: InlineGradeCell,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <Box sx={{ p: 2 }}>
        <Story />
      </Box>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof InlineGradeCell>

export const Default: Story = {
  args: {
    computedGrade: '85% (78%)',
    rawHighest: 85,
    overrideScore: undefined,
    sharedHistory,
    isOwner: true,
    onOverride: (score) => console.log('Autosave override:', score),
    onRemoveOverride: () => console.log('Remove override (field cleared)'),
    onGradeClick: () => console.log('Navigate to grade review'),
  },
}

export const WithOverride: Story = {
  args: {
    ...Default.args,
    overrideScore: 92,
  },
}

export const NoGrade: Story = {
  args: {
    ...Default.args,
    computedGrade: '— (—)',
    rawHighest: undefined,
    overrideScore: undefined,
  },
}

export const StudentView: Story = {
  args: {
    ...Default.args,
    isOwner: false,
  },
}

/**
 * Full gradebook table demonstrating shared undo/redo across cells
 */
export const GradebookTable: Story = {
  render: () => {
    const historyRef = React.useRef(createEmptyHistoryState())
    const [overrides, setOverrides] = React.useState({})

    const students = [
      { id: 's1', name: 'Yuki Tanaka' },
      { id: 's2', name: 'Maria Chen' },
      { id: 's3', name: 'Jordan Smith' },
    ]

    const assignments = [
      { id: 'a1', unitID: 'u1', name: 'Japanese Greetings' },
      { id: 'a2', unitID: 'u2', name: 'Verb Conjugation' },
      { id: 'a3', unitID: 'u3', name: 'Kanji Basics' },
    ]

    const grades = {
      s1: { u1: 92, u2: 78, u3: 88 },
      s2: { u1: 65, u2: 91, u3: 72 },
      s3: { u1: 45, u2: 58, u3: 33 },
    }

    return (
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Click the pencil icon to edit grades inline. Undo/redo (Cmd+Z) is shared across all cells.
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                {assignments.map((a) => (
                  <TableCell key={a.id} align="right">{a.name}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.name}</TableCell>
                  {assignments.map((assignment) => {
                    const raw = grades[student.id]?.[assignment.unitID]
                    const override = overrides[student.id]?.[assignment.unitID]
                    return (
                      <TableCell key={assignment.id} align="right">
                        <InlineGradeCell
                          computedGrade={raw != null ? `${raw}%` : '-'}
                          rawHighest={raw}
                          overrideScore={override?.score}
                          sharedHistory={historyRef.current}
                          isOwner={true}
                          onOverride={(score) => {
                            setOverrides((prev) => ({
                              ...prev,
                              [student.id]: {
                                ...(prev[student.id] || {}),
                                [assignment.unitID]: { score, updatedAt: new Date().toISOString() },
                              },
                            }))
                          }}
                          onRemoveOverride={() => {
                            setOverrides((prev) => {
                              const next = { ...prev }
                              if (next[student.id]) {
                                const s = { ...next[student.id] }
                                delete s[assignment.unitID]
                                if (Object.keys(s).length === 0) delete next[student.id]
                                else next[student.id] = s
                              }
                              return next
                            })
                          }}
                          onGradeClick={() => console.log('Navigate to review:', student.name, assignment.name)}
                        />
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    )
  },
}
