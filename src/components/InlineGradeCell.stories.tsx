/**
 * Stories for InlineGradeCell
 *
 * Uses OnChangePlugin autosave architecture — cells are always editable.
 * Typing a value debounce-autosaves it; clearing removes the override.
 */

import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, expect, userEvent, within } from 'storybook/test'
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
    onOverride: fn(),
    onRemoveOverride: fn(),
    onGradeClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // View mode: grade displayed as text
    await canvas.findByText('85% (78%)')

    // Click the grade to enter edit mode
    const gradeSpan = canvas.getByText('85% (78%)')
    await userEvent.click(gradeSpan)

    // Edit field should now be visible
    const editField = await canvas.findByRole('textbox', { name: /Grade override/i })
    expect(editField).toBeInTheDocument()

    // Type an override value
    await userEvent.type(editField, '92')

    // Tab away to trigger save (blur flush)
    await userEvent.tab()
  },
}

export const WithOverride: Story = {
  args: {
    ...Default.args,
    overrideScore: 92,
    onOverride: fn(),
    onRemoveOverride: fn(),
    onGradeClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Override shown in blue
    await canvas.findByText('92%')

    // Click to open editor
    const gradeSpan = canvas.getByText('92%')
    await userEvent.click(gradeSpan)

    // Wait for edit mode: ContentEditable appears
    const editField = await canvas.findByRole('textbox', { name: /Grade override/i })
    expect(editField).toBeInTheDocument()

    // Remove override button appears when editing && hasOverride
    const removeBtn = await canvas.findByRole('button')
    await userEvent.click(removeBtn)

    // After removing, edit mode closes (setEditing(false) is called)
    // View mode grade text reappears
    await canvas.findByText('92%')
  },
}

export const NoGrade: Story = {
  args: {
    ...Default.args,
    computedGrade: '— (—)',
    rawHighest: undefined,
    overrideScore: undefined,
    onOverride: fn(),
    onRemoveOverride: fn(),
    onGradeClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Shows dash placeholder in view mode
    await canvas.findByText('— (—)')
    // Click to open edit mode
    await userEvent.click(canvas.getByText('— (—)'))
    await canvas.findByRole('textbox', { name: /Grade override/i })
  },
}

export const StudentView: Story = {
  args: {
    ...Default.args,
    isOwner: false,
    onOverride: fn(),
    onRemoveOverride: fn(),
    onGradeClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    // Grade visible in read-only mode
    await canvas.findByText('85% (78%)')
    // Clicking triggers navigation, not edit mode
    await userEvent.click(canvas.getByText('85% (78%)'))
    expect(args.onGradeClick).toHaveBeenCalled()
    // No edit field in student view
    expect(canvas.queryByRole('textbox', { name: /Grade override/i })).toBeNull()
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

    const grades: Record<string, Record<string, number>> = {
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
                    const override = (overrides as Record<string, Record<string, { score: number }>>)[student.id]?.[assignment.unitID]
                    return (
                      <TableCell key={assignment.id} align="right">
                        <InlineGradeCell
                          computedGrade={raw != null ? `${raw}%` : '-'}
                          rawHighest={raw}
                          overrideScore={override?.score}
                          sharedHistory={historyRef.current}
                          isOwner={true}
                          onOverride={(score) => {
                            setOverrides((prev: Record<string, Record<string, { score: number; updatedAt: string }>>) => ({
                              ...prev,
                              [student.id]: {
                                ...(prev[student.id] || {}),
                                [assignment.unitID]: { score, updatedAt: new Date().toISOString() },
                              },
                            }))
                          }}
                          onRemoveOverride={() => {
                            setOverrides((prev: Record<string, Record<string, { score: number; updatedAt: string }>>) => {
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
