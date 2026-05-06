/**
 * SectionSelector — Dropdown selector for instructor's sections.
 * Used at the top of the gamification admin page to scope all queries/mutations
 * by the selected section (cohortId).
 *
 * @module SectionSelector
 */

import React from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import SchoolIcon from '@mui/icons-material/School'

// ============================================================================
// Types
// ============================================================================

export interface SectionOption {
  id: string
  name: string
  description?: string
  studentCount?: number
}

export interface SectionSelectorProps {
  /** Available sections to choose from */
  sections: SectionOption[]
  /** Currently selected section ID (controlled) */
  selectedSectionId?: string | null
  /** Called when the user selects a different section */
  onSectionChange: (sectionId: string | null) => void
  /** Loading state */
  loading?: boolean
  /** Disable the selector */
  disabled?: boolean
}

// ============================================================================
// Component
// ============================================================================

export function SectionSelector({
  sections,
  selectedSectionId,
  onSectionChange,
  loading = false,
  disabled = false,
}: SectionSelectorProps) {
  const selectedSection = React.useMemo(
    () => sections.find((s) => s.id === selectedSectionId) || null,
    [sections, selectedSectionId]
  )

  return (
    <Box sx={{ mb: 3 }}>
      <Autocomplete
        options={sections}
        value={selectedSection}
        onChange={(_, newValue) => {
          onSectionChange(newValue?.id || null)
        }}
        getOptionLabel={(option) => option.name || ''}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        loading={loading}
        disabled={disabled}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <SchoolIcon fontSize="small" color="action" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">{option.name}</Typography>
                {option.description && (
                  <Typography variant="caption" color="text.secondary">
                    {option.description}
                  </Typography>
                )}
              </Box>
              {option.studentCount != null && (
                <Chip
                  label={`${option.studentCount} students`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              )}
            </Box>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Section"
            placeholder="Select a section to manage..."
            size="small"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <SchoolIcon fontSize="small" color="action" sx={{ ml: 0.5, mr: 0.5 }} />
                  {params.InputProps.startAdornment}
                </>
              ),
            }}
          />
        )}
        noOptionsText="No sections available"
        sx={{ maxWidth: 400 }}
      />
      {!selectedSectionId && sections.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Select a section to scope gamification settings.
        </Typography>
      )}
    </Box>
  )
}

export default SectionSelector
