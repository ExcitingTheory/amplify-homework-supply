/**
 * @fileoverview PracticeDrillDocRef — Badge showing a document page reference
 * for practice blocks derived from uploaded PDFs/documents.
 */

import React from 'react'
import { Chip, Tooltip } from '@mui/material'
import DescriptionIcon from '@mui/icons-material/Description'
import { useTranslation } from 'next-i18next'

// ============================================================================
// Types
// ============================================================================

export interface PracticeDrillDocRefProps {
  filename: string
  page: number | string
}

// ============================================================================
// Component
// ============================================================================

export default function PracticeDrillDocRef({ filename, page }: PracticeDrillDocRefProps) {
  const { t } = useTranslation('components')

  const label = `${filename}, p. ${page}`

  return (
    <Tooltip title={t('practiceDrill.docRef.tooltip', 'Reference: {{filename}}, page {{page}}', { filename, page })}>
      <Chip
        size="small"
        icon={<DescriptionIcon />}
        label={label}
        variant="outlined"
        sx={{ mb: 1 }}
      />
    </Tooltip>
  )
}
