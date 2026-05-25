/**
 * SkillTreeEditor — Multi-unit skill creation form with minimum accuracy.
 *
 * Lets instructors pick multiple units that must all be completed above
 * a minimum accuracy threshold for the skill to be mastered.
 *
 * @module SkillTreeEditor
 */

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Autocomplete from '@mui/material/Autocomplete'
import Chip from '@mui/material/Chip'
import Slider from '@mui/material/Slider'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'
import SaveIcon from '@mui/icons-material/Save'
import SchoolIcon from '@mui/icons-material/School'

// ============================================================================
// Types
// ============================================================================

export interface UnitOption {
  id: string
  name: string
}

export interface SkillOption {
  id: string
  title: string
}

export interface SkillTreeEditorData {
  title: string
  description?: string
  unitIds: string[]
  minimumAccuracy: number
  xpReward: number
  prerequisites: string[]
}

export interface SkillTreeEditorProps {
  /** Available units for linking */
  availableUnits?: UnitOption[]
  /** Available skills for prerequisites */
  availableSkills?: SkillOption[]
  /** Initial data for editing (omit for create mode) */
  initialData?: Partial<SkillTreeEditorData>
  /** Called when form is submitted */
  onSubmit: (data: SkillTreeEditorData) => void
  /** Disable during submission */
  submitting?: boolean
}

// ============================================================================
// Component
// ============================================================================

export function SkillTreeEditor({
  availableUnits = [],
  availableSkills = [],
  initialData,
  onSubmit,
  submitting = false,
}: SkillTreeEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [selectedUnits, setSelectedUnits] = useState<UnitOption[]>(
    initialData?.unitIds
      ? availableUnits.filter((u) => initialData.unitIds!.includes(u.id))
      : []
  )
  const [minimumAccuracy, setMinimumAccuracy] = useState(initialData?.minimumAccuracy ?? 70)
  const [xpReward, setXpReward] = useState(initialData?.xpReward ?? 100)
  const [selectedPrereqs, setSelectedPrereqs] = useState<SkillOption[]>(
    initialData?.prerequisites
      ? availableSkills.filter((s) => initialData.prerequisites!.includes(s.id))
      : []
  )

  const isValid = title.trim().length > 0 && selectedUnits.length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    onSubmit({
      title,
      description: description || undefined,
      unitIds: selectedUnits.map((u) => u.id),
      minimumAccuracy,
      xpReward,
      prerequisites: selectedPrereqs.map((s) => s.id),
    })
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Stack direction="row" spacing={1} alignItems="center">
              <SchoolIcon color="primary" />
              <Typography variant="h6">
                {initialData?.title ? 'Edit Skill' : 'Create Multi-Unit Skill'}
              </Typography>
            </Stack>

            <TextField
              label="Skill Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Async Programming Mastery"
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={2}
              placeholder="Optional description of what this skill represents"
            />

            {/* Multi-unit selection */}
            <Autocomplete
              multiple
              options={availableUnits}
              getOptionLabel={(opt) => opt.name}
              value={selectedUnits}
              onChange={(_, val) => setSelectedUnits(val)}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                  <Chip
                    label={option.name}
                    {...getTagProps({ index })}
                    key={option.id}
                    color="primary"
                    variant="outlined"
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Required Units"
                  required
                  helperText="All selected units must be completed to master this skill"
                />
              )}
            />

            {selectedUnits.length > 0 && (
              <Alert severity="info" icon={false}>
                Student must complete {selectedUnits.length} unit{selectedUnits.length > 1 ? 's' : ''} with
                at least {minimumAccuracy}% accuracy to master this skill.
              </Alert>
            )}

            {/* Minimum accuracy slider */}
            <Box>
              <Typography gutterBottom>
                Minimum Accuracy: {minimumAccuracy}%
              </Typography>
              <Slider
                value={minimumAccuracy}
                onChange={(_, val) => setMinimumAccuracy(val as number)}
                min={0}
                max={100}
                step={5}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 50, label: '50%' },
                  { value: 70, label: '70%' },
                  { value: 100, label: '100%' },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            {/* XP Reward */}
            <TextField
              label="XP Reward"
              type="number"
              value={xpReward}
              onChange={(e) => setXpReward(Math.max(0, parseInt(e.target.value) || 0))}
              InputProps={{
                startAdornment: <InputAdornment position="start">⚡</InputAdornment>,
              }}
              helperText="XP awarded when the skill is mastered"
            />

            {/* Prerequisites */}
            <Autocomplete
              multiple
              options={availableSkills}
              getOptionLabel={(opt) => opt.title}
              value={selectedPrereqs}
              onChange={(_, val) => setSelectedPrereqs(val)}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                  <Chip
                    label={option.title}
                    {...getTagProps({ index })}
                    key={option.id}
                    variant="outlined"
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Prerequisite Skills"
                  helperText="Skills that must be mastered before this one becomes available"
                />
              )}
            />

            {/* Submit */}
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={!isValid || submitting}
            >
              {initialData?.title ? 'Save Skill' : 'Create Skill'}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}
